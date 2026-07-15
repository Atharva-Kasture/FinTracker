# FinTracker

A personal finance tracker with an AI agent that categorizes transactions, detects spending patterns, and answers follow-up questions about your finances — built as a full-stack portfolio project.

**Live demo:** https://fin-tracker-wheat-kappa.vercel.app
**Backend API:** https://fintracker-production-fcaf.up.railway.app

---

## What it does

Upload a CSV of bank transactions and the app:

1. **Categorizes** each transaction (Food, Rent, Transport, Entertainment, etc.)
2. **Analyzes patterns and anomalies** — spending concentration, unusually large transactions, notable trends
3. **Generates a plain-English summary** with actionable suggestions
4. **Answers follow-up questions** about your spending in natural language, grounded in your actual transaction data

The AI runs as a multi-step agent rather than a single prompt — it categorizes, then analyzes patterns, then summarizes, using the output of each step as input to the next.

Guest access is available — no signup required to try the full flow, including real AI analysis.

---

## Tech Stack

- **Backend:** FastAPI (Python), SQLAlchemy, SQLite
- **Frontend:** React (Vite)
- **AI:** Locally-run Ollama (Mistral) in development; Groq's hosted API in production
- **Auth:** JWT-based, with a temporary-guest-account flow reusing the same authenticated routes as real users
- **Deployment:** Railway (backend), Vercel (frontend)

---

## Architecture notes

**Swappable LLM provider.** The agent layer (`backend/app/agent.py`) doesn't hard-code a single AI provider. An `LLM_PROVIDER` environment variable switches between:
- `ollama` — calls a local Ollama server running Mistral (used in development; Ollama needs real memory to run inference, so it isn't deployed to the cloud for this project)
- `groq` — calls Groq's hosted API (used in production, so the live demo has a fully working AI pipeline without needing a paid always-on GPU server)

Same prompts, same 3-step reasoning, same code path either way — only the underlying call changes.

**Guest access.** Rather than special-casing a "guest mode" throughout the codebase, clicking "Continue as Guest" creates a real, temporary `User` row in the database (flagged `is_guest=True`) with a randomly generated username/email and a normal JWT token. From that point on, a guest is indistinguishable from a real signed-up user to every other route — same upload, analyze, and chat endpoints, no extra logic required.

---

## Running locally

### Prerequisites
- Python 3.10
- Node.js
- [Ollama](https://ollama.com) installed locally, with the `mistral` model pulled (`ollama pull mistral`)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:

```
DATABASE_URL=sqlite:///./finance_tracker.db
SECRET_KEY=<any random string>
LLM_PROVIDER=ollama
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

Start Ollama in a separate terminal (`ollama serve`, if it isn't already running), then start the backend:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Known limitations

Being upfront about what this project doesn't do, since a portfolio project should be honest about its scope:

- **SQLite on Railway does not persist across redeploys.** Every time the backend is redeployed, the database resets. This is a deliberate tradeoff to keep hosting free — a production version would use a persistent volume or a hosted Postgres instance.
- **No automatic cleanup job for guest accounts.** Guest rows accumulate in the database over time (though in practice, they're wiped along with everything else on each redeploy, given the point above).
- **Auth tokens are passed as query parameters** (`?token=...`) rather than in the `Authorization` header on a few endpoints. This is simpler to implement but not best practice for a production app handling financial data — tokens in URLs can end up in server logs. A future improvement would move this to headers.
- **Groq's model lineup changes over time.** The `GROQ_MODEL` environment variable exists specifically so the model name can be updated without a code change if a model is deprecated.

---

## Project structure

```
FinTracker/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI routes
│   │   ├── models.py     # SQLAlchemy models (User, Analysis, Transaction, ChatMessage)
│   │   ├── auth.py       # Password hashing, JWT creation/verification
│   │   ├── agent.py      # AI agent logic (Ollama/Groq)
│   │   ├── config.py     # Environment-based settings
│   │   └── db.py         # Database session/engine setup
│   ├── requirements.txt
│   └── runtime.txt       # Pins Python version for deployment
└── frontend/
    └── src/
        ├── App.jsx        # Main app, login, upload/results pages
        └── api.js         # Backend API client
```
