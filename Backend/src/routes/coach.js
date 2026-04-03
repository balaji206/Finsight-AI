/**
 * coach.js — Express router for the AI Financial Coach feature
 *
 * Routes:
 *   GET    /api/coach/history   → fetch all messages (seeds welcome on first visit)
 *   POST   /api/coach/message   → send a message and receive a streaming response
 *   DELETE /api/coach/history   → clear all messages for demo-user
 */
import express from "express";
import {
  getHistory,
  sendMessage,
  clearHistory,
} from "../controllers/coachController.js";

const router = express.Router();

router.get("/history", getHistory);
router.post("/message", sendMessage);
router.delete("/history", clearHistory);

export default router;
