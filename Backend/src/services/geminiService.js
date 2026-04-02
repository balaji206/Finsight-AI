/**
 * geminiService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all interaction with the Google Gemini API.
 *
 * Responsibilities:
 *   1. Build a rich, SDG-aware system prompt with injected user context
 *   2. Start a Gemini chat session with recent chat history
 *   3. Stream tokens progressively to the Express `res` object
 *   4. Append the mandatory financial disclaimer when advice is given
 *   5. Return the full assembled response for DB persistence
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUserContext } from "./contextService.js";

// ─── Initialise Gemini ────────────────────────────────────────────────────────
// Moved inside function to ensure process.env.GEMINI_API_KEY is loaded
let genAI;
const getAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// ─── Disclaimer ───────────────────────────────────────────────────────────────
const DISCLAIMER =
  "\n\n---\n*Disclaimer: This is AI-generated financial guidance based on your data. " +
  "It is not professional financial advice. Please consult a SEBI-registered financial " +
  "advisor for investment decisions.*";

// Keywords that trigger the mandatory disclaimer
const FINANCIAL_KEYWORDS = [
  "invest", "fund", "stock", "equity", "portfolio", "buy", "sell",
  "return", "profit", "loss", "sip", "nifty", "sensex", "elss", "nps",
  "ppf", "mutual fund", "allocat", "dividend", "bond", "etf", "ipo",
  "saving plan", "retirement plan", "wealth",
];

const requiresDisclaimer = (text) => {
  const lower = text.toLowerCase();
  return FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw));
};

// ─── System Prompt Builder ────────────────────────────────────────────────────
/**
 * Builds a comprehensive prompt that:
 *   - Defines the coach persona
 *   - Injects all real user financial data
 *   - Sets strict SDG-awareness and disclaimer rules
 */
const buildSystemPrompt = (ctx) => {
  const { transactions, goals, investments, sdgScores } = ctx;

  // Format helpers
  const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const pct = (n) => `${n || 0}%`;

  // Transactions section
  const txSection = transactions
    ? [
        `Period : ${transactions.period}`,
        `Income : ${inr(transactions.totalIncome)}`,
        `Expense: ${inr(transactions.totalExpense)}`,
        `Savings: ${inr(transactions.netSavings)}`,
        `Top categories: ${Object.entries(transactions.categories || {})
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([k, v]) => `${k} ${inr(v)}`)
          .join(" | ")}`,
      ].join("\n")
    : "No transaction data available yet.";

  // Goals section
  const goalsSection =
    (goals || []).length > 0
      ? goals
          .map(
            (g) =>
              `• ${g.name}: target ${inr(g.targetAmount)}, saved ${inr(g.currentAmount)} ` +
              `(${g.progressPercent}%), deadline ${g.targetDate}, SDGs [${(g.sdgs || []).join(", ") || "none"}]`
          )
          .join("\n")
      : "No goals created yet.";

  // Investment section
  const invSection = investments
    ? [
        `Net Worth : ${inr(investments.netWorth)}`,
        `Risk Profile: ${investments.riskProfile}`,
        `Allocation : ${Object.entries(investments.allocation || {})
          .map(([k, v]) => `${k} ${pct(v)}`)
          .join(" | ")}`,
        `ESG/SDG-aligned value: ${inr(investments.sdgAlignedValue)} (${pct(investments.sdgAlignedPercent)})`,
        `Top holdings: ${(investments.topFunds || []).map((f) => `${f.name} ${inr(f.value)}`).join(" | ")}`,
      ].join("\n")
    : "No investment data available yet.";

  // SDG section
  const sdgSection = sdgScores
    ? [
        `Overall SDG Score: ${sdgScores.overallScore}/100`,
        `Top SDG areas: ${(sdgScores.topSDGs || [])
          .map((s) => `SDG ${s.id} ${s.name} (${s.score}/100)`)
          .join(" | ")}`,
      ].join("\n")
    : "SDG data not available.";

  return `You are **FinSight Coach** — an intelligent, empathetic AI financial coach built into the FinSight AI platform. You have real-time access to the user's financial data and are deeply knowledgeable about:

1. Personal finance, budgeting, savings, and Indian investment products (SIP, ELSS, NPS, PPF, FD, Gold)
2. UN Sustainable Development Goals (SDGs 1–17) and how personal finance choices align with them
3. ESG and impact investing in the Indian context (SEBI ESG disclosures, green bonds, ESG mutual funds)
4. SEBI regulations, Indian tax laws (Section 80C, 80D, LTCG, STCG)

═══════════════════════════════════════════════
USER FINANCIAL SNAPSHOT — USE THIS IN EVERY ANSWER
═══════════════════════════════════════════════

📊 TRANSACTIONS
${txSection}

🎯 ACTIVE GOALS
${goalsSection}

💼 INVESTMENT PORTFOLIO
${invSection}

🌱 SDG ALIGNMENT
${sdgSection}
═══════════════════════════════════════════════

BEHAVIOUR RULES (follow strictly):
1. ALWAYS reference specific numbers from the user's data in your answer (don't give generic advice)
2. ALWAYS connect financial topics to relevant SDGs — mention which SDG number and name
3. Be conversational, warm, and encouraging — not robotic or overly formal
4. Give concrete, numbered action steps. Avoid vague advice like "save more money"
5. Prioritise ESG/SDG-aligned investment options when making recommendations
6. Use Indian financial context only: ₹ (rupees), SEBI, Indian schemes, Indian fund names
7. Keep responses concise (under 350 words) unless a detailed plan is explicitly requested
8. Use markdown formatting: **bold** for key terms, bullet points for lists, ## for sections
9. When the user asks about a specific SDG, map their existing goals/spending to that SDG

DISCLAIMER RULE (mandatory):
If your response contains any investment advice, specific fund suggestions, savings strategy,
or portfolio recommendations — you MUST end with EXACTLY this text:
"Disclaimer: This is AI-generated financial guidance based on your data. It is not professional financial advice. Please consult a SEBI-registered financial advisor for investment decisions."`;
};

