import { Transaction } from "../models/Transaction.js";
import { detectDrains } from "../services/drainDetectionService.js";
import { parseCSVPreview } from "../services/csvParserService.js";
import { assignSDGTags } from "../services/sdgMapping.js";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const getTransactions = async (req, res) => {
  try {
    const { userId = "demo-user", type, category, sdg } = req.query;
    
    // Build offline Mongoose Filter Matcher
    const filter = { user_id: userId };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (sdg) filter.sdgTags = Number(sdg);

    const data = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const payload = req.body;
    payload.user_id = payload.userId || "demo-user";
    if (!payload.date) payload.date = new Date();
    
    // Auto-tag if tags not manually submitted
    if (!payload.sdgTags || payload.sdgTags.length === 0) {
       payload.sdgTags = assignSDGTags(payload.category, payload.description);
    }

    // Adapt to old schema (notes vs description) smoothly over time
    if (!payload.notes && payload.description) payload.notes = payload.description;

    const newTx = await Transaction.create(payload);
    res.status(201).json({ success: true, data: newTx });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Transaction.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTransactionObj = async (req, res) => {
  try {
    const { id } = req.params;
    await Transaction.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const uploadCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    // Stream and map CSV lines offline natively without AI limits
    const previewData = await parseCSVPreview(req.file.path);
    
    // Memory wipe local upload path immediately after scan
    fs.unlinkSync(req.file.path);
    res.status(200).json({ success: true, data: previewData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const importCSV = async (req, res) => {
  try {
    const { transactions, userId = "demo-user" } = req.body;
    
    if (!transactions || !transactions.length) {
      return res.status(400).json({ success: false, error: "Empty array" });
    }

    const mapForDB = transactions.map(t => ({
      ...t,
      user_id: userId,
      notes: t.description // fallback backwards-compatibility
    }));

    await Transaction.insertMany(mapForDB);
    res.status(201).json({ success: true, message: `Imported ${transactions.length}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const runAIParse = async (req, res) => {
  try {
    const { rawText } = req.body;
    
    try {
      const model = genAI.getGenerativeModel({ 
         model: "gemini-2.5-flash",
         systemInstruction: `You are a strict financial Receipt parsing AI. Output perfectly structured JSON only: { "amount": number, "type": "expense" or "income", "category": "food", "description": "string" }`
      });
      const result = await model.generateContent("Receipt Text: " + rawText);
      const content = result.response.text().trim();
      const cleanContent = content.replace(/^```json/gi, "").replace(/```$/g, "").trim();
      const aiData = JSON.parse(cleanContent);
      
      const sdgTags = assignSDGTags(aiData.category, rawText);
      return res.status(200).json({
        success: true,
        data: { description: aiData.description, amount: aiData.amount, type: aiData.type, category: aiData.category, sdgTags }
      });
      
    } catch (aiError) {
      console.warn("⚠️ Anthropic API failed in TransactionsPage. Using Offline Fallback!", aiError.message);
      const lower = rawText.toLowerCase();
      // Very simple RegEx offline heuristic scanning
      let amount = 0;
      const matchAmt = rawText.match(/\d+(,\d+)*(\.\d+)?/);
      if (matchAmt) amount = parseFloat(matchAmt[0].replace(/,/g, ''));

      let type = "expense";
      if (lower.includes("profit") || lower.includes("earned") || lower.includes("salary")) type = "income";

      let category = "Misc";
      if (lower.includes("food") || lower.includes("swiggy") || lower.includes("zomato")) category = "food";
      else if (lower.includes("uber") || lower.includes("ola") || lower.includes("metro")) category = "transport_public";
      else if (lower.includes("netflix") || lower.includes("spotify")) category = "subscriptions";

      const sdgTags = assignSDGTags(category, rawText);

      res.status(200).json({
        success: true,
        data: { description: rawText.substring(0,60), amount, type, category, sdgTags }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getDrains = async (req, res) => {
  try {
    const { userId = "demo-user" } = req.body;
    const recentTx = await Transaction.find({ user_id: userId }).sort({ createdAt: -1 }).limit(150);
    
    const insights = detectDrains(recentTx);
    res.status(200).json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
