import React, { useState,useEffect } from 'react';
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

  useEffect(() => {
    try {
      const injected = JSON.parse(localStorage.getItem('sdgSimulations') || '[]');
      if (injected.length > 0) {
        setPortfolio(prev => {
          const existingNames = prev.map(p => p.name);
          const newAssets = injected.filter(i => !existingNames.includes(i.name));
          if (newAssets.length === 0) return prev;
          
          let updated = [...prev, ...newAssets];
          const newAllocations = newAssets.reduce((sum, a) => sum + a.allocation, 0);
          
          const equityIdx = updated.findIndex(p => p.name === "Equity");
          if (equityIdx !== -1 && updated[equityIdx].allocation >= newAllocations) {
            updated[equityIdx] = { 
              ...updated[equityIdx], 
              allocation: updated[equityIdx].allocation - newAllocations 
            };
          }
          
          return updated;
        });
      }
    } catch (e) {
      console.error("Local storage bridge failed", e);
    }
  }, []);

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
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h1 className="text-3xl font-bold text-white">Growth & SDG Forecast</h1>
          <span className="text-sm bg-white/10 text-white/60 px-3 py-1 rounded-full font-semibold drop-shadow-sm">
            AI Monte Carlo Engine
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Form */}
          <div className="lg:col-span-1 bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-white/10 h-fit">
            <h2 className="text-xl font-bold mb-6 text-white/90">Simulation Parameters</h2>
            
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
                <div key={field.name} className="flex flex-col text-white/80">
                  <label className="block text-sm font-semibold text-white/60 mb-1">{field.label}</label>
                  <input
                    type="number"
                    step={field.step || "1"}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-black border border-white/10 rounded-lg focus:ring-2 focus:ring-white/50 outline-none transition text-white"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 text-left">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white/90">Portfolio Design</h3>
                <span className={`text-sm font-bold px-2 py-1 rounded ${totalAllocation === 100 ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-500'}`}>
                  {totalAllocation}%
                </span>
              </div>
              
              <div className="space-y-4">
                {portfolio.map((asset, i) => (
                  <div key={i} className="p-4 border border-white/10 rounded-xl bg-black relative group">
                    <button onClick={() => removeAsset(i)} className="absolute top-3 right-3 text-white/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">✕</button>
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => {
                        const updated = [...portfolio];
                        updated[i].name = e.target.value;
                        setPortfolio(updated);
                      }}
                      className="font-bold text-white/90 bg-transparent border-b border-white/20 w-[85%] mb-3 outline-none focus:border-white/50 transition"
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs text-white/60 font-semibold mb-1 block">Allocation %</label>
                        <input type="number" value={asset.allocation} onChange={(e) => handlePortfolioChange(i, 'allocation', e.target.value)} className="w-full p-2 bg-black border text-white border-white/10 rounded shadow-sm outline-none focus:border-white/50" />
                      </div>
                      <div>
                        <label className="text-xs text-white/60 font-semibold mb-1 block">Expected Ret.</label>
                        <input type="number" step="0.01" value={asset.expectedReturn} onChange={(e) => handlePortfolioChange(i, 'expectedReturn', e.target.value)} className="w-full p-2 border bg-black text-white border-white/10 rounded shadow-sm outline-none focus:border-white/50" />
                      </div>
                      <div>
                        <label className="text-xs text-white/60 font-semibold mb-1 block">Volatility</label>
                        <input type="number" step="0.01" value={asset.volatility} onChange={(e) => handlePortfolioChange(i, 'volatility', e.target.value)} className="w-full p-2 border bg-black text-white border-white/10 rounded shadow-sm outline-none focus:border-white/50" />
                      </div>
                      <div>
                        <label className="text-xs text-white/60 font-semibold mb-1 block">SDG Factor</label>
                        <input type="number" step="0.1" value={asset.sdgFactor} onChange={(e) => handlePortfolioChange(i, 'sdgFactor', e.target.value)} className="w-full p-2 border bg-black text-white border-white/10 rounded shadow-sm outline-none focus:border-white/50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addAsset} className="w-full mt-4 py-2.5 border-2 border-dashed border-white/20 text-white/60 font-semibold rounded-lg hover:bg-white/5 transition">
                + Add Asset
              </button>
            </div>

            <button
              onClick={runForecast}
              disabled={loading || totalAllocation !== 100}
              className="w-full mt-8 bg-white text-black hover:bg-slate-200 disabled:bg-white/20 disabled:text-white/50 font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all flex justify-center items-center relative z-10"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              ) : (
                'Run Monte Carlo Forecast'
              )}
            </button>
            
            {error && <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium border border-red-500/20 break-words">{error}</div>}
          </div>

          {/* Results Analytics Panel */}
          <div className="lg:col-span-2 space-y-6">
            {results ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div className="bg-[#0a0a0a] p-5 rounded-2xl shadow-sm border border-white/10">
                    <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">Mean Final NW</div>
                    <div className="text-2xl font-bold text-white">{formatRupee(results.summary.finalMeanNetWorth)}</div>
                  </div>
                  <div className="bg-[#0a0a0a] p-5 rounded-2xl shadow-sm border border-white/10">
                    <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">P10 (Worst Case)</div>
                    <div className="text-2xl font-bold text-white/50">{formatRupee(results.summary.finalP10NetWorth)}</div>
                  </div>
                  <div className="bg-[#0a0a0a] p-5 rounded-2xl shadow-sm border border-white/10">
                    <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">P90 (Best Case)</div>
                    <div className="text-2xl font-bold text-white">{formatRupee(results.summary.finalP90NetWorth)}</div>
                  </div>
                  <div className="bg-[#0a0a0a] p-5 rounded-2xl shadow-sm border border-white/10">
                    <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">Doubling Prob.</div>
                    <div className="text-2xl font-bold text-white">{results.summary.probabilityOfDoubling.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-white/10 h-96">
                  <h3 className="font-bold text-white mb-6 flex items-center">
                    <span className="w-3 h-3 bg-white rounded-full mr-2"></span>
                    Net Worth Projection Fan Chart
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} tick={{fill:"#888"}} />
                      <YAxis tickFormatter={(val) => `₹${(val/1e7).toFixed(1)}Cr`} fontSize={12} tickLine={false} axisLine={false} tick={{fill:"#888"}} />
                      <RechartsTooltip contentStyle={{backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff'}} formatter={(val) => formatRupee(val)} />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="p90NW" stroke="none" fill="rgba(255,255,255,0.2)" name="90th Percentile" />
                      <Area type="monotone" dataKey="p10NW" stroke="none" fill="rgba(255,255,255,0.4)" name="10th Percentile" />
                      <Line type="monotone" dataKey="meanNW" stroke="#ffffff" strokeWidth={3} dot={false} name="Mean Trajectory" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SDG Line Chart */}
                  <div className="bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-white/10 h-80">
                    <h3 className="font-bold text-white mb-6 flex items-center">
                      <span className="w-3 h-3 bg-white/60 rounded-full mr-2"></span>
                      SDG Impact Trajectory
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} tick={{fill:"#888"}} />
                        <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} tick={{fill:"#888"}} />
                        <RechartsTooltip contentStyle={{backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff'}} formatter={(val) => val.toFixed(1)} />
                        <Line type="monotone" dataKey="meanSDG" stroke="#ffffff" strokeWidth={3} dot={false} name="Mean SDG Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Allocation Pie Chart */}
                  <div className="bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-white/10 h-80">
                    <h3 className="font-bold text-white mb-4 flex items-center">
                      <span className="w-3 h-3 bg-white/40 rounded-full mr-2"></span>
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
                          {portfolio.map((entry, index) => {
                             return <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />;
                          })}
                        </Pie>
                        <RechartsTooltip contentStyle={{backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff'}} formatter={(val) => `${val}%`} />
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
