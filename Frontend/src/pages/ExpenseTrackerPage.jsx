import { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1968"];

export default function ExpenseTrackerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expectedBudget, setExpectedBudget] = useState("");
  const [submittedBudget, setSubmittedBudget] = useState(null);

  const fetchAnalysis = async (budgetStr = null) => {
    setLoading(true);
    try {
      const qs = budgetStr ? `?expectedBudget=${budgetStr}` : "";
      const res = await axios.get(`${API_URL}/api/tracker/analysis${qs}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tracker data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    setSubmittedBudget(expectedBudget);
    fetchAnalysis(expectedBudget);
  };

  if (loading && !data) {
    return <div className="p-8 text-center text-gray-500">Loading Smart Analysis...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-2 text-blue-900">Smart Expense Tracker</h1>
      <p className="mb-6 text-gray-600 border-b pb-4">
        Discover hidden drains, predict upcoming costs, and see the reality of your spending vs. expectations.
      </p>

      {/* Budget Context Banner */}
      <div className="bg-white border text-black border-blue-200 p-4 rounded mb-8 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-blue-800">Set Monthly Expectation</h3>
          <p className="text-sm text-gray-500">Tell FinSight what you thought you'd spend to see the gap insight.</p>
        </div>
        <form onSubmit={handleBudgetSubmit} className="flex gap-2">
          <input
            type="number"
            value={expectedBudget}
            onChange={(e) => setExpectedBudget(e.target.value)}
            placeholder="e.g. 5000"
            className="border border-gray-300 p-2 rounded outline-none w-32"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Analyze
          </button>
        </form>
      </div>

      {!data ? (
        <div className="text-red-500">Failed to load analytics data.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* AI Insights Panel (Left Side) */}
          <div className="flex flex-col gap-6">
            <div className="bg-orange-50 border border-orange-200 p-5 rounded shadow-sm">
              <h2 className="text-orange-900 font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">🚨</span> Hidden Drains
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-orange-800 text-sm">
                {data.drains?.map((drain, idx) => (
                  <li key={idx}>{drain}</li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded shadow-sm">
              <h2 className="text-emerald-900 font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">🔮</span> Predictive Forecast
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-emerald-800 text-sm">
                {data.predictions?.map((pred, idx) => (
                  <li key={idx}>{pred}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-5 rounded shadow-sm">
              <h2 className="text-blue-900 font-bold mb-3">AI Insight: Reality vs Expectation</h2>
              <p className="text-blue-800 text-sm font-medium">"{data.insightText}"</p>
            </div>
          </div>

          {/* Chart Panel (Right Side) */}
          <div className="bg-white border border-gray-200 p-5 rounded shadow-sm flex flex-col items-center">
            <h2 className="text-purple-900 font-bold mb-4 w-full text-left">Where Your Money Actually Went</h2>
            {data.chartData && data.chartData.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Not enough category data generated to display chart.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
