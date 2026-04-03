import Budget from "../models/Budget.js";
import { Transaction } from "../models/Transaction.js";
import Goal from "../models/Goal.js";
import { generateBudgetPlan } from "../services/budgetAiService.js";

// Helper to get exact Date boundaries for a given "YYYY-MM"
const getMonthBounds = (monthStr) => {
  const start = new Date(`${monthStr}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  return { start, end };
};

export const getBudget = async (req, res) => {
  try {
    const { userId = "demo-user" } = req.query;
    const { month } = req.params; // "YYYY-MM"

    // Find the budget, if not exist, we just return an empty template
    let budget = await Budget.findOne({ userId, month });
    
    // Automatically calculate 'spent' locally from Ledger
    const { start, end } = getMonthBounds(month);
    const transactions = await Transaction.find({
      user_id: userId,
      date: { $gte: start, $lt: end }
    });

    // Merge actual offline transactions into the active budget view organically
    let totalIncome = 0;
    const actualSpentCat = {};

    transactions.forEach(tx => {
      if (tx.type === "income" || tx.type === "profit") {
        totalIncome += tx.amount;
      } else if (tx.type === "expense") {
        const cat = tx.category.toLowerCase();
        actualSpentCat[cat] = (actualSpentCat[cat] || 0) + tx.amount;
      }
    });

    if (!budget) {
      // Offline default
      budget = new Budget({ userId, month, income: totalIncome || 50000, categories: [], aiInsights: [] });
    } else {
      budget.income = totalIncome || budget.income;
    }

    // Map `spent` onto categories dynamically so UI doesn't have to calculate it
    const updatedCategories = budget.categories.map(c => ({
      name: c.name,
      allocated: c.allocated,
      spent: actualSpentCat[c.name.toLowerCase()] || 0
    }));

    // Inject any unaccounted actual spending as unallocated categories
    Object.keys(actualSpentCat).forEach(key => {
      if (!updatedCategories.find(c => c.name.toLowerCase() === key)) {
        updatedCategories.push({ name: key, allocated: 0, spent: actualSpentCat[key] });
      }
    });

    // Save dynamic updates immediately (Upsert)
    // Avoid _id collision on new unsaved docs
    if(budget._id) {
       await Budget.findByIdAndUpdate(budget._id, { categories: updatedCategories, income: budget.income });
    } else {
       budget.categories = updatedCategories;
    }
    
    res.status(200).json({ success: true, data: { ...budget.toObject(), categories: updatedCategories } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateAiBudget = async (req, res) => {
  try {
     const { userId = "demo-user", month } = req.body;

     // 1. Fetch all transactions for AI comparison across time
     const recentTx = await Transaction.find({ user_id: userId });
     
     const expenseMap = {};
     let avgMonthlyIncomeObj = 0;
     let incomeCountObj = 0;

     recentTx.forEach(tx => {
        if(tx.type === "expense") {
            const c = tx.category.toLowerCase();
            expenseMap[c] = (expenseMap[c] || 0) + tx.amount;
        } else if (tx.type === "income" || tx.type === "profit") {
            avgMonthlyIncomeObj += tx.amount;
            incomeCountObj++;
        }
     });

     // Average out over 3 months
     Object.keys(expenseMap).forEach(k => expenseMap[k] = Math.round(expenseMap[k] / 3));
     const avgMonthlyIncome = incomeCountObj > 0 ? Math.round(avgMonthlyIncomeObj / Math.min(incomeCountObj, 3)) : 50000;

     // 2. Fetch Active Goals
     const goals = await Goal.find({ userId });
     const goalsSummary = goals.map(g => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentSaved: g.currentAmount,
        requiredMonthly: g.requiredMonthlySavings || Math.round((g.targetAmount - g.currentAmount) / 12)
     }));

     // 3. Ask Anthropic what they should do, fallback to Local Engine!
     let aiPlan;
     try {
         aiPlan = await generateBudgetPlan(expenseMap, goalsSummary, avgMonthlyIncome);
     } catch (aiError) {
         console.warn("⚠️ Anthropic AI Budget generation completely failed (Rate Limit). Enforcing local offline fallback heuristics.");
         aiPlan = { categories: [], aiInsights: [] };
         aiPlan.aiInsights.push("⚠️ (Offline Engine) Anthropic AI limit reached! We mapped your local spending averages manually.");
         
         if (goalsSummary.length > 0) {
             const prioGoal = goalsSummary[0];
             aiPlan.aiInsights.push(`💡 Tip: Shaving just 10% off discretionary categories will accelerate your ["${prioGoal.name}"] goal significantly!`);
         }

         Object.keys(expenseMap).forEach(key => {
             // Heuristic: Reduce average past spending by a smart 5% margin to encourage savings offline
             aiPlan.categories.push({ name: key, allocated: Math.max(Math.round(expenseMap[key] * 0.95), 100) });
         });
     }
     
     // 4. Save to DB
     let budget = await Budget.findOne({ userId, month });
     if (!budget) {
        budget = new Budget({ userId, month, income: avgMonthlyIncome });
     }
     
     // Wipe requested allocations and enforce AI rules
     const mappedCategories = aiPlan.categories.map(c => ({
        name: c.name,
        allocated: c.allocated,
        spent: 0 // Local GET route handles spent dynamically
     }));

     budget.categories = mappedCategories;
     budget.aiInsights = aiPlan.aiInsights || [];
     budget.income = avgMonthlyIncome || 50000;
     await budget.save();

     res.status(200).json({ success: true, data: budget });
  } catch (err) {
     console.error(err);
     // Fallback if AI gets rate limited
     res.status(500).json({ success: false, error: err.message || "AI failed to generate budget" });
  }
};
