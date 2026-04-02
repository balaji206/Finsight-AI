import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: String, // Kept as string to support simple UUIDs or string IDs
    required: true,
  },
  type: {
    type: String,
    enum: ["expense", "income", "profit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  sdg_tags: {
    type: [String],
    default: [],
  },
  raw_input: {
    type: String,
  },
}, { timestamps: true });

export const Transaction = mongoose.model("Transaction", transactionSchema);
