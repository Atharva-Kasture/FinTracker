import { useState } from 'react';
import { api } from './api';
import './App.css';
import logo from './assets/logo.png';
import HeaderLogo from './assets/HeaderLogo.png';

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
      <img src={HeaderLogo} alt="FinTracker" className="header-logo" style={{ height: '200px' }} />
      {token && page !== 'login' && (
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      )}
    </header>

    {page === 'login' && (
      <div style={{ width: '100vw', flex: 1, margin: 0, padding: 0, position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', display: 'flex' }}>
        <LoginPage onSignup={handleSignup} onLogin={handleLogin} error={error} setError={setError} />
      </div>
    )}
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
    <div className="login-wrapper">
      {/* LEFT SIDE: GREEN BLOCK WITH MESSAGE */}
      <div className="login-left">
      <img src={logo} alt="FinTracker" className="login-logo" style={{ height: '200px' }} />
        <h2>Welcome Back!</h2>
        <h4>Smart spending insights powered by AI.</h4>
        <p>Upload your transactions and get instant analysis, patterns, and actionable recommendations.</p>
        <ul className="benefits-list">
          <li><span className="checkmark">✓</span> Fast AI analysis</li>
          <li><span className="checkmark">✓</span> Privacy focused</li>
          <li><span className="checkmark">✓</span> Ask follow-up questions</li>
        </ul>
        <button 
          type="button"
          className="toggle-login-btn"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Create Account' : 'Sign In'}
        </button>
      </div>

      {/* RIGHT SIDE: WHITE FORM */}
      <div className="login-right">
        <h3>{mode === 'login' ? 'Sign In' : 'Create Account'}</h3>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="toggle-text">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* ACCENT SHAPES */}
      <div className="accent-red"></div>
      <div className="accent-yellow"></div>
    </div>
  );
}

// Upload Component
function UploadPage({ onUpload, results, analysisId, loading, error, setError }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [question, setQuestion] = useState('');
  const [displayedQuestion, setDisplayedQuestion] = useState('');
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
    setDisplayedQuestion(question);   // Store the question being asked
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
                <span className="spinner"></span> This may take a while, We were short on budget.
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
                  {chatLoading ? (
                    <>
                      <span className="spinner"></span>
                    </>
                  ) : (
                   '→'
                  )}
                </button>
              </div>
            </form>
            <div className={`chat-response${chatResponse && !chatLoading ? '' : ' chat-response--center'}`}>
              {chatLoading ? (
                <div className="chat-loading">
                  <span className="spinner"></span> Thinking...
                </div>
              ) : chatResponse ? (
                <>
                  <h5 style={{ color: '#25671E', marginBottom: '12px' }}>
                    <strong>Q: {displayedQuestion}</strong>
                   </h5>
                  <div>
                    {chatResponse.split('\n').map((line, idx) => (
                      <p key={idx} style={{ marginBottom: '10px' }}>
                        {line}
                      </p>
                  ))}
                  </div>
                </>
              ) : (
                <p className="chat-placeholder">Ask a question to get started</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}