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
