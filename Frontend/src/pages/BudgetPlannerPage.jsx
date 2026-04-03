import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addMonths, subMonths } from 'date-fns';
import { TrendingUp, Target, BrainCircuit, ChevronLeft, ChevronRight, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function BudgetPlannerPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const monthStr = format(currentMonth, 'yyyy-MM');
  const displayMonth = format(currentMonth, 'MMMM yyyy');

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/budget/${monthStr}`);
      setBudget(res.data.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [currentMonth]);

  const generateAiBudget = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/api/budget/generate`, { month: monthStr });
      setBudget(res.data.data);
      // Local re-fetch to ensure spent dynamics map correctly since POST only updates category limits
      await fetchBudget();
    } catch (err) {
      console.error(err);
      setError('AI engine failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const fmt = (n) => '₹' + (n || 0).toLocaleString('en-IN');
  
  const totalAllocated = budget?.categories?.reduce((acc, c) => acc + (c.allocated || 0), 0) || 0;
  const totalSpent = budget?.categories?.reduce((acc, c) => acc + (c.spent || 0), 0) || 0;
  const income = budget?.income || 0;
  const toBeBudgeted = income - totalAllocated;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BrainCircuit className="text-indigo-600" size={24} /> Intelligent Planner
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-bold text-gray-700 min-w-[120px] text-center">{displayMonth}</p>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex bg-gray-100 p-2 rounded-2xl items-center shadow-inner text-sm">
            <div className="px-5 text-center border-r border-gray-300">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5 tracking-wider">Avg Income</p>
              <p className="text-gray-900 font-bold">{fmt(income)}</p>
            </div>
            <div className={`px-5 text-center ${toBeBudgeted < 0 ? 'text-red-600' : toBeBudgeted > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
               <p className="text-[10px] uppercase font-bold mb-0.5 w-full flex justify-center tracking-wider">Available</p>
               <p className="font-extrabold text-lg bg-white px-3 py-0.5 rounded-lg border shadow-sm">
                  {fmt(toBeBudgeted)}
               </p>
            </div>
             <div className="px-5 text-center border-l border-gray-300">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5 tracking-wider">Allocated</p>
              <p className="text-indigo-600 font-bold">{fmt(totalAllocated)}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        
        {/* Error Flag */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3"><AlertTriangle size={20}/> <span>{error}</span></div>
                <button onClick={fetchBudget} className="text-sm font-bold underline">Retry</button>
            </div>
        )}

        {/* Top Feature: AI Goal Generator CTA */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 opacity-[0.03] transform translate-x-4 -translate-y-4">
                <BrainCircuit size={180} />
            </div>
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/20 via-transparent to-cyan-500/10 pointer-events-none"></div>
            
            <div className="relative z-10 md:w-3/4">
                <h2 className="text-2xl md:text-3xl font-black mb-3 text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-300">Intelligent Adaptive Engine</h2>
                <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed font-medium">
                    Tap into the power of Gemini AI. We'll instantly review your previous 90 days of categorized ledger data, compare it against your active Life Goals, and algorithmically engineer an optimized budget structure just for you.
                </p>
                <button 
                  onClick={generateAiBudget} 
                  disabled={generating}
                  className="bg-indigo-600 text-white border border-indigo-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  {generating ? (
                      <><div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin"/> Generating...</>
                  ) : (
                      <><Target size={18} /> Apply Intelligent Strategy via AI</>
                  )}
                </button>
            </div>
        </div>

        {/* AI Actionable Insights Grid */}
        {budget && budget.aiInsights?.length > 0 && (
            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                    <TrendingUp size={16}/> Goal Acceleration Strategies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {budget.aiInsights.map((insight, idx) => (
                        <div key={idx} className="bg-white border hover:border-indigo-200 shadow-sm rounded-2xl p-5 hover:-translate-y-1 transition text-sm leading-relaxed text-gray-700 border-l-4 border-l-cyan-400 font-medium">
                            {insight}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Core YNAB Grid */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mt-4">
            <div className="border-b px-6 py-4 bg-gray-50 flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"/>
                <h3 className="text-lg font-bold text-gray-800">Adaptive Category Allocations</h3>
            </div>
            
            {loading ? (
                <div className="p-10 text-center text-gray-400">Loading your budgets...</div>
            ) : budget?.categories?.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {budget.categories.map((cat, idx) => {
                        const prog = cat.allocated > 0 ? Math.min((cat.spent / cat.allocated) * 100, 100) : cat.spent > 0 ? 100 : 0;
                        const remaining = cat.allocated - cat.spent;
                        const isOver = cat.spent > cat.allocated;
                        
                        return (
                            <div key={idx} className="p-4 px-6 hover:bg-gray-50 flex flex-col md:flex-row items-center gap-6">
                                <div className="w-full md:w-1/4">
                                    <p className="font-bold text-gray-800 capitalize text-lg">{cat.name.replace(/_/g, " ")}</p>
                                </div>
                                
                                <div className="w-full md:w-3/4 flex flex-col justify-center">
                                    <div className="flex justify-between text-sm mb-2 items-end">
                                        <div className="flex gap-4">
                                            <div>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Assigned</p>
                                              <p className="font-semibold text-gray-700">{fmt(cat.allocated)}</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Spent</p>
                                              <p className="font-semibold text-gray-700">{fmt(cat.spent)}</p>
                                            </div>
                                        </div>
                                        <div>
                                            {isOver ? (
                                                <p className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-lg flex gap-1 items-center">
                                                    <AlertCircle size={14}/> Over by {fmt(Math.abs(remaining))}
                                                </p>
                                            ) : (
                                                <p className={`font-bold px-3 py-1 rounded-lg flex gap-1 items-center ${remaining === 0 ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    <CheckCircle2 size={14}/> {fmt(remaining)} left
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                          className={`h-2.5 rounded-full transition-all duration-1000 ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                                          style={{ width: `${Math.max(prog, 2)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="p-16 text-center text-gray-500 max-w-sm mx-auto">
                    <p className="mb-4 text-base">You haven't budgeted any funds this month. Run the AI generator to populate a baseline instantly.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
