import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "demo-user" },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: Date, required: true },
    inflationRate: { type: Number, default: 6, min: 4, max: 10 },
    sdgs: [Number],
  },
  {
    timestamps: true, // Mongoose built-in createdAt/updatedAt — no pre-save hook needed
  }
);

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
