import express from "express";
import multer from "multer";
import fs from "fs";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransactionObj,
  uploadCSV,
  importCSV,
  runAIParse,
  getDrains
} from "../controllers/transactionController.js";

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

const router = express.Router();

router.get("/", getTransactions);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransactionObj);

// Dedicated Bulk/AI endpoits
router.post("/upload-csv", upload.single("csv"), uploadCSV);
router.post("/import", importCSV);
router.post("/parse-ai", runAIParse);
router.post("/detect-drains", getDrains);

export default router;
