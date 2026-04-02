/**
 * contextService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds the full user financial context that gets injected into every Gemini
 * call. Each function tries to query the real DB collection; if that collection
 * is empty or unavailable it returns clearly-labelled mock data.
 *
 * HOW TO REPLACE MOCKS WITH REAL DATA:
 *   1. Transactions  → uncomment the Transaction.aggregate() block below
 *   2. Investments   → connect your Investment/Portfolio model and swap the mock
 *   3. SDG scores    → derive from actual transaction sdg_tags + goal sdgs
 * ─────────────────────────────────────────────────────────────────────────────
 */
import Goal from "../models/Goal.js";
import { Transaction } from "../models/Transaction.js";

const DEMO_USER = "demo-user";

// ─── Transactions ─────────────────────────────────────────────────────────────
/**
 * Returns a spend/income summary for the last 30 days.
 * REAL QUERY: aggregates Transaction collection by category.
 * MOCK DATA:  realistic Indian household financials — replace when ready.
 */
export const getTransactionContext = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Real query (uncomment when Transaction collection has data) ───────────
    const allTxns = await Transaction.find({
      user_id: DEMO_USER,
      createdAt: { $gte: thirtyDaysAgo },
    }).lean();

    if (allTxns.length > 0) {
      const categories = {};
      let totalIncome = 0;
      let totalExpense = 0;

      allTxns.forEach((t) => {
        if (t.type === "income") {
          totalIncome += t.amount;
        } else {
          totalExpense += t.amount;
          categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
      });

      return {
        period: "Last 30 days (real data)",
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        categories,
        sdgImpact: deriveSdgImpact(allTxns),
      };
    }

    // ── Mock data (returned when no transactions exist yet) ───────────────────
    // TODO: Remove once Transaction collection is populated
    return {
      period: "Last 30 days (mock data — connect Transaction model to see real figures)",
      totalIncome: 85000,
      totalExpense: 52400,
      netSavings: 32600,
      categories: {
        "Food & Dining": 8500,
        Transport: 4200,
        Utilities: 3200,
        Entertainment: 2800,
        Healthcare: 1500,
        Education: 3000,
        Shopping: 12000,
        Housing: 18000,
      },
      sdgImpact: {
        "SDG 3 (Good Health)": 1500,       // Healthcare
        "SDG 4 (Education)": 3000,          // Education
        "SDG 7 (Clean Energy)": 3200,       // Utilities
        "SDG 11 (Sustainable Cities)": 4200, // Transport
      },
    };
  } catch (err) {
    console.error("contextService.getTransactionContext:", err.message);
    return null;
  }
};

/** Derive rough SDG mapping from transaction sdg_tags */
const deriveSdgImpact = (txns) => {
  const map = {};
  txns.forEach((t) => {
    (t.sdg_tags || []).forEach((tag) => {
      map[tag] = (map[tag] || 0) + t.amount;
    });
  });
  return map;
};

// ─── Goals ───────────────────────────────────────────────────────────────────
/**
 * Returns up to 5 active goals with progress metrics.
 * Falls back to mock goals if none have been created yet.
 */
export const getGoalsContext = async () => {
  try {
    const goals = await Goal.find({ userId: DEMO_USER })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (goals.length > 0) {
      return goals.map((g) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate?.toISOString().slice(0, 10),
        sdgs: g.sdgs || [],
        progressPercent: Math.round((g.currentAmount / g.targetAmount) * 100),
      }));
    }

    // Mock goals — replace when real goals exist
    return [
      {
        name: "Retirement Fund",
        targetAmount: 2000000,
        currentAmount: 350000,
        targetDate: "2040-01-01",
        sdgs: [1, 10],
        progressPercent: 18,
      },
      {
        name: "Child Education Fund",
        targetAmount: 1000000,
        currentAmount: 180000,
        targetDate: "2030-06-01",
        sdgs: [4],
        progressPercent: 18,
      },
      {
        name: "Emergency Fund",
        targetAmount: 300000,
        currentAmount: 210000,
        targetDate: "2026-12-31",
        sdgs: [1],
        progressPercent: 70,
      },
    ];
  } catch (err) {
    console.error("contextService.getGoalsContext:", err.message);
    return [];
  }
};

