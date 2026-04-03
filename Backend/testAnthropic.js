import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const getAnthropic = () => {
    const key = process.env.ANTHROPIC_API_KEY || "";
    return new Anthropic({ apiKey: key });
};

async function test() {
    try {
        const anthropic = getAnthropic();
        console.log("Key found:", !!process.env.ANTHROPIC_API_KEY);
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 10,
            temperature: 0.2,
            messages: [{ role: "user", content: "hello" }]
        });
        console.log("Success:", !!response.content);
    } catch (e) {
        console.error("SDK Error:", e.name, e.message);
    }
}
test();
