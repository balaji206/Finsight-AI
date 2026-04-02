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
# FinSight-AI Integration Guide

This document explains the architecture of the new `Transactions` subsystem and how to connect it naturally to other modules.

## Architecture

The system operates autonomously utilizing a rule-based AI parsing engine.
- Instead of using expensive LLM API calls for every categorization, we rely on `sdgMapping.js` which detects distinct keywords (`netflix`, `metro`, `organic`) to strictly dictate an SDG taxonomy profile.
- When Transactions are inserted manually, uploaded via CSV, or injected via the AI rule parser, they automatically retrieve `1-17` UN SDG tags.

## Connecting to /goals and /forecast

1. **Forecast Linkage**: 
   Since `/api/transactions` saves everything uniformly with `date` timestamps, your `Forecast` feature can natively hit `GET /api/transactions`. By applying a linear regression algorithm matching the categories, `Forecast` can estimate next month's identical spends.

2. **Goal Linkage (`/goals`)**:
   Add a `targetValue` inside the Goals dataset. You can poll `GET /api/transactions` filtering specifically by SDG Tags (`sdgTags=12`). If the sum of spending for SDG-12 exceeds the user's monthly sustainable goal, prompt them with an alert!

## MongoDB Setup
Uses `Mongoose`. The `Transaction.js` schema requires `userId`. Ensure when building an authentication module (e.g. JWT) that you swap the hardcoded `"demo-user"` identity mapped in `transactionController.js` logic.

## Reconnecting Generative AI (LLMs)
If the project acquires a stable Gemini API key without limits, upgrading is exceptionally simple.
1. Target `/api/transactions/parse-ai` inside `transactionController.js`.
2. Swap out the simplistic RegEx match algorithm block with `gemini-pro` parsing exactly like the original.
3. Replace `getDrains` in `drainDetectionService.js` by pushing the JSON summary directly to the LLM context.
