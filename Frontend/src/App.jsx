import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedLayout from './components/ProtectedLayout';
import './App.css';
import './index.css';

// Lazy load all pages for performance
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const AuthPage           = lazy(() => import('./pages/AuthPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const ForecastPage       = lazy(() => import('./pages/ForecastPage'));
const LedgerPage         = lazy(() => import('./pages/LedgerPage'));
const ExpenseTrackerPage = lazy(() => import('./pages/ExpenseTrackerPage'));
const TransactionsPage   = lazy(() => import('./pages/TransactionsPage'));
const MarketPage         = lazy(() => import('./pages/MarketPage'));
const InvestPage         = lazy(() => import('./pages/InvestPage'));
const GoalsPage          = lazy(() => import('./pages/GoalsPage'));
const BudgetPlannerPage  = lazy(() => import('./pages/BudgetPlannerPage'));
const CoachPage          = lazy(() => import('./pages/CoachPage'));

// Loading spinner — black themed
const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#000' }}>
    <div style={{ width:'30px', height:'30px', border:'2px solid rgba(255,255,255,0.08)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Auth guard — redirects to /login if no token
function RequireAuth({ children }) {
  return localStorage.getItem('token')
    ? <ProtectedLayout>{children}</ProtectedLayout>
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />

          {/* Protected routes — all wrapped with ProtectedLayout (navbar + footer) */}
          <Route path="/dashboard"      element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/expensetracker" element={<RequireAuth><ExpenseTrackerPage /></RequireAuth>} />
          <Route path="/budget"         element={<RequireAuth><BudgetPlannerPage /></RequireAuth>} />
          <Route path="/goals"          element={<RequireAuth><GoalsPage /></RequireAuth>} />
          <Route path="/forecast"       element={<RequireAuth><ForecastPage /></RequireAuth>} />
          <Route path="/invest"         element={<RequireAuth><InvestPage /></RequireAuth>} />
          <Route path="/market"         element={<RequireAuth><MarketPage /></RequireAuth>} />
          <Route path="/ledger"         element={<RequireAuth><LedgerPage /></RequireAuth>} />
          <Route path="/transactions"   element={<RequireAuth><TransactionsPage /></RequireAuth>} />
          <Route path="/coach"          element={<RequireAuth><CoachPage /></RequireAuth>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
