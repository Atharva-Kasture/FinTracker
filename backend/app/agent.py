 # Importing necessary libraries
import requests
import json
from typing import List, Dict

OLLAMA_URL = "http://localhost:11434/api/generate"

 # call_ollama function sends a request to the Ollama API to generate a response.
def call_ollama(prompt: str) -> str:
    """Call Ollama (Mistral) with a prompt"""
    response = requests.post(
        OLLAMA_URL,
        json={"model": "mistral", "prompt": prompt, "stream": False}
    )
    return response.json()["response"]

def run_agent(transactions: List[Dict]) -> Dict:
    """Run 3-step agent on transactions"""
    
    # Format transactions for Claude
    tx_text = "\n".join([
        f"Date: {tx['date']}, Description: {tx['description']}, Amount: ${tx['amount']}"
        for tx in transactions
    ])
    
    # Step 1: Categorize
    categorize_prompt = f"""Categorize these transactions into categories like Food, Rent, Transport, Entertainment, Utilities, Other.
Return ONLY a JSON object mapping each transaction description to a category.

Transactions:
{tx_text}

JSON output (no other text):"""
    
    categories_response = call_ollama(categorize_prompt)
    try:
        categories = json.loads(categories_response)
    except:
        categories = {}
    
    # Step 2: Identify patterns and anomalies
    patterns_prompt = f"""Analyze these transactions and identify:
1. Spending patterns (what categories they spend most on)
2. Anomalies (unusually large transactions)
3. Trends (any notable patterns)

Transactions with categories:
{json.dumps(list(zip([tx['description'] for tx in transactions], categories.values())), indent=2)}

Total amount: ${sum(float(tx['amount']) for tx in transactions)}

Provide a brief analysis:"""
    
    patterns_response = call_ollama(patterns_prompt)
    
    # Step 3: Generate summary and suggestions
    summary_prompt = f"""Based on this financial analysis, provide:
1. A brief summary of spending habits
2. 3-5 actionable suggestions for better financial management

Analysis:
{patterns_response}

Provide practical, concise advice:"""
    
    summary_response = call_ollama(summary_prompt)
    
    return {
        "summary": summary_response,
        "patterns": patterns_response,
        "categorized_transactions": categories
    }

def answer_question(question: str, transactions: List[Dict]) -> str:
    """Answer a follow-up question about transactions"""
    
    # Format transactions for context
    tx_text = "\n".join([
        f"Date: {tx['date']}, Description: {tx['description']}, Amount: ${tx['amount']}"
        for tx in transactions
    ])
    
    # Calculate some quick stats
    total = sum(float(tx['amount']) for tx in transactions)
    avg = total / len(transactions) if transactions else 0
    
    # Create prompt with full context
    answer_prompt = f"""You are a financial advisor analyzing a user's transactions.

Here are all the transactions:
{tx_text}

Summary Statistics:
- Total Amount: ${total:.2f}
- Average Transaction: ${avg:.2f}
- Number of Transactions: {len(transactions)}

User Question: {question}

Based on the transactions provided, answer the user's question concisely and specifically. Use actual numbers from the data.
Answer:"""
    
    # Get answer from Ollama
    answer = call_ollama(answer_prompt)
    
    return answer