import express from "express";
import {
  logTransaction,
  getTransactions,
  getWeeklySummary,
  updateTransaction,
  deleteTransaction
} from "../controllers/ledgerController.js";

const router = express.Router();

// Simple mock auth middleware for now
// In a real app, this verifies a JWT and sets req.body.userId
const requireAuth = (req, res, next) => {
  if (!req.body?.userId && !req.query?.userId) {
    const dummyId = "00000000-0000-0000-0000-000000000000";
    if (req.method === 'GET' || req.method === 'DELETE') {
      req.query.userId = dummyId;
    } else {
      if (!req.body) req.body = {};
      req.body.userId = dummyId;
    }
  }
  next();
};

router.post("/log", requireAuth, logTransaction);
router.get("/transactions", requireAuth, getTransactions);
router.get("/weekly-summary", requireAuth, getWeeklySummary);
router.put("/transactions/:id", requireAuth, updateTransaction);
router.delete("/transactions/:id", requireAuth, deleteTransaction);

export default router;
