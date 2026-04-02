async function test() {
  try {
    const res1 = await fetch("http://localhost:5000/api/ledger/log", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw_input: "test income 500" })
    });
    console.log("LOG RESPONSE:", await res1.json());
  } catch (e) {
    console.error("LOG ERROR:", e);
  }

  try {
    const res2 = await fetch("http://localhost:5000/api/ledger/transactions");
    console.log("GET RESPONSE:", await res2.json());
  } catch (e) {
    console.error("GET ERROR:", e);
  }
}
test();
