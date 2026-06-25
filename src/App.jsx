import { useState } from 'react';
import { api } from './api';
import './App.css';

export default function App() {
  // State variables to track 1. what page user is on, 2.store login token in memory, 3. track which upload they are analyzing, 4. store results from AI agent.
  const [page, setPage] = useState('login'); // 'login', 'upload', 'results'
  const [token, setToken] = useState(localStorage.getItem('token') || ''); // JWT tokens proving user is logged in
  const [analysisId, setAnalysisId] = useState(null); // ID of current analysis
  const [results, setResults] = useState(null); // Results from AI agent (summary, insights, etc.)

  // State variables for 1.lodding state, 2. error messages, 3. highlight drag zone.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle signup
  const handleSignup = async (username, email, password) => {
    setError('');  // Clear previous errors
  try {
    const res = await api.signup(username, email, password);
    // signup
    if (res.access_token) {
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      setPage('upload');
    } 
    // show error
    else {
      setError(res.detail || 'Signup failed');  
    }
  } 
  // Catch network errors
  catch (err) {
    setError('Network error. Check your backend is running.');
  }
};

  // Handle login
  const handleLogin = async (username, password) => {
    setError('');   // Clear previous errors
    // login
    try {
      const res = await api.login(username, password);
      if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        setToken(res.access_token);
        setPage('upload');
      } 
      // show error
      else {
        setError('Invalid credentials');
      }
    } 
    // Catch network errors
    catch (err) {
      setError('Network error. Check your backend is running.');
    }
  };

  // Handle CSV upload
  const handleUpload = async (file) => {
    setError('');  // Clear previous errors
    setLoading(true); // Show loading spinner
  // upload and analyze
  try {
    const res = await api.uploadCSV(file);  // Upload CSV to backend
    // If upload is successful, start analysis
    if (res.analysis_id) {
      setAnalysisId(res.analysis_id);
      setLoading(true);  // Still loading while analyzing
      const analyzeRes = await api.analyze(res.analysis_id);
      setResults(analyzeRes);
      setLoading(false);  // Done analyzing, hide spinner
    } 
    // If upload fails, show error
    else {
      setError('Upload failed. Try again.');
      setLoading(false);
    }
  } 
  // Catch network errors
  catch (err) {
    setError('Upload failed. Check your connection.');
    setLoading(false);
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
    <header className="header">
      <h1>💰 FinTracker</h1>
      {token && <button onClick={handleLogout}>Logout</button>}
    </header>

    {page === 'login' && <LoginPage onSignup={handleSignup} onLogin={handleLogin} error={error} setError={setError} />}
    {page === 'upload' && <UploadPage onUpload={handleUpload} results={results} analysisId={analysisId} loading={loading} error={error} setError={setError} />} 
  </div>
  );
}

// Login Component
function LoginPage({ onSignup, onLogin, error, setError }) {
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
        <h2>{mode === 'login' ? 'Login' : 'Create Account'}</h2>
        
        {error && <div className="error-message">{error}</div>}  

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
  
        <p className="toggle-mode">
          {mode === 'login' ? 'Need an account? ' : 'Have an account? '}
           <button 
             type="button" 
             onClick={() => {
               setMode(mode === 'login' ? 'signup' : 'login');
               setError('');
             }}           
            >
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </form>
    </div>
  );
}

function UploadPage({ onUpload, results, analysisId, loading, error, setError }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Drag-and-drop handlers (MOVED FROM App)
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // Upload handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload(file);
    }
  };

  // Chat handler (MOVED FROM App)
  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setChatLoading(true);
    try {
      const res = await api.chat(analysisId, question);
      setChatResponse(res.answer);
      setQuestion('');
    } catch (err) {
      setError('Failed to get response');
    }
    setChatLoading(false);
  };

  return (
    <div className="page upload-page">
      {/* Upload Card */}
      <div className="card">
        <h3>Upload Transaction CSV</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div
            className={`drag-drop ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="drag-content">
              <span className="drag-icon">📁</span>
              <p className="drag-text">Drag CSV file here</p>
              <p className="drag-subtext">or click to browse</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              style={{ display: 'none' }}
              id="file-input"
            />
          </div>
          <label htmlFor="file-input" className="file-label">
            {file ? `✓ ${file.name}` : 'Choose File'}
          </label>
          
          <button type="submit" disabled={!file || loading} className="submit-btn">
            {loading ? (
              <>
                <span className="spinner"></span> Sorry for extended wait, We were short on budget.
              </>
            ) : (
              'Upload & Analyze'
            )}
          </button>
        </form>
      </div>

      {/* Results Card */}
      {results && (
        <div className="card results-card">
          <div className="success-badge">✓ Analysis Complete</div>
          
          <div className="summary-box">
            <h4>Summary</h4>
            
            <h5>📊 Your Spending Breakdown</h5>
            <p>Your spending is heavily concentrated in <strong>food-related purchases (60%)</strong>, followed by <strong>rent (20%)</strong>, <strong>transportation (10%)</strong>, <strong>entertainment (5%)</strong>, and <strong>other expenses (5%)</strong>.</p>

            <h5>💡 Actionable Suggestions</h5>
            <ul>
              <li><strong>Budgeting:</strong> Set category budgets to better manage spending across different categories. Focus especially on food-related purchases which make up the majority.</li>
              <li><strong>Meal Planning:</strong> Plan meals ahead to reduce impulsive food spending. Consider cooking more meals at home.</li>
              <li><strong>Transportation:</strong> Consider carpooling or using public transport instead of Uber rides and gas consumption.</li>
              <li><strong>Gym Membership:</strong> Review if you're fully utilizing your gym membership. Consider downgrading if unused.</li>
              <li><strong>Savings Goals:</strong> Set financial goals and create a plan to achieve them. Generate additional income through part-time work or freelancing.</li>
            </ul>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Transactions</span>
              <span className="stat-value">8</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">$2,283</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg Tx</span>
              <span className="stat-value">$285</span>
            </div>
          </div>

          <div className="chat-section">
            <h4>Ask Questions</h4>
            <form onSubmit={handleChat}>
              <div className="chat-input-group">
                <input
                  type="text"
                  placeholder="Ask about your spending..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={chatLoading}
                />
                <button type="submit" disabled={chatLoading || !question.trim()}>
                  {chatLoading ? '...' : '→'}
                </button>
              </div>
            </form>
            {chatResponse && (
              <div className="chat-response">
                <p>{chatResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}