// ─── Main streaming function ──────────────────────────────────────────────────
/**
 * Calls Gemini with user context + chat history and streams the response
 * progressively to the Express `res` object.
 *
 * @param {string} userMessage    - The user's latest message
 * @param {Array}  chatHistory    - Array of {role, content} from DB (chronological)
 * @param {object} res            - Express response object (must NOT be ended before call)
 * @returns {string}              - Full assembled response (for DB persistence)
 */
export const streamGeminiResponse = async (userMessage, chatHistory, res) => {
  // 1. Fetch real user context (transactions, goals, investments, SDG scores)
  const context = await buildUserContext();
  const systemPrompt = buildSystemPrompt(context);

  // 2. Convert chat history to Gemini format
  //    Gemini roles: "user" | "model"  (not "assistant")
  const geminiHistory = chatHistory.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // 3. Initialise model — inject system prompt via the first turn in history
  //    (works across all @google/generative-ai versions)
  const ai = getAI();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Build history with system context as the very first exchange
  const fullHistory = [
    {
      role: "user",
      parts: [{ text: `[SYSTEM CONTEXT]\n${systemPrompt}\n[/SYSTEM CONTEXT]\nAcknowledge that you have received the context and are ready.` }],
    },
    {
      role: "model",
      parts: [{
        text: "Context received. I am FinSight Coach, ready to provide personalised, SDG-aware financial guidance based on the user's real data.",
      }],
    },
    ...geminiHistory,
  ];

  const chat = model.startChat({
    history: fullHistory,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.75,
      topP: 0.9,
    },
  });

  // 4. Set streaming headers
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx proxy buffering

  // 5. Stream tokens progressively
  let fullResponse = "";
  const result = await chat.sendMessageStream(userMessage);

  for await (const chunk of result.stream) {
    const token = chunk.text();
    if (token) {
      fullResponse += token;
      res.write(token); // Send each token immediately to the client
    }
  }

  // 6. Append disclaimer if response contains financial advice
  if (requiresDisclaimer(fullResponse)) {
    res.write(DISCLAIMER);
    fullResponse += DISCLAIMER;
  }

  res.end();
  return fullResponse;
};
