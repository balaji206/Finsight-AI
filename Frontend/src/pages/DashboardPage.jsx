import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, ArrowRight } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/pie-chart';
import './DashboardPage.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DEMO_USER = "demo-user";

const DashboardPage = () => {
  const [netWorthData, setNetWorthData] = useState(null);
  const [sdgData, setSdgData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nwRes, sdgRes, txRes, insightRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/networth?userId=${DEMO_USER}`),
          axios.get(`${API_BASE}/dashboard/sdg-impact?userId=${DEMO_USER}`),
          axios.get(`${API_BASE}/dashboard/recent-transactions?userId=${DEMO_USER}`),
          axios.get(`${API_BASE}/dashboard/insights?userId=${DEMO_USER}`)
        ]);
        setNetWorthData(nwRes.data.data);
        setSdgData(sdgRes.data.data);
        setRecentTransactions(txRes.data.data);
        setInsight(insightRes.data.data);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) return (
    <div className="db-loading">
      <div className="db-spinner"></div>
    </div>
  );

  return (
    <div className="db-root">
      <div className="db-container">
        {/* Header */}
        <header className="db-header">
          <div>
            <p className="db-greeting">Good morning</p>
            <h1 className="db-title">{user.name || 'Financial Dashboard'}</h1>
          </div>
          <div className="db-status">
            <span className="db-pulse"></span>
            <span className="db-status-text">Live</span>
          </div>
        </header>

        {/* KPI Row */}
        <div className="db-kpi-row">
          <div className="db-kpi-card db-kpi-main">
            <p className="db-kpi-label">NET WORTH</p>
            <h2 className="db-kpi-value">₹{netWorthData?.totalNetWorth?.toLocaleString('en-IN') ?? '—'}</h2>
            <div className={`db-kpi-badge ${parseFloat(netWorthData?.percentChange) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(netWorthData?.percentChange) >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
              {Math.abs(netWorthData?.percentChange ?? 0)}%
            </div>
            <div className="db-mini-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={netWorthData?.history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary, #fff)" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="var(--color-primary, #fff)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="value" stroke="transparent" fill="url(#nwGrad)" />
                  <Line type="monotone" dataKey="value" stroke="var(--color-primary, #fff)" strokeWidth={2} dot={{ fill: '#0a0a0a', stroke: '#fff', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="db-kpi-card">
            <p className="db-kpi-label">SAVINGS RATE</p>
            <h2 className="db-kpi-value">
              {netWorthData?.savingsRate?.length > 0
                ? `${netWorthData.savingsRate[netWorthData.savingsRate.length - 1].rate}%`
                : '—'}
            </h2>
            <p className="db-kpi-sub">This month</p>
          </div>

          <div className="db-kpi-card">
            <p className="db-kpi-label">HEALTH SCORE</p>
            <h2 className="db-kpi-value">{netWorthData?.healthScore ?? '—'}</h2>
            <p className="db-kpi-sub">Excellent standing</p>
          </div>

          <div className="db-kpi-card">
            <p className="db-kpi-label">SDG SCORE</p>
            <h2 className="db-kpi-value">{sdgData?.overallScore ?? '—'}<span className="db-kpi-unit">/100</span></h2>
            <p className="db-kpi-sub">Impact aligned</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="db-grid-2">
          {/* Income vs Expense */}
          <div className="db-card">
            <div className="db-card-header">
              <h3>Income vs Expense</h3>
              <span className="db-card-tag">6 MONTHS</span>
            </div>
            <div className="db-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={netWorthData?.spendingTrend} barGap={6}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} formatter={(v) => `₹${v?.toLocaleString('en-IN')}`} />
                  <Bar dataKey="income" fill="rgba(255,255,255,0.85)" radius={[3, 3, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="rgba(255,255,255,0.2)" radius={[3, 3, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assets Allocation */}
          <div className="db-card">
            <div className="db-card-header">
              <h3>Asset Allocation</h3>
              <span className="db-card-tag">BREAKDOWN</span>
            </div>
            <div className="db-chart-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const assetData = (netWorthData?.assetsVsLiabilities || []).filter(d => d.name !== 'Liabilities');
                const chartColors = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];
                
                const chartData = assetData.map((d, i) => {
                  const keyName = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return { ...d, fill: `var(--color-${keyName})` };
                });

                const chartConfig = {
                  value: { label: "Amount" },
                  ...assetData.reduce((acc, curr, i) => {
                    const keyName = curr.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    acc[keyName] = { label: curr.name, color: chartColors[i % chartColors.length] };
                    return acc;
                  }, {})
                };

                return (
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[220px] w-full"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={<ChartTooltipContent nameKey="name" hideLabel />}
                      />
                      <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        cornerRadius={4}
                        paddingAngle={5}
                      />
                    </PieChart>
                  </ChartContainer>
                );
              })()}
            </div>
            <div className="db-pie-legend">
              {(netWorthData?.assetsVsLiabilities || []).filter(d => d.name !== 'Liabilities').map((item, idx) => {
                const chartColors = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];
                return (
                  <div key={idx} className="db-legend-item">
                    <div className="db-legend-dot" style={{ backgroundColor: chartColors[idx % chartColors.length] }}></div>
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="db-grid-2">
          {/* AI Insight */}
          <div className="db-card db-insight-card">
            <div className="db-card-header">
              <div className="db-insight-icon"><Zap size={16}/></div>
              <h3>AI Insight</h3>
            </div>
            <p className="db-insight-text">"{insight?.text}"</p>
            <button className="db-insight-btn" onClick={() => navigate('/coach')}>
              Ask AI Coach <ArrowRight size={14}/>
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="db-card">
            <div className="db-card-header">
              <h3>Recent Transactions</h3>
              <button className="db-see-all" onClick={() => navigate('/transactions')}>View all →</button>
            </div>
            <div className="db-tx-list">
              {(recentTransactions || []).slice(0, 5).map((tx, i) => (
                <div key={i} className="db-tx-item">
                  <div className="db-tx-info">
                    <p className="db-tx-name">{tx.description}</p>
                    <p className="db-tx-date">{tx.category}</p>
                  </div>
                  <p className={`db-tx-amount ${tx.type === 'income' ? 'income' : 'expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount)?.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SDG Impact */}
        {sdgData?.goals && (
          <div className="db-card">
            <div className="db-card-header">
              <h3>SDG Impact</h3>
              <span className="db-card-tag">GOALS ALIGNED</span>
            </div>
            <div className="db-sdg-grid">
              {sdgData.goals.slice(0, 6).map((goal, i) => (
                <div key={i} className="db-sdg-item">
                  <div className="db-sdg-bar-track">
                    <div className="db-sdg-bar-fill" style={{ width: `${goal.score}%` }}></div>
                  </div>
                  <p className="db-sdg-label">{goal.name}</p>
                  <p className="db-sdg-score">{goal.score}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
