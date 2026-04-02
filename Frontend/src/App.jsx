import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ForecastPage from './pages/ForecastPage';
import LedgerPage from './pages/LedgerPage';
import './App.css';
import './index.css';

import MarketPage from './pages/MarketPage';
import InvestPage from './pages/InvestPage';
import GoalsPage from './pages/GoalsPage';
import CoachPage from './pages/CoachPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/invest" element={<InvestPage />} />
        <Route path='/goals' element={<GoalsPage />} />
        <Route path='/coach' element={<CoachPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App;
