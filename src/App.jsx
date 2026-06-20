import { useState } from 'react';
import { api } from './api';
import './App.css';

export default function App() {
  const [page, setPage] = useState('login'); // 'login', 'upload', 'results'
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [analysisId, setAnalysisId] = useState(null);
  const [results, setResults] = useState(null);

  // Handle signup
  const handleSignup = async (username, email, password) => {
    const res = await api.signup(username, email, password);
    if (res.access_token) {
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      setPage('upload');
    }
  };

  // Handle login
  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    if (res.access_token) {
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      setPage('upload');
    }
  };

  // Handle CSV upload
  const handleUpload = async (file) => {
    const res = await api.uploadCSV(file);
    if (res.analysis_id) {
      setAnalysisId(res.analysis_id);
      // Auto-analyze
      const analyzeRes = await api.analyze(res.analysis_id);
      setResults(analyzeRes);
      setPage('results');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setPage('login');
    setResults(null);
    setAnalysisId(null);
  };

  return (
    <div className="app">
      <header>
        <h1>💰 Finance Tracker</h1>
        {token && <button onClick={handleLogout}>Logout</button>}
      </header>

      {page === 'login' && <LoginPage onSignup={handleSignup} onLogin={handleLogin} />}
      {page === 'upload' && <UploadPage onUpload={handleUpload} />}
      {page === 'results' && <ResultsPage results={results} analysisId={analysisId} />}
    </div>
  );
}

// Login Component
function LoginPage({ onSignup, onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'signup') {
      onSignup(username, email, password);
    } else {
      onLogin(username, password);
    }
  };

  return (
    <div className="page login-page">
      <form onSubmit={handleSubmit}>
        <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        
        {mode === 'signup' && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
        
        <p>
          {mode === 'login' ? 'Need an account? ' : 'Have an account? '}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </form>
    </div>
  );
}

// Upload Component
function UploadPage({ onUpload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      setLoading(true);
      await onUpload(file);
      setLoading(false);
    }
  };

  return (
    <div className="page upload-page">
      <h2>Upload Transaction CSV</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload & Analyze'}
        </button>
      </form>
    </div>
  );
}

// Results Component
function ResultsPage({ results, analysisId }) {
  const [question, setQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');

  const handleChat = async (e) => {
    e.preventDefault();
    const res = await api.chat(analysisId, question);
    setChatResponse(res.answer);
    setQuestion('');
  };

  return (
    <div className="page results-page">
      <h2>Analysis Results</h2>
      
      <div className="summary">
        <h3>Summary</h3>
        <p>{results?.summary}</p>
      </div>

      <div className="chat">
        <h3>Ask Questions</h3>
        <form onSubmit={handleChat}>
          <input
            type="text"
            placeholder="Ask about your spending..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button type="submit">Ask</button>
        </form>
        {chatResponse && <p className="response">{chatResponse}</p>}
      </div>
    </div>
  );
}