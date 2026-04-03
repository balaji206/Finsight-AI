import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.png';
import './AppFooter.css';

export default function AppFooter({ variant = 'app' }) {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <img src={logo} alt="FinSight" className="app-footer-logo" />
          <p>Intelligence reimagined for the modern wealth builder.</p>
        </div>

        {variant === 'app' ? (
          <div className="app-footer-links">
            <div className="app-footer-col">
              <h4>NAVIGATE</h4>
              <button onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button onClick={() => navigate('/expensetracker')}>Expenses</button>
              <button onClick={() => navigate('/budget')}>Budget</button>
              <button onClick={() => navigate('/goals')}>Goals</button>
            </div>
            <div className="app-footer-col">
              <h4>TOOLS</h4>
              <button onClick={() => navigate('/forecast')}>Forecast</button>
              <button onClick={() => navigate('/invest')}>Invest</button>
              <button onClick={() => navigate('/market')}>Market</button>
              <button onClick={() => navigate('/coach')}>AI Coach</button>
            </div>
          </div>
        ) : (
          <div className="app-footer-links">
            <div className="app-footer-col">
              <h4>PRODUCT</h4>
              <a href="#features">Features</a>
              <a href="#sdg">SDG Impact</a>
            </div>
            <div className="app-footer-col">
              <h4>ACCOUNT</h4>
              <a href="/login">Sign In</a>
              <a href="/register">Register</a>
            </div>
            <div className="app-footer-col">
              <h4>LEGAL</h4>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        )}
      </div>

      <div className="app-footer-bottom">
        <p>&copy; 2026 FinSight AI. Built for clarity and impact.</p>
      </div>
    </footer>
  );
}
