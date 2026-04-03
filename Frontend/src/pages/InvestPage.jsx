import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShieldAlert, TrendingUp, ShieldCheck, Leaf, Info, ChevronDown, ChevronUp } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 'horizon',
    text: 'What is your investment horizon?',
    options: [
      { label: 'Short (< 3 years)', value: 1 },
      { label: 'Medium (3-7 years)', value: 2 },
      { label: 'Long (> 7 years)', value: 3 },
    ]
  },
  {
    id: 'risk',
    text: 'What is your risk tolerance for this investment?',
    options: [
      { label: 'Low (Capital Preservation)', value: 1 },
      { label: 'Moderate (Balanced)', value: 2 },
      { label: 'High (Capital Appreciation)', value: 3 },
    ]
  },
  {
    id: 'income',
    text: 'How stable is your current and future income?',
    options: [
      { label: 'Uncertain / Freelance', value: 1 },
      { label: 'Variable / Business', value: 2 },
      { label: 'Stable / Salaried', value: 3 },
    ]
  },
  {
    id: 'existing',
    text: 'What is the nature of your existing investments?',
    options: [
      { label: 'None / FDs mostly', value: 1 },
      { label: 'Mostly Debt Mutual Funds', value: 2 },
      { label: 'Some Equity exposure', value: 3 },
    ]
  },
  {
    id: 'dependents',
    text: 'How many financial dependents do you have?',
    options: [
      { label: '3 or more', value: 1 },
      { label: '1 to 2', value: 2 },
      { label: 'None', value: 3 },
    ]
  },
  {
    id: 'emergency',
    text: 'How many months of expenses do you have in an emergency fund?',
    options: [
      { label: 'None or < 1 month', value: 1 },
      { label: 'About 3 months', value: 2 },
      { label: '6 months or more', value: 3 },
    ]
  },
  {
    id: 'knowledge',
    text: 'Rate your investment knowledge level:',
    options: [
      { label: 'Beginner', value: 1 },
      { label: 'Intermediate', value: 2 },
      { label: 'Advanced', value: 3 },
    ]
  }
];

const COLORS = {
  equity: '#3b82f6', // Blue
  debt: '#64748b',   // Slate
  gold: '#fbbf24',   // Amber
  liquid: '#94a3b8', // Light Slate
  esg: '#10b981',    // Emerald Green
};

