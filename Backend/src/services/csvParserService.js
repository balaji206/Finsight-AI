import fs from "fs";
import * as fastCsv from "fast-csv";
import { assignSDGTags } from "./sdgMapping.js";

/**
 * Parses a CSV file and constructs an array of mapped Transaction objects ready for preview or import.
 * Expects columns roughly translating to [Date, Description, Amount, Category, Type]
 */
export const parseCSVPreview = (filePath) => {
  return new Promise((resolve, reject) => {
    const previewData = [];

    fs.createReadStream(filePath)
      .pipe(fastCsv.parse({ headers: true, ignoreEmpty: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        // Highly resilient offline mapping based on common Bank statement headers
        const dateStr = row.Date || row.date || row.DatePosted || new Date().toISOString();
        const description = row.Description || row.description || row.Notes || row.Memo || "Unknown Transaction";
        const amountStr = row.Amount || row.amount || row.Value || "0";
        const rawAmount = parseFloat(amountStr.toString().replace(/,/g, "")) || 0;
        
        let type = row.Type || row.type || "";
        type = type.toLowerCase().includes("income") || rawAmount > 0 ? "income" : "expense";
        
        const amount = Math.abs(rawAmount);

        // Best effort basic category extraction from CSV or fallback
        const category = row.Category || row.category || "Misc";
        
        const sdgTags = assignSDGTags(category, description);

        previewData.push({
          date: new Date(dateStr),
          description,
          amount,
          type,
          category,
          sdgTags
        });
      })
      .on("end", (rowCount) => {
        resolve(previewData);
      });
  });
};
