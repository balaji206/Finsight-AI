import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
console.log("Key prefix:", process.env.GEMINI_API_KEY?.slice(0, 8));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try different model names
const modelsToTry = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-pro",
  "gemini-1.0-pro",
];

for (const modelName of modelsToTry) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hi");
    const text = result.response.text();
    console.log(`✅ ${modelName} works: "${text.slice(0, 40)}"`);
    break;
  } catch (e) {
    console.log(`❌ ${modelName}: ${e.status || ''} ${e.message?.slice(0, 60)}`);
  }
}
