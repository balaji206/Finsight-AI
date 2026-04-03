import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import forecastRoutes from "./routes/forecast.js";
import trackerRoutes from "./routes/expenseTracker.js";
import transactionsRouter from "./routes/transactions.js";
import marketRoutes from "./routes/market.js";
import watchlistRoutes from "./routes/watchlist.js";
import ledgerRoutes from "./routes/ledger.js";
import investRoutes from "./routes/invest.js";
import goalRoutes from "./routes/goals.js";

import budgetRoutes from "./routes/budget.js";

import coachRoutes from "./routes/coach.js";
import dashboardRoutes from "./routes/dashboard.js";
import authRoutes from "./routes/auth.js";


const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(",") 
      : ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/transactions", transactionsRouter);
app.use("/api/market", marketRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/invest", investRoutes);
app.use("/api/goals", goalRoutes);

app.use("/api/budget", budgetRoutes);

app.use("/api/coach", coachRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.get("/", (req, res) => {
  res.json({
    success: true,
    project: "FinSight AI",
    tagline: "Intelligent Financial Insights Powered by AI",
    version: "1.0.0",
    status: "Server is up and running 🚀",
  });
});

app.get("/api/info", (req, res) => {
  res.json({
    success: true,
    name: "FinSight AI",
    description:
      "An AI-powered financial analysis platform that delivers real-time insights, market intelligence, and predictive analytics.",
    version: "1.0.0",
    author: "FinSight AI Team",
  });
});

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Database Connection ──────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finsight_ai")
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

// ─── ALWAYS start server ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FinSight AI Server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Frontend    : ${process.env.FRONTEND_URL || "http://localhost:5173"}\n`);
});

export default app;
