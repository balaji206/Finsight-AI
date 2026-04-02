import Goal from "../models/Goal.js";
import { calculateGoalMetrics } from "../services/goalService.js";

// ─── GET /api/goals ───────────────────────────────────────────────────────────
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: "demo-user" }).sort({
      createdAt: -1,
    });
    const goalsWithMetrics = goals.map((goal) => ({
      ...goal.toObject(),
      ...calculateGoalMetrics(goal),
    }));
    res.status(200).json({ success: true, data: goalsWithMetrics });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching goals", error: error.message });
  }
};

// ─── POST /api/goals ──────────────────────────────────────────────────────────
export const createGoal = async (req, res) => {
  try {
    console.log("📥 POST /api/goals body:", JSON.stringify(req.body, null, 2));
    const newGoal = new Goal({ ...req.body, userId: "demo-user" });
    const saved = await newGoal.save();
    const metrics = calculateGoalMetrics(saved);
    res.status(201).json({ success: true, data: { ...saved.toObject(), ...metrics } });
  } catch (error) {
    console.error("❌ createGoal error:", error.message);
    res
      .status(400)
      .json({ success: false, message: "Error creating goal", error: error.message });
  }
};

// ─── PUT /api/goals/:id ───────────────────────────────────────────────────────
export const updateGoal = async (req, res) => {
  try {
    const updated = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated)
      return res.status(404).json({ success: false, message: "Goal not found" });
    const metrics = calculateGoalMetrics(updated);
    res.status(200).json({ success: true, data: { ...updated.toObject(), ...metrics } });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Error updating goal", error: error.message });
  }
};

// ─── DELETE /api/goals/:id ────────────────────────────────────────────────────
export const deleteGoal = async (req, res) => {
  try {
    const deleted = await Goal.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Goal not found" });
    res.status(200).json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting goal", error: error.message });
  }
};

// ─── POST /api/goals/:id/calculate ───────────────────────────────────────────
export const calculateWhatIf = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal)
      return res.status(404).json({ success: false, message: "Goal not found" });
    const { simulatedMonthlySaving } = req.body;
    const metrics = calculateGoalMetrics(goal, simulatedMonthlySaving);
    res.status(200).json({ success: true, data: { ...goal.toObject(), ...metrics } });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Simulation error", error: error.message });
  }
};
