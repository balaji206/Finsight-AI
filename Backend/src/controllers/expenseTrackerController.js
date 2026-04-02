import { Transaction } from "../models/Transaction.js";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY || "";
const anthropic = new Anthropic({ apiKey });

/**
 * Handles GET /api/tracker/analysis
 * Fetches all user transactions and uses Gemini to analyze hidden drains, predictions, and budget breakdowns.
 */
export const getExpenseAnalysis = async (req, res) => {
  try {
    const { userId, expectedBudget } = req.query;
    const actualUserId = userId || "00000000-0000-0000-0000-000000000000";

    // 1. Fetch transactions
    const rawTransactions = await Transaction.find({ user_id: actualUserId }).sort({ createdAt: -1 });

    // Only look at expenses for the drain analysis
    const expenses = rawTransactions.filter(t => t.type === "expense");
    const incomes = rawTransactions.filter(t => t.type === "income" || t.type === "profit");

    if (expenses.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          drains: ["Not enough data to find drains yet."],
          predictions: ["Log more expenses to get predictions!"],
          chartData: [],
          insightText: "Log your first few expenses to unlock smart AI insights!"
        }
      });
    }

    // Prepare JSON for AI prompt
    const txSummary = expenses.map(t => ({
      amount: t.amount,
      category: t.category,
      note: t.notes,
      date: t.createdAt
    }));

    const budgetContext = expectedBudget 
      ? `The user mentally expected their total budget to be around ₹${expectedBudget} recently.`
      : `The user hasn't provided a strict budget, so dynamically figure out if their essential vs non-essential spending is unbalanced.`;

    const systemPrompt = `You are a strict financial AI specialized in "Smart Expense Tracking".
Given the list of the user's recent expense transactions, perform the following:
1. Identify "Hidden Drains": Spot recurring subscription patterns, spikes in Entertainment/Misc, or unusually high frequency small purchases. 
2. Make Predictions: Predict upcoming recurring bills or suggest when they will likely run out of discretionary budget.
3. Compare spending: Produce a brief but shocking/enlightening textual insight. ${budgetContext}
4. Aggregate the total amounts spent per exact category to build a visualization chart.

Your response MUST be strict JSON matching exactly this schema, with NO markdown \`\`\` wrappers:
{
  "drains": ["string (e.g. You spent ₹500 on 5 small entertainment purchases which adds up quickly)"],
  "predictions": ["string (e.g. Based on your dates, prepare for a ₹1000 rent/subscription hit next week)"],
  "insightText": "A 2 sentence punchy insight about their reality vs expectation.",
  "chartData": [
    { "name": "Food", "value": 1500 },
    { "name": "Transport", "value": 300 }
  ]
}`;

    let parsedData;
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: "user", content: "Transactions: " + JSON.stringify(txSummary) }]
      });

      const content = response.content[0].text.trim();
      const cleanContent = content.replace(/^```json/gi, "").replace(/```$/g, "").trim();
      parsedData = JSON.parse(cleanContent);
    } catch (apiError) {
      console.warn("⚠️ Expense Tracker AI failed. Generating offline chart fallback!");
      
      // Offline calculate exact category chart data
      const categoryMap = {};
      expenses.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });
      const chartData = Object.keys(categoryMap).map(k => ({ name: k, value: categoryMap[k] }));
      
      parsedData = {
        drains: ["(Offline Mode) Review your recurring smaller transactions manually.", "(Offline Mode) AI scanning disabled because of API Key restrictions."],
        predictions: ["(Offline Mode) Compare your highest category spending month-to-month."],
        insightText: expectedBudget ? `Your total essential spending vs your expected budget of ${expectedBudget} has been plotted.` : "Without an expected budget, we plotted exactly where your money went this month.",
        chartData: chartData
      };
    }

    return res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error("Tracker Server Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate tracker insights" });
  }
};
