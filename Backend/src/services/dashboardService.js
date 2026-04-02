/**
 * dashboardService.js
 * Core calculations for the Net Worth Dashboard.
 */
import { Transaction } from "../models/Transaction.js";
import Goal from "../models/Goal.js";
import { calculateSDGScore, getTopSDGs } from "./sdgImpactService.js";

// Helper for native date formatting/manipulation
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
const subMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};
const formatMonth = (date) => date.toLocaleString('default', { month: 'short' });

/**
 * Calculates current net worth and monthly change
 */
export const getNetWorthData = async (userId) => {
  const transactions = await Transaction.find({ user_id: userId });
  const goals = await Goal.find({ userId: userId });

  // Baseline Assets (Mocking a starting point for the demo)
  let baseAssets = 50000; 
  let currentAssets = baseAssets;
  let currentLiabilities = 0;

  transactions.forEach(tx => {
    if (tx.type === "income" || tx.type === "profit") {
      currentAssets += tx.amount;
    } else {
      currentAssets -= tx.amount; // Simple model: expenses reduce cash asset
    }
  });

  // Goals are considered part of Net Worth (Assets)
  const goalAssets = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalNetWorth = (currentAssets + goalAssets) - currentLiabilities;

  // Calculate change this month
  const now = new Date();
  const firstOfCurrentMonth = startOfMonth(now);
  const currentMonthTxs = transactions.filter(tx => new Date(tx.createdAt) >= firstOfCurrentMonth);
  
  let monthlyChange = 0;
  currentMonthTxs.forEach(tx => {
    if (tx.type === "income" || tx.type === "profit") monthlyChange += tx.amount;
    else monthlyChange -= tx.amount;
  });

  const percentChange = totalNetWorth !== 0 ? (monthlyChange / (totalNetWorth - monthlyChange)) * 100 : 0;

  // Generate 6-month history for sparkline
  const history = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);
    
    // Aggregated up to that point
    let historicalAssets = baseAssets;
    transactions.forEach(tx => {
      if (new Date(tx.createdAt) <= mEnd) {
        if (tx.type === "income" || tx.type === "profit") historicalAssets += tx.amount;
        else historicalAssets -= tx.amount;
      }
    });

    history.push({
      month: formatMonth(monthDate),
      value: historicalAssets + (goalAssets * ((6-i)/6)) // Mocking goal growth linearly for the demo history
    });
  }

  return {
    totalNetWorth,
    monthlyChange,
    percentChange: percentChange.toFixed(2),
    history
  };
};

/**
 * Aggregates SDG Impact Data
 */
export const getSDGImpactData = async (userId) => {
  const transactions = await Transaction.find({ user_id: userId });
  const goals = await Goal.find({ userId: userId });

  const score = calculateSDGScore({ transactions, goals, budgetStatus: 0.9 }); // Mock budget adherence
  const topSDGs = getTopSDGs(transactions);
  
  // Weekly trend (last 8 weeks)
  const weeklyTrend = [];
  for (let i = 7; i >= 0; i--) {
    weeklyTrend.push({ 
      week: `W${8-i}`, 
      score: Math.min(score - (i * 2) + Math.floor(Math.random() * 5), 100) 
    });
  }

  return {
    score,
    topSDGs,
    weeklyTrend,
    opportunities: [
      { sdg: "SDG 13: Climate Action", suggestion: "Consider switching to renewable energy providers." },
      { sdg: "SDG 11: Sustainable Cities", suggestion: "Try using public transport 2 days a week." }
    ]
  };
};

/**
 * Generates data for Assets vs Liabilities chart
 */
export const getAssetsVsLiabilities = async (userId) => {
  const netWorthData = await getNetWorthData(userId);
  // For demo: Assets = NetWorth (if liabilities are 0)
  // Let's create a realistic split
  return [
    { name: "Cash & Bank", value: netWorthData.totalNetWorth * 0.4, color: "#10b981" },
    { name: "Investments", value: netWorthData.totalNetWorth * 0.5, color: "#3b82f6" },
    { name: "Other Assets", value: netWorthData.totalNetWorth * 0.1, color: "#f59e0b" },
    { name: "Liabilities", value: 15000, color: "#ef4444" } // Mock liability
  ];
};

