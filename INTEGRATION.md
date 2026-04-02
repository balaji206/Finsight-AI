# Net Worth Dashboard Integration Guide

This document explains how to set up, run, and further enhance the Net Worth Dashboard feature in the FinSight AI project.

## 🚀 Setup Instructions

### 1. MongoDB Connection
Ensure your `.env` file in the `Backend/` directory has a valid `MONGO_URI`.
```bash
MONGO_URI=mongodb://127.0.0.1:27017/finsight_ai
```

### 2. Install Dependencies
Run the following commands in their respective directories:

**Backend:**
```bash
cd Backend
npm install express cors dotenv mongoose
```

**Frontend:**
```bash
cd Frontend
npm install axios recharts lucide-react date-fns
```

### 3. Run the Application
**Backend:**
```bash
npm run dev
```
(Runs on `http://localhost:5000`)

**Frontend:**
```bash
npm run dev
```
(Runs on `http://localhost:5173`)

Navigate to `http://localhost:5173/dashboard` to view the feature.

---

## 🔗 Feature Connections

- **Transactions (/api/dashboard/recent-transactions)**: Automatically pulls the last 5 logs from the `Transaction` model. Ensure users log data via the "Ledger" page to see updates.
- **Goals (/api/dashboard/networth)**: Net worth assets include the `currentAmount` from all active goals in the `Goal` model.
- **SDG Impact (/api/dashboard/sdg-impact)**: Uses a weighted formula (40% Tx, 40% Goals, 20% Budget) to calculate your sustainability score.

---

## 💎 Future AI Upgrade: Real Gemini Insights

The current "Today's AI Insight" uses rule-based logic in `dashboardService.js`. To upgrade to real-time generative insights:

1.  **Update `getTodayInsight`** in `Backend/src/services/dashboardService.js`.
2.  Pass the user's recent transactions and goal progress to the Gemini model.
3.  Prompt: *"Based on these financial logs [TX_DATA] and goals [GOAL_DATA], provide a 2-sentence actionable insight that balances wealth growth with SDG impact."*

---

## 🛠️ Components Checklist
- [x] **Backend Services**: `dashboardService.js`, `sdgImpactService.js`
- [x] **API Layer**: `controllers/dashboardController.js`, `routes/dashboard.js`
- [x] **Frontend UI**: `pages/DashboardPage.jsx` with full responsive Tailwind grid.
- [x] **Charts**: Recharts (Net worth area, Asset pie, Spend bars, SDG progress).
