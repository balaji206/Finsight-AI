import React, { useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

// The backend is running on PORT 5000 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ForecastPage() {
  const [formData, setFormData] = useState({
    currentNetWorth: 500000,
    annualIncome: 1200000,
    annualExpenses: 600000,
    timeHorizonYears: 20,
    numSimulations: 5000,
    inflationRate: 0.06,
    sdgInitialScore: 45
  });

  const [portfolio, setPortfolio] = useState([
    { name: "Equity", allocation: 60, expectedReturn: 0.12, volatility: 0.18, sdgFactor: 0.4 },
    { name: "Debt", allocation: 30, expectedReturn: 0.07, volatility: 0.05, sdgFactor: 0.2 },
    { name: "Sustainable Funds", allocation: 10, expectedReturn: 0.09, volatility: 0.14, sdgFactor: 0.9 }
  ]);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handlePortfolioChange = (index, field, value) => {
    const updated = [...portfolio];
    updated[index][field] = parseFloat(value) || 0;
    setPortfolio(updated);
  };

  const addAsset = () => {
    setPortfolio([...portfolio, { name: "New Asset", allocation: 0, expectedReturn: 0.10, volatility: 0.15, sdgFactor: 0.5 }]);
  };

  const removeAsset = (index) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const runForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...formData, portfolio };
      const res = await axios.post(`${API_URL}/api/forecast`, payload);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRupee = (val) => {
    if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
    if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const projectionData = results?.projections.years.map((year, i) => ({
    year: `Yr ${year}`,
    meanNW: results.projections.meanNetWorth[i],
    p10NW: results.projections.p10NetWorth[i],
    p90NW: results.projections.p90NetWorth[i],
    meanSDG: results.projections.meanSDGScore[i]
  })) || [];

  const histogramData = results?.distribution?.bins.map((bin, i) => ({
    bin,
    count: results.distribution.counts[i]
  })) || [];

  const totalAllocation = portfolio.reduce((acc, curr) => acc + curr.allocation, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold text-slate-800">Growth & SDG Forecast</h1>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold drop-shadow-sm">
            AI Monte Carlo Engine
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h2 className="text-xl font-bold mb-6 text-slate-700">Simulation Parameters</h2>
            
            <div className="space-y-4 text-left">
              {[
                { label: 'Current Net Worth (₹)', name: 'currentNetWorth', step: "10000" },
                { label: 'Annual Income (₹)', name: 'annualIncome', step: "10000" },
                { label: 'Annual Expenses (₹)', name: 'annualExpenses', step: "10000" },
                { label: 'Horizon (Years)', name: 'timeHorizonYears' },
                { label: 'Simulations (1-10000)', name: 'numSimulations', step: "500" },
                { label: 'Inflation Rate', name: 'inflationRate', step: "0.01" },
                { label: 'Current SDG Score', name: 'sdgInitialScore' }
              ].map(field => (
                <div key={field.name} className="flex flex-col text-slate-700">
                  <label className="block text-sm font-semibold text-slate-600 mb-1">{field.label}</label>
                  <input
                    type="number"
                    step={field.step || "1"}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 text-left">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-700">Portfolio Design</h3>
                <span className={`text-sm font-bold px-2 py-1 rounded ${totalAllocation === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {totalAllocation}%
                </span>
              </div>
              
              <div className="space-y-4">
                {portfolio.map((asset, i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                    <button onClick={() => removeAsset(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">✕</button>
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => {
                        const updated = [...portfolio];
                        updated[i].name = e.target.value;
                        setPortfolio(updated);
                      }}
                      className="font-bold text-slate-700 bg-transparent border-b border-slate-300 w-[85%] mb-3 outline-none focus:border-blue-500 transition"
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Allocation %</label>
                        <input type="number" value={asset.allocation} onChange={(e) => handlePortfolioChange(i, 'allocation', e.target.value)} className="w-full p-2 border border-slate-300 rounded shadow-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Expected Ret.</label>
                        <input type="number" step="0.01" value={asset.expectedReturn} onChange={(e) => handlePortfolioChange(i, 'expectedReturn', e.target.value)} className="w-full p-2 border border-slate-300 rounded shadow-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Volatility</label>
                        <input type="number" step="0.01" value={asset.volatility} onChange={(e) => handlePortfolioChange(i, 'volatility', e.target.value)} className="w-full p-2 border border-slate-300 rounded shadow-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-semibold mb-1 block">SDG Factor</label>
                        <input type="number" step="0.1" value={asset.sdgFactor} onChange={(e) => handlePortfolioChange(i, 'sdgFactor', e.target.value)} className="w-full p-2 border border-slate-300 rounded shadow-sm outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addAsset} className="w-full mt-4 py-2.5 border-2 border-dashed border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-100 transition">
                + Add Asset
              </button>
            </div>

            <button
              onClick={runForecast}
              disabled={loading || totalAllocation !== 100}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Run Monte Carlo Forecast'
              )}
            </button>
            
            {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 break-words">{error}</div>}
          </div>

          {/* Results Analytics Panel */}
          <div className="lg:col-span-2 space-y-6">
            {results ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Mean Final NW</div>
                    <div className="text-2xl font-bold text-slate-800">{formatRupee(results.summary.finalMeanNetWorth)}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">P10 (Worst Case)</div>
                    <div className="text-2xl font-bold text-red-500">{formatRupee(results.summary.finalP10NetWorth)}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">P90 (Best Case)</div>
                    <div className="text-2xl font-bold text-emerald-500">{formatRupee(results.summary.finalP90NetWorth)}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Doubling Prob.</div>
                    <div className="text-2xl font-bold text-blue-600">{results.summary.probabilityOfDoubling.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Net Worth Projection Fan Chart
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                      <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(val) => `₹${(val/1e7).toFixed(1)}Cr`} fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip formatter={(val) => formatRupee(val)} />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="p90NW" stroke="none" fill="#e0f2fe" name="90th Percentile" />
                      <Area type="monotone" dataKey="p10NW" stroke="none" fill="#bae6fd" name="10th Percentile" />
                      <Line type="monotone" dataKey="meanNW" stroke="#0ea5e9" strokeWidth={3} dot={false} name="Mean Trajectory" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SDG Line Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
                      SDG Impact Trajectory
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                        <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip formatter={(val) => val.toFixed(1)} />
                        <Line type="monotone" dataKey="meanSDG" stroke="#10b981" strokeWidth={3} dot={false} name="Mean SDG Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Allocation Pie Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                      Portfolio Allocation
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={portfolio}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="allocation"
                        >
                          {portfolio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(val) => `${val}%`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Histogram Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80 md:col-span-2">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                      <span className="w-3 h-3 bg-pink-500 rounded-full mr-2"></span>
                      Final Net Worth Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={histogramData} barCategoryGap="10%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                        <XAxis dataKey="bin" fontSize={10} hide />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Occurrences" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                <svg className="w-20 h-20 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium text-slate-500">Awaiting Simulation</p>
                <p className="text-sm mt-2">Adjust your parameters and run the Monte Carlo engine to visualize your future.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
