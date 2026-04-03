import { useNavigate, useLocation } from 'react-router-dom';
import './AppNavbar.css';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/expensetracker', label: 'Expenses' },
  { path: '/budget', label: 'Budget' },
  { path: '/goals', label: 'Goals' },
  { path: '/forecast', label: 'Forecast' },
  { path: '/invest', label: 'Invest' },
  { path: '/market', label: 'Market' },
  { path: '/ledger', label: 'Ledger' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/coach', label: 'AI Coach' },
];

export default function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <nav className="app-navbar">
      <div className="app-navbar-inner">
        <div className="app-nav-left">
          <div className="app-logo" onClick={() => navigate('/dashboard')}>FinSight</div>
          <div className="app-nav-links">
            {navLinks.map(link => (
              <button
                key={link.path}
                className={`app-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
        <div className="app-nav-right">
          <span className="app-nav-user">{user.name || 'User'}</span>
          <button className="app-nav-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}
