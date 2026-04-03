import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Info, PlusCircle, 
  ArrowRight, Heart, Zap, Globe, BookOpen, 
  Award, Target, MessageSquare, IndianRupee 
} from 'lucide-react';

const API_BASE = "http://localhost:5000/api";
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

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Financial Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome back! Here's your net worth and SDG impact summary.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-gray-600">Systems Active</span>
             </div>
             <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Live Insights</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Wide) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Net Worth & Health Score Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Net Worth Hero Card */}
              <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-emerald-600">
                  <IndianRupee size={80} />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Net Worth</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl font-extrabold text-gray-900">₹{netWorthData?.totalNetWorth.toLocaleString('en-IN')}</h2>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      parseFloat(netWorthData?.percentChange) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {parseFloat(netWorthData?.percentChange) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(netWorthData?.percentChange)}%
                    </div>
                  </div>
                  
                  <div className="mt-8 h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={netWorthData?.history}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Savings Rate</p>
                        <p className="text-lg font-extrabold text-gray-900">
                          {netWorthData?.savingsRate?.length > 0 
                            ? `${netWorthData.savingsRate[netWorthData.savingsRate.length - 1].rate}%` 
                            : '0%'}
                        </p>
                     </div>
                     <div className="h-10 w-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={netWorthData?.savingsRate}>
                            <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                </div>
              </div>

              {/* Health Score Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-lg shadow-emerald-100 flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="relative z-10">
                    <div className="bg-black/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                       <Heart size={20} />
                    </div>
                    <p className="text-sm text-green-500 font-bold uppercase tracking-widest opacity-80">Health Score</p>
                    <h2 className="text-5xl text-green-900 font-black mt-1">{netWorthData?.healthScore}</h2>
                    <p className="text-xs font-bold mt-2 bg-green-200 text-green-900 inline-block px-2 py-1 rounded-lg">Excellent</p>
                 </div>
                 <div className="relative z-10 mt-6 pt-6 border-t border-white/20">
                    <p className="text-[10px] font-bold text-green-900 leading-tight">Your financial stability is in the top 5% of users. Keep up the good work!</p>
                 </div>
              </div>
            </div>

            {/* Assets vs Liabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target size={20} className="text-blue-600" />
                  Assets Allocation
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(netWorthData?.assetsVsLiabilities || []).filter(d => d.name !== 'Liabilities')}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(netWorthData?.assetsVsLiabilities || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                   {(netWorthData?.assetsVsLiabilities || []).filter(d => d.name !== 'Liabilities').map((item, idx) => (
                     <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[10px] font-medium text-gray-500 uppercase">{item.name}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info size={20} className="text-orange-600" />
                  Asset vs Liability
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={[
                      { name: 'Assets', value: netWorthData?.totalNetWorth + 15000, fill: '#10b981' },
                      { name: 'Liabilities', value: 15000, fill: '#ef4444' }
                    ]}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Spending Trend */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" />
                Income vs Expense (6 Months)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={netWorthData?.spendingTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: '500' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: '500' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px' }} 
                      formatter={(value) => `₹${value.toLocaleString('en-IN')}`} 
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Right Column (Narrow) */}
          <div className="space-y-8">
            
            {/* Today's AI Insight */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                  <Zap size={20} />
                </div>
                <h3 className="font-bold text-blue-800">Today's AI Insight</h3>
              </div>
              <p className="text-sm leading-relaxed text-black font-medium">
                "{insight?.text}"
              </p>
              <div className="mt-6 flex justify-end">
                <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-1 group">
                  Learn More <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentTransactions.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${tx.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {tx.type === 'expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{tx.category || tx.notes}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {tx.type === 'expense' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/ledger')}
                className="w-full mt-6 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors"
              >
                View All Transactions
              </button>
            </div>

            {/* Upcoming Bills */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 uppercase text-[10px] tracking-widest text-gray-400">Upcoming Bills</h3>
              <div className="space-y-3">
                {netWorthData?.upcomingBills?.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                     <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-xs text-gray-400">
                           <BookOpen size={16} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-gray-900">{bill.title}</p>
                           <p className="text-[10px] text-gray-400 font-medium">{bill.date}</p>
                        </div>
                     </div>
                     <p className="text-xs font-black text-gray-900">₹{bill.amount}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 uppercase text-[10px] tracking-widest text-gray-400">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => navigate('/ledger')}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition-all group font-bold text-sm text-gray-700"
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-emerald-100 transition-colors">
                    <PlusCircle size={18} className="text-emerald-600" />
                  </div>
                  Add Expense
                </button>
                <button 
                  onClick={() => navigate('/ledger')}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-all group font-bold text-sm text-gray-700"
                >
                   <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-100 transition-colors">
                    <Zap size={18} className="text-blue-600" />
                  </div>
                  Log Income
                </button>
                <button 
                  onClick={() => navigate('/coach')}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-all group font-bold text-sm text-gray-700"
                >
                   <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-indigo-100 transition-colors">
                    <MessageSquare size={18} className="text-indigo-600" />
                  </div>
                  Open AI Coach
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* SDG IMPACT CARD (Prominent Emerald Theme) */}
        <div className="mt-12 bg-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-100/50 border border-emerald-100 relative overflow-hidden">
          {/* Background Decorative Circles */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full opacity-50 blur-3xl"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
            
            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center text-center">
               <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                    <circle 
                      cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={552.9}
                      strokeDashoffset={552.9 - (552.9 * (sdgData?.score || 0)) / 100}
                      strokeLinecap="round"
                      className="text-emerald-500 transition-all duration-1000 ease-out" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-gray-900">{sdgData?.score}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Impact Score</span>
                  </div>
               </div>
               <div className="mt-4 flex items-center gap-1 text-emerald-700 font-bold text-xs uppercase tracking-tighter">
                  <Award size={14} /> Performance Level: Good
               </div>
            </div>

            {/* Top SDGs */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">You're actively supporting:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sdgData?.topSDGs?.map((sdg, idx) => (
                  <div key={idx} className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100 hover:scale-105 transition-transform duration-300">
                    <div className="text-3xl mb-3">{sdg.emoji}</div>
                    <p className="text-sm font-extrabold text-gray-900 leading-tight mb-1">{sdg.name}</p>
                    <p className="text-xs font-bold text-emerald-700">₹{sdg.amount.toLocaleString('en-IN')} alignment</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 space-y-3">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} className="text-emerald-500" /> Opportunities
                </p>
                {sdgData?.opportunities?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                      <Target size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.sdg}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{item.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Trend Sparkline */}
            <div className="bg-emerald-600 rounded-[2rem] p-6 text-white h-full flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Impact Trend</h4>
                <p className="text-xl font-bold">Resilient Growth</p>
              </div>
              
              <div className="h-24 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sdgData?.weeklyTrend}>
                    <Line type="monotone" dataKey="score" stroke="rgba(255,255,255,0.8)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <button className="mt-6 w-full py-3 bg-white text-emerald-700 font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-emerald-700/20 transition-all flex items-center justify-center gap-2">
                View Full SDG Report <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
