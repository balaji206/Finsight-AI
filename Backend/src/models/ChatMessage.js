/**
 * ChatMessage Model
 * Stores individual chat messages for the AI Financial Coach feature.
 * Fields: userId, role (user | assistant), content, timestamps.
 * Usage: Max 50 messages per user — oldest are trimmed in the controller.
 */
import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      default: "demo-user",
      index: true, // Index for fast per-user lookups
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
