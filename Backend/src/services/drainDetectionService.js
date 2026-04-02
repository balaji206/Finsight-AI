/**
 * Rule-based AI Engine to detect subscriptions and hidden drains over the last 30 days.
 */

// Well-known subscriptions
const SUBSCRIPTION_KEYWORDS = ["netflix", "spotify", "prime video", "hotstar", "adobe", "gym", "apple", "google play"];

export const detectDrains = (transactions) => {
  const insights = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Identify Subscriptions
  const recentExpenses = transactions.filter(t => t.type === "expense" && new Date(t.createdAt) >= thirtyDaysAgo);
  
  let subSpending = 0;
  let subCount = 0;

  for (const exp of recentExpenses) {
    const desc = exp.description.toLowerCase();
    if (SUBSCRIPTION_KEYWORDS.some(k => desc.includes(k)) || exp.category.toLowerCase().includes("subscription")) {
      subSpending += exp.amount;
      subCount += 1;
    }
  }

  if (subCount > 2 || subSpending > 1500) {
    insights.push(`Hidden drain: ₹${subSpending}/month on ${subCount} subscriptions — consider consolidating. Switching saves up to ₹${Math.round(subSpending * 0.4)}/month and reduces SDG 12 footprint by 8 points.`);
  }

  // 2. Identify Entertainment/Dining Spikes
  let discretionarySpending = 0;
  for (const exp of recentExpenses) {
    const cat = exp.category.toLowerCase();
    if (cat.includes("entertainment") || cat.includes("dining") || cat.includes("shopping")) {
      discretionarySpending += exp.amount;
    }
  }

  if (discretionarySpending > 5000) {
    insights.push(`Warning: Discretionary spending (dining/shopping) hit ₹${discretionarySpending} in the last 30 days. Minor cutbacks here directly boost wealth generation.`);
  }

  if (insights.length === 0) {
    insights.push("Great job! Your spending is relatively stable with no obvious hidden drains immediately detected.");
  }

  return insights;
};
