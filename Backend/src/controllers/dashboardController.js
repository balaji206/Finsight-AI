/**
 * dashboardController.js
 * Controller to handle all dashboard-related API requests.
 */
import * as dashboardService from "../services/dashboardService.js";

/**
 * GET /api/dashboard/networth
 */
export const getNetWorth = async (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    const data = await dashboardService.getNetWorthData(userId);
    const assetsVsLiabilities = await dashboardService.getAssetsVsLiabilities(userId);
    const spendingTrend = await dashboardService.getSpendingTrend(userId);
    const healthScore = await dashboardService.getFinancialHealthScore(userId);
    const upcomingBills = await dashboardService.getUpcomingBills(userId);
    const savingsRate = await dashboardService.getSavingsRateTrend(userId);

    res.status(200).json({
      success: true,
      data: {
        ...data,
        assetsVsLiabilities,
        spendingTrend,
        healthScore,
        upcomingBills,
        savingsRate
      }
    });
  } catch (error) {
    console.error("Error fetching net worth data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/dashboard/sdg-impact
 */
export const getSDGImpact = async (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    const data = await dashboardService.getSDGImpactData(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching SDG impact data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/dashboard/recent-transactions
 */
export const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    // Reuse existing Transaction model + simple query
    const { Transaction } = await import("../models/Transaction.js");
    const data = await Transaction.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/dashboard/insights
 */
export const getInsights = async (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    const data = await dashboardService.getTodayInsight(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
