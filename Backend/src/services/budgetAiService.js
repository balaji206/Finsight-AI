import { GoogleGenerativeAI } from "@google/generative-ai";

const getGemini = () => {
    const key = process.env.GEMINI_API_KEY || "";
    return new GoogleGenerativeAI(key);
};

export const generateBudgetPlan = async (transactionsSummary, goalsSummary, monthlyIncome) => {
  const genAI = getGemini();
  
  const systemPrompt = `You are an elite financial "Intelligent Budget Planner" integrated into FinSight AI.
Your purpose is to look strictly at the provided ACTUAL user spending habits against their income, intricately compare them to their active Life Goals, and output a highly adaptive YNAB-style budget for the upcoming month.

Crucially, you must provide 1 to 3 "aiInsights" that are intensely predictive over a timeline. 
Do not be generic. Analyze exactly what their spending/income is and compare it against their Life Goal to give concrete advice.
Example: "If you budget and save like this, you can actually buy your Car next year." OR "Reducing dining out by ₹2,000/month means you'll hit your Home Down Payment goal 8 months earlier than planned."
Be stunningly accurate and highly encouraging. Budget allocations shouldn't exceed monthly income realistically.

Output strictly valid JSON matching this schema, no markdown blocks:
{
  "categories": [
    { "name": "Food", "allocated": 15000 },
    { "name": "Rent", "allocated": 20000 }
  ],
  "aiInsights": [
    "Insight string 1",
    "Insight string 2"
  ]
}`;

  const promptArgs = JSON.stringify({
    AssumedMonthlyIncome: monthlyIncome,
    RecentSpendingAverages: transactionsSummary,
    ActiveLifeGoals: goalsSummary
  });

  try {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt
    });
    const result = await model.generateContent(promptArgs);
    const content = result.response.text().trim();
    const cleanContent = content.replace(/^```json/gi, "").replace(/```$/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.warn("⚠️ Anthropic AI Budget generation failed:", error.message);
    throw error;
  }
};