// ─── Investments ─────────────────────────────────────────────────────────────
/**
 * Returns portfolio allocation and net worth snapshot.
 * TODO: Connect to your Investment / Portfolio model when available.
 */
export const getInvestmentContext = async () => {
  try {
    // TODO: Replace with real Investment model query
    // const portfolio = await Investment.findOne({ userId: DEMO_USER });
    // if (portfolio) return { ... };

    // Mock portfolio data
    return {
      netWorth: 985000,
      riskProfile: "Moderate",
      allocation: {
        equity: 45,
        debt: 25,
        gold: 10,
        liquid: 15,
        esg: 5,
      },
      topFunds: [
        { name: "Mirae Asset ESG Fund", type: "esg", value: 49250, sdgs: [13, 15] },
        { name: "HDFC Nifty 50 Index Fund", type: "equity", value: 220000, sdgs: [8, 9] },
        { name: "SBI Liquid Fund", type: "liquid", value: 147750, sdgs: [] },
        { name: "ICICI Pru Corporate Bond", type: "debt", value: 246250, sdgs: [8] },
        { name: "Nippon India Gold Fund", type: "gold", value: 98500, sdgs: [] },
      ],
      sdgAlignedValue: 49250,   // Value in ESG/SDG-aligned instruments
      sdgAlignedPercent: 5,     // % of portfolio in SDG-aligned instruments
    };
  } catch (err) {
    console.error("contextService.getInvestmentContext:", err.message);
    return null;
  }
};

// ─── SDG Scores ──────────────────────────────────────────────────────────────
/**
 * Aggregates an overall SDG alignment score from goals + transactions.
 * Scoring is deterministic: goals contribute 60%, spending habits 40%.
 */
export const getSDGScores = async () => {
  try {
    const goals = await Goal.find({ userId: DEMO_USER }).lean();

    // Count SDG coverage from goals
    const goalSdgCoverage = {};
    goals.forEach((g) => {
      (g.sdgs || []).forEach((id) => {
        goalSdgCoverage[id] = (goalSdgCoverage[id] || 0) + 1;
      });
    });

    // Overall score based on coverage (max 17 SDGs)
    const coveredCount = Object.keys(goalSdgCoverage).length;
    const goalsScore = Math.min(100, Math.round((coveredCount / 17) * 100));

    return {
      overallScore: goals.length > 0 ? Math.max(30, goalsScore + 20) : 45, // min 30 even with no goals
      breakdown: {
        fromGoals: goalsScore,
        fromSpending: 40, // TODO: Derive from real transaction sdg_tags
        fromInvestments: 5, // From ESG portion of portfolio
      },
      topSDGs: [
        { id: 1, name: "No Poverty", score: goalSdgCoverage[1] ? 65 : 40, primary: "goals" },
        { id: 3, name: "Good Health", score: 70, primary: "spending" },
        { id: 4, name: "Quality Education", score: goalSdgCoverage[4] ? 85 : 50, primary: "goals+spending" },
        { id: 7, name: "Clean Energy", score: 45, primary: "spending" },
        { id: 13, name: "Climate Action", score: 30, primary: "investments" },
      ],
      goalsSdgMap: goalSdgCoverage,
    };
  } catch (err) {
    console.error("contextService.getSDGScores:", err.message);
    return { overallScore: 45, breakdown: {}, topSDGs: [], goalsSdgMap: {} };
  }
};

// ─── Master context builder ───────────────────────────────────────────────────
/**
 * Called before every Gemini request.
 * Returns a single object with all financial context for prompt injection.
 */
export const buildUserContext = async () => {
  const [transactions, goals, investments, sdgScores] = await Promise.all([
    getTransactionContext(),
    getGoalsContext(),
    getInvestmentContext(),
    getSDGScores(),
  ]);

  return { transactions, goals, investments, sdgScores };
};
