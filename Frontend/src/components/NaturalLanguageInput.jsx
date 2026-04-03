import { useState } from "react";

export default function NaturalLanguageInput({ onLog }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    await onLog(input);
    setLoading(false);
    setInput("");
  };

  return (
    <div className="bg-white border text-black border-gray-300 p-4 rounded mb-6">
      <h3 className="font-bold mb-2">Log a Transaction</h3>
      <form onSubmit={handleSubmit} className="flex gap-2 isolate">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I spent ₹450 on food today..."
          className="flex-1 border text-black bg-white border-gray-300 p-2 rounded outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black border border-gray-300 font-bold px-6 py-2 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 shadow-sm"
        >
          {loading ? "Logging..." : "Log"}
        </button>
      </form>
    </div>
  );
}
