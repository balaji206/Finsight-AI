/**
 * sdgImpactService.js
 * Logic for calculating SDG alignment and impact scores.
 */

// Mapping of common categories to SDGs
const CATEGORY_SDG_MAP = {
  "education": { id: 4, name: "Quality Education", emoji: "📚" },
  "healthcare": { id: 3, name: "Good Health & Well-being", emoji: "🏥" },
  "medical": { id: 3, name: "Good Health & Well-being", emoji: "🏥" },
  "donations": { id: 1, name: "No Poverty", emoji: "🤝" },
  "charity": { id: 1, name: "No Poverty", emoji: "🤝" },
  "clean energy": { id: 7, name: "Affordable & Clean Energy", emoji: "⚡" },
  "utilities": { id: 7, name: "Affordable & Clean Energy", emoji: "⚡" }, // Often maps to energy
  "transport-public": { id: 11, name: "Sustainable Cities", emoji: "🚌" },
  "organic food": { id: 12, name: "Responsible Consumption", emoji: "🥗" },
  "environment": { id: 13, name: "Climate Action", emoji: "🌍" },
  "investment": { id: 8, name: "Decent Work & Economic Growth", emoji: "📈" },
  "savings": { id: 9, name: "Industry, Innovation & Infrastructure", emoji: "🏗️" },
};

/**
 * Calculates a weighted SDG Impact Score (0-100)
 * Formula: 
 * Score = (W1 * TxAlignment) + (W2 * GoalAlignment) + (W3 * BudgetAdherence)
 * - TxAlignment: % of transactions that have SDG tags or map to SDG categories.
 * - GoalAlignment: Average completion % of SDG-linked goals.
 * - BudgetAdherence: 100 - (Overspending % * factor), capped at 100.
 */
export const calculateSDGScore = ({ transactions = [], goals = [], budgetStatus = 1 }) => {
  let txScore = 0;
  if (transactions.length > 0) {
    const alignedTxs = transactions.filter(tx => 
      (tx.sdg_tags && tx.sdg_tags.length > 0) || 
      CATEGORY_SDG_MAP[tx.category?.toLowerCase()]
    );
    txScore = (alignedTxs.length / transactions.length) * 100;
  }

  let goalScore = 0;
  if (goals.length > 0) {
    const sdgGoals = goals.filter(g => g.sdgs && g.sdgs.length > 0);
    if (sdgGoals.length > 0) {
      const avgProgress = sdgGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / sdgGoals.length;
      goalScore = Math.min(avgProgress * 100, 100);
    } else {
      goalScore = 50; // Neutral if no goals but project exists
    }
  }

  // Budget Adherence (Simplified: 1.0 = on track, 0.5 = overspent)
  const budgetScore = budgetStatus * 100;

  // Weighted average: 40% Transactions, 40% Goals, 20% Budget
  const finalScore = (txScore * 0.4) + (goalScore * 0.4) + (budgetScore * 0.2);
  
  return Math.round(Math.min(finalScore, 100));
};

/**
 * Returns top supported SDGs and their monetary impact
 */
export const getTopSDGs = (transactions = []) => {
  const sdgImpact = {};

  transactions.forEach(tx => {
    let tags = tx.sdg_tags || [];
    // If no tags, try to map from category
    if (tags.length === 0 && CATEGORY_SDG_MAP[tx.category?.toLowerCase()]) {
      tags = [CATEGORY_SDG_MAP[tx.category.toLowerCase()].id.toString()];
    }

    tags.forEach(tagId => {
      if (!sdgImpact[tagId]) {
        sdgImpact[tagId] = { 
          id: parseInt(tagId), 
          amount: 0,
          name: getSDGName(tagId),
          emoji: getSDGEmoji(tagId)
        };
      }
      sdgImpact[tagId].amount += tx.amount;
    });
  });

  return Object.values(sdgImpact)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
};

const getSDGName = (id) => {
  const names = {
    "1": "No Poverty",
    "3": "Good Health",
    "4": "Quality Education",
    "7": "Clean Energy",
    "8": "Economic Growth",
    "11": "Sustainable Cities",
    "12": "Responsible Consumption",
    "13": "Climate Action"
  };
  return names[id] || `SDG ${id}`;
};

const getSDGEmoji = (id) => {
  const emojis = {
    "1": "🤝",
    "3": "🏥",
    "4": "📚",
    "7": "⚡",
    "8": "📈",
    "11": "🏢",
    "12": "♻️",
    "13": "🌍"
  };
  return emojis[id] || "🎯";
};
