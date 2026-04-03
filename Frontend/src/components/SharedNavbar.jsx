import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/Logo.png';
import './SharedNavbar.css';

const appLinks = [
  { path: '/dashboard',      label: 'Dashboard' },
  { path: '/expensetracker', label: 'Expenses' },
  { path: '/budget',         label: 'Budget' },
  { path: '/goals',          label: 'Goals' },
  { path: '/forecast',       label: 'Forecast' },
  { path: '/invest',         label: 'Invest' },
  { path: '/market',         label: 'Market' },
  { path: '/ledger',         label: 'Ledger' },
  { path: '/transactions',   label: 'Transactions' },
  { path: '/coach',          label: 'AI Coach' },
];

const landingLinks = [
  { href: '#features', label: 'Features' },
  { href: '#sdg',      label: 'SDG Impact' },
];

export default function SharedNavbar({ variant = 'app' }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Scrolling down
        setHidden(true);
      } else {
        // Scrolling up
        setHidden(false);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className={`snav-wrapper ${hidden ? 'snav-hidden' : ''}`}>
      {/* Logo — outside pill, far left, big */}
      <div
        className="snav-logo"
        onClick={() => navigate(variant === 'app' ? '/dashboard' : '/')}
      >
        <img src={logo} alt="FinSight" className="snav-logo-img" />
      </div>

      {/* Liquid glass pill — centered, links only */}
      <div className="snav-pill">
        {variant === 'app'
          ? appLinks.map(link => (
              <button
                key={link.path}
                className={`snav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))
          : landingLinks.map(link => (
              <a key={link.href} href={link.href} className="snav-link">
                {link.label}
              </a>
            ))
        }
      </div>

      {/* Right actions — outside pill */}
      <div className="snav-actions">
        {variant === 'app' ? (
          <button className="snav-btn-signout" onClick={handleLogout}>
            Sign out
          </button>
        ) : (
          <>
            <button className="snav-btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
            <button className="snav-btn-solid" onClick={() => navigate('/register')}>Get started</button>
          </>
        )}
      </div>
    </nav>
  );
}
