import express from "express";
import { getBudget, generateAiBudget } from "../controllers/budgetController.js";

const router = express.Router();

router.get("/:month", getBudget);
router.post("/generate", generateAiBudget);

export default router;
