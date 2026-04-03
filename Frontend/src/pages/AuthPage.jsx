import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthPage.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
if (API_BASE.endsWith('/')) {
  // normalize it to NOT have a trailing slash
  // so we can use it like `${API_BASE}/route`
}

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const res = await axios.post(`${API_BASE}${endpoint}`, formData);
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-root">
       <nav className="auth-nav">
         <div className="lp-logo" onClick={() => navigate('/')}>FinSight</div>
       </nav>

       <div className="auth-header">
         <span className="sub-tag">ACCESS</span>
         <h1 className="auth-h2">One account.<br /><span className="italic-serif">Total clarity.</span></h1>
       </div>

       <div className="auth-container single-mode">
          {error && <div className="auth-error">{error}</div>}

          {/* Create Account Side */}
          {mode === 'register' && (
            <div className="auth-card focused">
               <span className="tiny-tag">NEW HERE</span>
               <h2>Create account</h2>
               <p>Join 50,000+ users building sustainable wealth.</p>
               <form onSubmit={handleSubmit}>
                 <div className="input-group">
                   <label>FULL NAME</label>
                   <input 
                     name="name"
                     type="text" 
                     placeholder="Arjun Sharma" 
                     value={formData.name}
                     onChange={handleChange}
                     required
                   />
                 </div>
                 <div className="input-group">
                   <label>EMAIL ADDRESS</label>
                   <input 
                     name="email"
                     type="email" 
                     placeholder="arjun@example.com" 
                     value={formData.email}
                     onChange={handleChange}
                     required
                   />
                 </div>
                 <div className="input-group">
                   <label>PASSWORD</label>
                   <input 
                     name="password"
                     type="password" 
                     placeholder="Minimum 8 characters" 
                     value={formData.password}
                     onChange={handleChange}
                     required
                   />
                 </div>
                 <button className="btn-white-block" disabled={loading}>
                   {loading ? "Creating..." : "Create free account"}
                 </button>
                 <div className="auth-switch">
                   Already have an account? <span onClick={() => navigate('/login')}>Sign in</span>
                 </div>
               </form>
            </div>
          )}

          {/* Welcome Back Side */}
          {mode === 'login' && (
            <div className="auth-card focused">
               <span className="tiny-tag">RETURNING USER</span>
               <h2>Welcome back</h2>
               <p>Sign in to continue your financial intelligence journey.</p>
               <form onSubmit={handleSubmit}>
                 <div className="input-group">
                   <label>EMAIL ADDRESS</label>
                   <input 
                     name="email"
                     type="email" 
                     placeholder="arjun@example.com" 
                     value={formData.email}
                     onChange={handleChange}
                     required
                   />
                 </div>
                 <div className="input-group">
                   <label>PASSWORD</label>
                   <input 
                     name="password"
                     type="password" 
                     placeholder="Your password" 
                     value={formData.password}
                     onChange={handleChange}
                     required
                   />
                 </div>
                 <button className="btn-white-block" disabled={loading}>
                   {loading ? "Signing in..." : "Sign in"}
                 </button>

                 <div className="auth-switch">
                   New to FinSight? <span onClick={() => navigate('/register')}>Create account</span>
                 </div>
               </form>
            </div>
          )}
       </div>

       <footer className="footer-auth">
         &copy; 2026 FinSight AI.
       </footer>
    </div>
  );
}
