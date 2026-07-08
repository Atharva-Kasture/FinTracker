#Importing libraries
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from io import StringIO
import csv
from app.db import init_db, get_db
from app.models import User, Analysis, Transaction, ChatMessage
from app.schemas import UserSignUp, UserLogin, Token
from app.auth import hash_password, verify_password, create_access_token, verify_token
from app.agent import run_agent

app = FastAPI(title="Finance Tracker API")

# Create database tables on startup
init_db()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create a test endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Signup endpoint
@app.post("/api/auth/signup", response_model=Token)
def signup(user: UserSignUp, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    hashed_pw = hash_password(user.password)
    new_user = User(username=user.username, email=user.email, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Return token
    token = create_access_token({"sub": str(new_user.id)})
    return {"access_token": token, "token_type": "bearer"}

# Login endpoint
@app.post("/api/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Find user
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Return token
    token = create_access_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """Verify JWT token and return the user"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/api/upload")
def upload_csv(file: UploadFile = File(...), token: str = "", db: Session = Depends(get_db)):
    """Upload CSV and save transactions"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = int(payload.get("sub"))
    
    # Parse CSV
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(StringIO(content))
    
    transactions = []
    for row in reader:
        transactions.append({
            "date": row.get("date"),
            "description": row.get("description"),
            "amount": float(row.get("amount", 0))
        })
    
    # Create analysis record
    analysis = Analysis(
        user_id=user_id,
        summary="Pending analysis...",
        patterns={},
        flags={},
        total_transactions=len(transactions)
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Save transactions
    for tx in transactions:
        db_tx = Transaction(
            analysis_id=analysis.id,
            date=tx["date"],
            description=tx["description"],
            amount=tx["amount"]
        )
        db.add(db_tx)
    db.commit()
    
    return {"analysis_id": analysis.id, "transaction_count": len(transactions)}

@app.post("/api/analyze/{analysis_id}")
def analyze(analysis_id: int, token: str = "", db: Session = Depends(get_db)):
    """Run agent analysis on transactions"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = int(payload.get("sub"))
    
    # Get analysis
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == user_id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Get transactions
    transactions = db.query(Transaction).filter(
        Transaction.analysis_id == analysis_id
    ).all()
    
    tx_list = [
        {"date": tx.date, "description": tx.description, "amount": float(tx.amount)}
        for tx in transactions
    ]
    
    # Run agent
    result = run_agent(tx_list)
    
    # Save results
    analysis.summary = result["summary"]
    analysis.patterns = result["patterns"]
    db.commit()
    
    return {
        "analysis_id": analysis.id,
        "summary": result["summary"],
        "patterns": result["patterns"]
    }

class ChatRequest(BaseModel):
    question: str

@app.post("/api/chat/{analysis_id}")
def chat(analysis_id: int, request: ChatRequest, token: str = "", db: Session = Depends(get_db)):
    """Answer follow-up questions about analysis"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = int(payload.get("sub"))
    
    # Get analysis
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == user_id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Get transactions
    transactions = db.query(Transaction).filter(
        Transaction.analysis_id == analysis_id
    ).all()
    
    tx_list = [
        {"date": tx.date, "description": tx.description, "amount": float(tx.amount)}
        for tx in transactions
    ]
    
    # Call agent to answer the question
    from app.agent import answer_question
    answer = answer_question(request.question, tx_list)
    
    # Save chat message
    chat_msg = ChatMessage(
        analysis_id=analysis_id,
        question=request.question,
        answer=answer
    )
    db.add(chat_msg)
    db.commit()
    
    return {
        "question": request.question,
        "answer": answer
    }

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)