const InvestPage = () => {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom allocations for the slider
  const [customAllocation, setCustomAllocation] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  const handleOptionChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length < QUIZ_QUESTIONS.length) {
      setError('Please answer all questions to get proper recommendations.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/invest/risk-assessment`, answers);
      setResults(response.data);
      setCustomAllocation(response.data.suggestedAllocation);
    } catch (err) {
      setError('Failed to fetch recommendations. Please ensure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (type, value) => {
    setCustomAllocation(prev => ({
      ...prev,
      [type]: Number(value)
    }));
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Validate custom allocations total
  const allocationTotal = customAllocation ? Object.values(customAllocation).reduce((a, b) => a + b, 0) : 0;
  const isAllocationValid = allocationTotal === 100;

  // Prepare chart data
  const chartData = customAllocation 
    ? Object.keys(customAllocation).map(key => ({
        name: key.toUpperCase(),
        value: customAllocation[key],
        fill: COLORS[key] || '#cccccc'
      })).filter(item => item.value > 0)
    : [];

  const getProfileIcon = (profile) => {
    if (profile === 'Conservative') return <ShieldCheck className="text-green-500 w-8 h-8" />;
    if (profile === 'Moderate') return <TrendingUp className="text-blue-500 w-8 h-8" />;
    if (profile === 'Aggressive') return <ShieldAlert className="text-red-500 w-8 h-8" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 font-sans">
      <div className="max-w-7xl w-full px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Intelligence</h1>
        <p className="text-gray-600 mb-8">Take our risk assessment questionnaire to get personalized, SDG-aligned portfolio recommendations.</p>
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Panel: Risk Profile Quiz (approx 40%) */}
          <div className="w-full lg:w-2/5 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" />
              Risk Profile Quiz
            </h2>
            
            <form onSubmit={handleQuizSubmit} className="space-y-6">
              {QUIZ_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-sm font-medium text-indigo-600 mb-1 block">Question {idx + 1}</span>
                  <p className="text-gray-800 font-medium mb-3">{q.text}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name={q.id} 
                          value={opt.value}
                          checked={answers[q.id] === opt.value}
                          onChange={() => handleOptionChange(q.id, opt.value)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:bg-white/50 shadow-md border border-gray-200"
              >
                {loading ? 'Analyzing Profile...' : 'Get Recommendations'}
              </button>
            </form>
          </div>

          {/* Right Panel: Recommendations & Allocations (approx 60%) */}
          <div className="w-full lg:w-3/5 space-y-6">
            {!results ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-500">Awaiting Assessment</h3>
                <p className="text-gray-400 mt-2">Complete the quiz on the left panel to discover your personalized asset allocation and fund recommendations.</p>
              </div>
            ) : (
              <>
                {/* Score & Profile Insight */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-6">
                  <div className="bg-gray-50 p-4 rounded-full border border-gray-100">
                    {getProfileIcon(results.riskProfile)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Your Risk Profile</h2>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{results.riskProfile}</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on your score of <strong className="text-indigo-600">{results.score}/21</strong>. 
                      {results.riskProfile === 'Aggressive' && ' You have a high risk capacity, allowing for heavy equity and ESG tilts.'}
                      {results.riskProfile === 'Moderate' && ' You have a balanced profile, ideal for a mix of growth and stability.'}
                      {results.riskProfile === 'Conservative' && ' Capital preservation is your priority. Debt and liquid funds dominate.'}
                    </p>
                  </div>
                </div>

                {/* Asset Allocation Chart & Sliders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Target Asset Allocation</h3>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Donut Chart */}
                    <div className="w-full md:w-1/2 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={800}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Sliders */}
                    <div className="w-full md:w-1/2 space-y-4">
                      <div className="flex justify-between items-center text-sm font-medium mb-1">
                        <span className="text-gray-600">Total Allocation:</span>
                        <span className={`px-2 py-1 rounded ${isAllocationValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {allocationTotal}% {isAllocationValid ? 'Valid' : '(Must be 100%)'}
                        </span>
                      </div>
                      
                      {Object.keys(customAllocation).map((key) => (
                         customAllocation[key] !== undefined && (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize font-medium text-gray-700">{key}</span>
                              <span className="text-gray-500">{customAllocation[key]}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={customAllocation[key]} 
                              onChange={(e) => handleSliderChange(key, e.target.value)}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                         )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommended Funds */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 ml-1">Suggested Funds & Portfolio Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.recommendedFunds.map((fund) => {
                      const isEsg = fund.type === 'esg';
                      return (
                        <div key={fund.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${isEsg ? 'border-emerald-200 shadow-emerald-50' : 'border-gray-200'}`}>
                          <div className={`p-5 ${isEsg ? 'bg-gradient-to-r from-emerald-50 to-white' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                                  {fund.category}
                                </span>
                                <h4 className="text-md font-bold text-gray-900 leading-tight">{fund.name}</h4>
                              </div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap
                                ${fund.riskLevel.includes('High') ? 'bg-red-100 text-red-700' : 
                                  fund.riskLevel.includes('Low') ? 'bg-green-100 text-green-700' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                Risk: {fund.riskLevel}
                              </span>
                            </div>
                            
                            <div className="mt-3 flex gap-4 text-sm text-gray-600 font-medium">
                              <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                                Target Return: <span className="text-indigo-600 font-bold">{fund.expectedReturnLow}% - {fund.expectedReturnHigh}%</span> pa
                              </div>
                            </div>
                          </div>

                          {/* SDG / Expandable section */}
                          {Boolean(fund.rationale) && (
                            <div className="border-t border-gray-100">
                              <button 
                                onClick={() => toggleExpand(fund.id)}
                                className={`w-full flex justify-between items-center p-3 text-sm font-medium transition-colors
                                  ${isEsg ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                              >
                                <span className="flex items-center gap-2">
                                  {isEsg ? <Leaf className="w-4 h-4" /> : <Info className="w-4 h-4"/>}
                                  {isEsg ? 'Why this supports your goals and the planet' : 'Fund Rationale'}
                                </span>
                                {expandedCards[fund.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              
                              {expandedCards[fund.id] && (
                                <div className={`p-4 text-sm leading-relaxed ${isEsg ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-100' : 'bg-white text-gray-600'}`}>
                                  {fund.rationale}
                                  {fund.sdgTags && fund.sdgTags.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {fund.sdgTags.map(tag => (
                                        <span key={tag} className="text-xs font-bold px-2 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-md shadow-sm">
                                          SDG {tag} Aligned
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvestPage;
