import { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/pie-chart";
import "./ExpenseTrackerPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const GRAYS = [
  "rgba(255,255,255,0.9)", "rgba(255,255,255,0.65)",
  "rgba(255,255,255,0.45)", "rgba(255,255,255,0.3)",
  "rgba(255,255,255,0.2)", "rgba(255,255,255,0.12)"
];

export default function ExpenseTrackerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expectedBudget, setExpectedBudget] = useState("");

  const fetchAnalysis = async (budgetStr = null) => {
    setLoading(true);
    try {
      const qs = budgetStr ? `?expectedBudget=${budgetStr}` : "";
      const res = await axios.get(`${API_URL}/tracker/analysis${qs}`);
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tracker data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalysis(); }, []);

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    fetchAnalysis(expectedBudget);
  };

  return (
    <div className="et-root">

      <div className="et-container">
        {/* Header */}
        <header className="et-header">
          <div>
            <span className="et-sub-tag">SMART ANALYTICS</span>
            <h1 className="et-title">Expense <span className="et-title-italic">Intelligence</span></h1>
            <p className="et-desc">Discover hidden drains, predict upcoming costs, and see the reality of your spending.</p>
          </div>
          <form onSubmit={handleBudgetSubmit} className="et-budget-form">
            <label className="et-label">SET MONTHLY EXPECTATION</label>
            <div className="et-input-row">
              <span className="et-rupee">₹</span>
              <input
                type="number"
                value={expectedBudget}
                onChange={(e) => setExpectedBudget(e.target.value)}
                placeholder="e.g. 50000"
                className="et-input"
              />
              <button type="submit" className="et-btn" disabled={loading}>
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </form>
        </header>

        {loading && !data ? (
          <div className="et-loading">
            <div className="et-spinner"></div>
            <p>Running smart analysis…</p>
          </div>
        ) : !data ? (
          <div className="et-error">Failed to load analytics data.</div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="et-stats-row">
              <div className="et-stat">
                <p className="et-stat-label">TOTAL SPENT</p>
                <p className="et-stat-value">₹{data.totalSpent?.toLocaleString('en-IN') ?? '—'}</p>
              </div>
              <div className="et-stat">
                <p className="et-stat-label">CATEGORIES</p>
                <p className="et-stat-value">{data.chartData?.length ?? '—'}</p>
              </div>
              <div className="et-stat">
                <p className="et-stat-label">TOP DRAIN</p>
                <p className="et-stat-value">{data.chartData?.[0]?.name ?? '—'}</p>
              </div>
            </div>

            {/* Main Grid */}
            <div className="et-grid">
              {/* Chart */}
              <div className="et-card et-chart-card flex flex-col">
                <div className="et-card-header">
                  <h3>Spending Breakdown</h3>
                  <span className="et-card-tag">WHERE IT WENT</span>
                </div>
                <div className="flex-1 pb-0 mt-4">
                  {data.chartData?.length > 0 ? (
                    <ChartContainer
                      config={{
                        value: { label: "Amount" },
                        ...data.chartData.reduce((acc, curr, i) => {
                          const keyName = curr.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                          acc[keyName] = { 
                            label: curr.name, 
                            color: ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'][i % 6] 
                          };
                          return acc;
                        }, {})
                      }}
                      className="[&_.recharts-text]:fill-white mx-auto aspect-square max-h-[280px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={<ChartTooltipContent nameKey="name" hideLabel />}
                        />
                        {[...data.chartData]
                          .sort((a, b) => a.value - b.value)
                          .map((entry, index, arr) => {
                            const BASE_RADIUS = 50;
                            const SIZE_INCREMENT = 10;
                            const totalValue = arr.reduce((sum, d) => sum + d.value, 0);
                            const sumBefore = arr.slice(0, index).reduce((sum, d) => sum + d.value, 0);
                            const sumCurrent = arr.slice(0, index + 1).reduce((sum, d) => sum + d.value, 0);
                            const keyName = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                            
                            return (
                              <Pie
                                key={`pie-${index}`}
                                data={[entry]}
                                innerRadius={35}
                                outerRadius={BASE_RADIUS + index * SIZE_INCREMENT}
                                dataKey="value"
                                nameKey="name"
                                cornerRadius={4}
                                startAngle={(sumBefore / totalValue) * 360}
                                endAngle={(sumCurrent / totalValue) * 360}
                              >
                                <Cell fill={`var(--color-${keyName})`} />
                                {/* Optional label inside the chunks if desired, but user screenshot didn't have it, keeping empty to look like Shadcn demo */}
                              </Pie>
                            );
                        })}
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <p className="et-empty">Not enough data to display chart.</p>
                  )}
                </div>
                <div className="et-pie-legend mt-4 px-2">
                  {(data.chartData || []).map((item, idx) => {
                    const chartColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
                    return (
                      <div key={idx} className="flex justify-between items-center mb-2 text-sm text-[rgba(255,255,255,0.7)]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: chartColors[idx % chartColors.length] }}></div>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold text-white">₹{item.value?.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insights */}
              <div className="et-insights-col">
                {/* Hidden Drains */}
                <div className="et-card">
                  <div className="et-card-header">
                    <h3>Hidden Drains</h3>
                    <span className="et-warn-dot"></span>
                  </div>
                  <ul className="et-list">
                    {data.drains?.map((drain, i) => (
                      <li key={i} className="et-list-item">
                        <span className="et-bullet">—</span>
                        {drain}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Predictions */}
                <div className="et-card">
                  <div className="et-card-header">
                    <h3>Predictive Forecast</h3>
                    <span className="et-card-tag">AI</span>
                  </div>
                  <ul className="et-list">
                    {data.predictions?.map((pred, i) => (
                      <li key={i} className="et-list-item">
                        <span className="et-bullet">→</span>
                        {pred}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Insight */}
                <div className="et-card et-insight-card">
                  <div className="et-card-header">
                    <h3>AI Insight</h3>
                  </div>
                  <p className="et-insight-text">"{data.insightText}"</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