/**
 * Generates Spending Trend (6 months)
 */
export const getSpendingTrend = async (userId) => {
  const transactions = await Transaction.find({ user_id: userId });
  const now = new Date();
  const trend = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);

    const monthTxs = transactions.filter(tx => {
      const d = new Date(tx.createdAt);
      return d >= mStart && d <= mEnd;
    });

    let income = 0;
    let expense = 0;

    monthTxs.forEach(tx => {
      if (tx.type === "income" || tx.type === "profit") income += tx.amount;
      else expense += tx.amount;
    });

    trend.push({
      month: formatMonth(monthDate),
      income,
      expense
    });
  }

  // Fallback if no real data (to ensure chart visibility)
  if (trend.every(t => t.income === 0 && t.expense === 0)) {
    return [
      { month: formatMonth(subMonths(now, 5)), income: 15000, expense: 8000 },
      { month: formatMonth(subMonths(now, 4)), income: 18000, expense: 9500 },
      { month: formatMonth(subMonths(now, 3)), income: 12000, expense: 11000 },
      { month: formatMonth(subMonths(now, 2)), income: 20000, expense: 8500 },
      { month: formatMonth(subMonths(now, 1)), income: 17000, expense: 12000 },
      { month: formatMonth(now), income: 19000, expense: 13000 }
    ];
  }

  return trend;
};

/**
 * Calculates a 0-100 Financial Health Score
 */
export const getFinancialHealthScore = async (userId) => {
  const netWorthData = await getNetWorthData(userId);
  // Composite score: growth rate + net worth magnitude + (mock factor)
  const growthFactor = Math.min(Math.max(parseFloat(netWorthData.percentChange) * 5, 0), 30);
  const baseScore = 65; 
  return Math.min(Math.round(baseScore + growthFactor + (Math.random() * 5)), 100);
};

/**
 * Mock Upcoming Bills
 */
export const getUpcomingBills = async (userId) => {
  return [
    { id: 1, title: "Spotify Family", amount: 199, date: "April 10", category: "Sub" },
    { id: 2, title: "Licious Order", amount: 850, date: "April 12", category: "Food" },
    { id: 3, title: "Airtel Fiber", amount: 1249, date: "April 15", category: "Bills" }
  ];
};

/**
 * Savings Rate Trend (last 6 months)
 */
export const getSavingsRateTrend = async (userId) => {
  const trend = await getSpendingTrend(userId);
  return trend.map(t => ({
    month: t.month,
    rate: t.income > 0 ? Math.round(((t.income - t.expense) / t.income) * 100) : 35 // Mock 35% if no income
  }));
};

/**
 * Rule-based "AI" Insight (Dual Impact: Financial + SDG)
 */
export const getTodayInsight = async (userId) => {
  const transactions = await Transaction.find({ user_id: userId });
  const goals = await Goal.find({ userId: userId });

  // Logic for insight picking
  let insight = {
    text: "Your financial health looks stable. Focus on aligning more of your spending with SDG 12 (Responsible Consumption).",
    icon: "💡"
  };

  const highExpenses = transactions.filter(tx => tx.type === "expense" && tx.amount > 5000);
  if (highExpenses.length > 0) {
    insight = {
      text: "You had a few high expenses this month. Cutting down on non-essential travel could boost your savings by ₹3,000 and reduce your carbon footprint (SDG 13).",
      icon: "🌍"
    };
  } else if (goals.length > 0 && goals.some(g => g.currentAmount >= g.targetAmount * 0.9)) {
    insight = {
      text: "You are close to reaching your 'Education Fund' goal! Reaching this milestone supports SDG 4 and strengthens your long-term security.",
      icon: "📚"
    };
  }

  return insight;
};
