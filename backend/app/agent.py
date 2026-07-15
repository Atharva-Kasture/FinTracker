# Importing necessary libraries
import os
import requests
import json
from typing import List, Dict

OLLAMA_URL = "http://localhost:11434/api/generate"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Which provider to use: "ollama" (local) or "groq" (cloud, for deployment)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def call_ollama(prompt: str) -> str:
    """Call local Ollama (Mistral) with a prompt"""
    response = requests.post(
        OLLAMA_URL,
        json={"model": "mistral", "prompt": prompt, "stream": False}
    )
    return response.json()["response"]


def call_groq(prompt: str) -> str:
    """Call Groq's hosted API with a prompt (used in production/deployment)"""
    response = requests.post(
        GROQ_URL,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    return response.json()["choices"][0]["message"]["content"]


def call_llm(prompt: str) -> str:
    """Route to whichever provider is configured"""
    if LLM_PROVIDER == "groq":
        return call_groq(prompt)
    return call_ollama(prompt)


def run_agent(transactions: List[Dict]) -> Dict:
    """Run 3-step agent on transactions"""
    
    # Format transactions for the LLM
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
    
    categories_response = call_llm(categorize_prompt)
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
    
    patterns_response = call_llm(patterns_prompt)
    
    # Step 3: Generate summary and suggestions
    summary_prompt = f"""Based on this financial analysis, provide:
1. A brief summary of spending habits
2. 3-5 actionable suggestions for better financial management

Analysis:
{patterns_response}

Provide practical, concise advice:"""
    
    summary_response = call_llm(summary_prompt)
    
    return {
        "summary": summary_response,
        "patterns": patterns_response,
        "categorized_transactions": categories
    }


def answer_question(question: str, transactions: List[Dict]) -> str:
    """Answer a follow-up question about transactions"""
    
    tx_text = "\n".join([
        f"Date: {tx['date']}, Description: {tx['description']}, Amount: ${tx['amount']}"
        for tx in transactions
    ])
    
    total = sum(float(tx['amount']) for tx in transactions)
    avg = total / len(transactions) if transactions else 0
    
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
    
    return call_llm(answer_prompt)