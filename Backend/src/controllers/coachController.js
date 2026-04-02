/**
 * coachController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles the three Coach API endpoints:
 *   GET    /api/coach/history  → load persisted messages (+ welcome on first visit)
 *   POST   /api/coach/message  → save user msg, stream Gemini response, save reply
 *   DELETE /api/coach/history  → wipe all messages for demo-user
 * ─────────────────────────────────────────────────────────────────────────────
 */
import ChatMessage from "../models/ChatMessage.js";
import { streamGeminiResponse } from "../services/geminiService.js";

const DEMO_USER = "demo-user";
const MAX_STORED_MESSAGES = 50; // Oldest messages pruned when limit exceeded
const CONTEXT_HISTORY_COUNT = 10; // Messages fed to Gemini as recent context

/** Welcome messages injected on first visit (empty chat history) */
const WELCOME_MESSAGES = [
  {
    role: "assistant",
    content:
      "👋 **Welcome to FinSight Coach!**\n\n" +
      "I'm your personal AI financial coach powered by Google Gemini. I can help you:\n\n" +
      "- 📊 **Analyse your spending** and find savings opportunities\n" +
      "- 🎯 **Track your financial goals** and suggest improvements\n" +
      "- 🌱 **Align your finances with UN SDGs** (Sustainable Development Goals 1–17)\n" +
      "- 💼 **Optimise your portfolio** for both growth and positive impact\n\n" +
      "I have access to your real financial data and will give you personalised, SDG-aware guidance. How can I help you today?",
  },
  {
    role: "assistant",
    content:
      "💡 **Quick Start Tips:**\n\n" +
      "Try asking me things like:\n\n" +
      "- *\"How am I doing with my savings this month?\"*\n" +
      "- *\"Which SDGs do my current goals support?\"*\n" +
      "- *\"Give me a monthly savings plan aligned with SDGs\"*\n" +
      "- *\"How can I invest to support Climate Action (SDG 13)?\"*\n\n" +
      "Or click any suggestion chip below ⬇️",
  },
];

// ─── GET /api/coach/history ───────────────────────────────────────────────────
/**
 * Returns all stored chat messages for demo-user, sorted chronologically.
 * If the history is empty (first visit), inserts and returns the welcome messages.
 */
export const getHistory = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: DEMO_USER })
      .sort({ createdAt: 1 })
      .lean();

    // First-time visitor — seed welcome messages
    if (messages.length === 0) {
      const welcomed = await ChatMessage.insertMany(
        WELCOME_MESSAGES.map((m) => ({ ...m, userId: DEMO_USER }))
      );
      return res.json({ success: true, data: welcomed });
    }

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("coachController.getHistory:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
};

// ─── POST /api/coach/message ──────────────────────────────────────────────────
/**
 * Full message pipeline:
 *   1. Validate input
 *   2. Persist user message to MongoDB
 *   3. Fetch last N messages as context for Gemini
 *   4. Open a streaming Gemini response directly into `res`
 *   5. Persist the complete assistant response to MongoDB
 *   6. Prune messages if > MAX_STORED_MESSAGES
 *
 * The streaming response is sent to the browser token-by-token;
 * DB persistence happens after the stream ends (server-side only).
 */
export const sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Message body is required." });
  }

  const userText = message.trim();

  try {
    // Step 1 — Persist user message
    await ChatMessage.create({
      userId: DEMO_USER,
      role: "user",
      content: userText,
    });

    // Step 2 — Fetch recent history for context (exclude the message just saved)
    const recent = await ChatMessage.find({ userId: DEMO_USER })
      .sort({ createdAt: -1 })
      .limit(CONTEXT_HISTORY_COUNT + 1) // +1 accounts for the message we just saved
      .lean();

    // Reverse to chronological, drop the very last entry (the user msg we just saved)
    const historyForContext = recent.reverse().slice(0, -1);

    // Step 3 — Stream Gemini response to client
    //           streamGeminiResponse writes to `res` and calls res.end()
    let fullResponse = "";
    try {
      fullResponse = await streamGeminiResponse(userText, historyForContext, res);
    } catch (streamErr) {
      console.error("coachController.sendMessage — streaming error:", streamErr.message);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Gemini streaming failed.",
          error: streamErr.message,
        });
      }
      // Response already partially sent — write error token and close
      res.write("\n\n[⚠️ An error occurred while generating the response.]");
      res.end();
      return;
    }

    // Step 4 — Persist complete assistant message (response already sent to client)
    await ChatMessage.create({
      userId: DEMO_USER,
      role: "assistant",
      content: fullResponse,
    });

    // Step 5 — Enforce 50-message rolling window
    const totalCount = await ChatMessage.countDocuments({ userId: DEMO_USER });
    if (totalCount > MAX_STORED_MESSAGES) {
      const excess = totalCount - MAX_STORED_MESSAGES;
      const oldest = await ChatMessage.find({ userId: DEMO_USER })
        .sort({ createdAt: 1 })
        .limit(excess)
        .select("_id")
        .lean();
      await ChatMessage.deleteMany({ _id: { $in: oldest.map((m) => m._id) } });
    }
  } catch (error) {
    console.error("coachController.sendMessage:", error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Internal server error while processing message.",
        error: error.message,
      });
    }
  }
};

// ─── DELETE /api/coach/history ────────────────────────────────────────────────
/**
 * Clears the entire chat history for demo-user.
 * The frontend re-fetches history after clearing, which re-seeds the welcome messages.
 */
export const clearHistory = async (req, res) => {
  try {
    const result = await ChatMessage.deleteMany({ userId: DEMO_USER });
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} messages.`,
    });
  } catch (error) {
    console.error("coachController.clearHistory:", error.message);
    res.status(500).json({
      success: false,
      message: "Error clearing chat history.",
      error: error.message,
    });
  }
};
