import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ForecastPage from './pages/ForecastPage';
import LedgerPage from './pages/LedgerPage';
import ExpenseTrackerPage from './pages/ExpenseTrackerPage';
import TransactionsPage from './pages/TransactionsPage';
import './App.css';
import './index.css';

import MarketPage from './pages/MarketPage';
import InvestPage from './pages/InvestPage';
import GoalsPage from './pages/GoalsPage';
import BudgetPlannerPage from './pages/BudgetPlannerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/expensetracker" element={<ExpenseTrackerPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/invest" element={<InvestPage />} />
        <Route path='/goals' element={<GoalsPage />} />
        <Route path="/budget" element={<BudgetPlannerPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
