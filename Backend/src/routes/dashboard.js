/**
 * dashboard.js
 * Definitions for dashboard API routes.
 */
import express from "express";
import {
  getNetWorth,
  getSDGImpact,
  getRecentTransactions,
  getInsights
} from "../controllers/dashboardController.js";

const router = express.Router();

/**
 * Route: GET /api/dashboard/networth
 * Description: Fetches net worth summary, history, and assets/liabilities charts
 */
router.get("/networth", getNetWorth);

/**
 * Route: GET /api/dashboard/sdg-impact
 * Description: Fetches SDG score, top SDGs, and weekly impact trends
 */
router.get("/sdg-impact", getSDGImpact);

/**
 * Route: GET /api/dashboard/recent-transactions
 * Description: Fetches last 5 transactions for display
 */
router.get("/recent-transactions", getRecentTransactions);

/**
 * Route: GET /api/dashboard/insights
 * Description: Fetches AI-generated daily actionable financial + SDG insight
 */
router.get("/insights", getInsights);

export default router;
