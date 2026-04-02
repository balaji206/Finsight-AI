import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

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

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FinSight AI Server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Frontend    : ${process.env.FRONTEND_URL || "http://localhost:5173"}\n`);
});

export default app;
