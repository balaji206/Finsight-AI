export default function WeeklySummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div className="bg-white text-black border border-gray-300 p-4 rounded mb-6">
      <h3 className="font-bold mb-2">Weekly Summary & Impact</h3>
      <div className="whitespace-pre-wrap text-gray-800 text-sm">
        {summary}
      </div>
    </div>
  );
}
