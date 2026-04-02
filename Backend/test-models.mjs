import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-3.1-flash",
  "gemini-1.5-pro",
  "gemini-2.0-pro",
  "gemini-pro"
];

for (const m of models) {
  try {
    const model = genAI.getGenerativeModel({ model: m });
    const res = await model.generateContent("Hi");
    console.log(`✅ ${m} works:`, res.response.text().slice(0, 50));
    process.exit(0);
  } catch (e) {
    console.log(`❌ ${m}: ${e.message.slice(0, 100)}`);
  }
}
