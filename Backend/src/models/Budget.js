import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  allocated: { type: Number, default: 0 },
  spent: { type: Number, default: 0 }
});

const budgetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  month: { type: String, required: true }, // Format "YYYY-MM"
  income: { type: Number, default: 0 },
  categories: [categorySchema],
  aiInsights: [String]
}, { timestamps: true });

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
