import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const getGemini = () => {
    const key = process.env.GEMINI_API_KEY || "";
    console.log("Using key starting with:", key.substring(0, 10));
    return new GoogleGenerativeAI(key);
};

async function test() {
    try {
        const genAI = getGemini();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: "You are a bot" });
        const result = await model.generateContent("hello");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Gemini Error:", e.name, e.message);
    }
}
test();
