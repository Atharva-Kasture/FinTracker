const API_BASE = "http://localhost:8000/api";

// Get JWT token from browser storage
const getToken = () => localStorage.getItem("token");

export const api = {
  // Sign up a new user
  // Returns: { access_token, token_type }
  signup: async (username, email, password) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });
    return res.json();
  },

  // Log in existing user
  // Returns: { access_token, token_type }
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  // Log in as a temporary guest (no credentials needed)
  // Returns: { access_token, token_type }
  guestLogin: async () => {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: "POST"
    });
    return res.json();
  },
  
  // Upload CSV file with transactions
  // Returns: { analysis_id, transaction_count }
  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload?token=${getToken()}`, {
      method: "POST",
      body: formData
    });
    return res.json();
  },

  // Run agent analysis on transactions
  // Returns: { analysis_id, summary, patterns }
  analyze: async (analysisId) => {
    const res = await fetch(`${API_BASE}/analyze/${analysisId}?token=${getToken()}`, {
      method: "POST"
    });
    return res.json();
  },

  // Ask a follow-up question about the analysis
  // Returns: { question, answer }
  chat: async (analysisId, question) => {
    const res = await fetch(`${API_BASE}/chat/${analysisId}?token=${getToken()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    return res.json();
  }
};
