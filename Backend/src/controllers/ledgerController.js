import { Transaction } from "../models/Transaction.js";
import { parseTransactionInput, generateWeeklySummary } from "../services/aiParser.js";

/**
 * Handle POST /api/ledger/log
 */
export const logTransaction = async (req, res) => {
  try {
    const { raw_input, userId } = req.body;
    if (!raw_input) return res.status(400).json({ error: "raw_input is required" });

    const actualUserId = userId || "00000000-0000-0000-0000-000000000000";

    // 1. Call Local offline Parser to extract details
    const parsedData = await parseTransactionInput(raw_input);

    // 2. Save to MongoDB
    const newTx = await Transaction.create({
      user_id: actualUserId,
      type: parsedData.type,
      amount: parsedData.amount,
      category: parsedData.category,
      notes: parsedData.notes || raw_input,
      sdg_tags: parsedData.sdg_tags || [],
      raw_input: raw_input
    });

    res.status(201).json({ success: true, data: newTx });
  } catch (error) {
    console.error("Error logging transaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handle GET /api/ledger/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const { userId } = req.query;
    const actualUserId = userId || "00000000-0000-0000-0000-000000000000";

    const data = await Transaction.find({ user_id: actualUserId })
                                  .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handle GET /api/ledger/weekly-summary
 */
export const getWeeklySummary = async (req, res) => {
  try {
    const { userId } = req.query;
    const actualUserId = userId || "00000000-0000-0000-0000-000000000000";

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const transactions = await Transaction.find({
      user_id: actualUserId,
      createdAt: { $gte: oneWeekAgo }
    });

    // Call local offline summary
    const summary = await generateWeeklySummary(transactions);

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handle PUT /api/ledger/transactions/:id
 */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const data = await Transaction.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handle DELETE /api/ledger/transactions/:id
 */
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    await Transaction.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
