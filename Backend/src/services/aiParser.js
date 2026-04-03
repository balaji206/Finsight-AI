import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Offline regex parser used as an automatic fallback when the API key is leaked or rejected!
 */
const offlineFallbackParser = (rawInput) => {
  const input = rawInput.toLowerCase();
  
  let amount = 0;
  const matchAmount = rawInput.match(/\d+(,\d+)*(\.\d+)?/);
  if (matchAmount) amount = parseFloat(matchAmount[0].replace(/,/g, ''));

  let type = "expense";
  if (input.includes("profit") || input.includes("made") || input.includes("earned")) type = "profit";
  else if (input.includes("income") || input.includes("salary")) type = "income";

  let category = "Misc";
  if (input.includes("food") || input.includes("lunch")) category = "Food";
  else if (input.includes("freelance")) category = "Freelance";
  else if (input.includes("uber") || input.includes("transport")) category = "Transport";

  let sdg_tags = [];
  if (category === "Food") sdg_tags.push("SDG 2: Zero Hunger");
  if (type === "profit" || type === "income") sdg_tags.push("SDG 8: Decent Work and Economic Growth");

  return { type, amount, category, notes: rawInput, sdg_tags };
};

/**
 * Parses natural language input via Google Gemini, automatically failing over to local parsing
 */
export const parseTransactionInput = async (rawInput) => {
  const systemInstruction = `You are a strict financial ledger AI parser for the "FinSight AI" application.
Output exactly this JSON structure:
{
  "type": "expense",      
  "amount": 450.00,       
  "category": "Food",     
  "notes": "string",      
  "sdg_tags": ["string"]  
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction });
    const result = await model.generateContent("User Input: " + rawInput);
    const content = result.response.text().trim();
    const cleanContent = content.replace(/^```json/gi, "").replace(/```$/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.warn("⚠️ Anthropic API failed. Falling back to offline NLP processor! Error:", error.message);
    return offlineFallbackParser(rawInput); // Solves the error by running safely offline!
  }
};

/**
 * Summarizes recent transactions into a warm plain English summary
 */
export const generateWeeklySummary = async (transactions) => {
  if (!transactions || transactions.length === 0) {
    return "You have no transactions recorded for this week yet. Start logging your expenses and profits!";
  }

  const prompt = `Analyze these recent transactions and write a 2-3 sentence encouraging, beginner-friendly summary of their financial week. Acknowledge both expenses and profits if present. Provide amounts in ₹. Explicitly list the UN SDGs supported based on their sdg_tags.\n\nTransactions: ${JSON.stringify(transactions)}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.warn("⚠️ Anthropic API failed. Falling back to offline summarizer!");
    
    // Offline summarizing failover
    let totalExpenses = 0, totalProfits = 0;
    transactions.forEach(tx => {
      if (tx.type === "expense") totalExpenses += tx.amount;
      else totalProfits += tx.amount;
    });
    
    return `You successfully logged ${transactions.length} transactions! Your total expenses are ₹${totalExpenses.toFixed(2)}, and your total profits are ₹${totalProfits.toFixed(2)}. \n\nBy tracking your finances, you are supporting fundamental SDGs!`;
  }
};
