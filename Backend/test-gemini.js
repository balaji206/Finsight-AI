import "dotenv/config";
import { parseTransactionInput } from "./src/services/aiParser.js";

async function run() {
  try {
    const res = await parseTransactionInput("I spent 500 rs on food");
    console.log("Success:", res);
  } catch (err) {
    console.error("Test Error:", err);
  }
}
run();
