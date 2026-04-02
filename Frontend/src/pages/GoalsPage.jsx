import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell } from 'recharts';
import { Target, Leaf, Plus, X, ArrowUpRight, Trash2, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SDG_LIST = [
  { id: 1,  name: 'No Poverty',                              color: '#E5233B' },
  { id: 2,  name: 'Zero Hunger',                             color: '#DDA73A' },
  { id: 3,  name: 'Good Health & Well-being',                color: '#4C9F38' },
  { id: 4,  name: 'Quality Education',                       color: '#C5192D' },
  { id: 5,  name: 'Gender Equality',                         color: '#FF3A21' },
  { id: 6,  name: 'Clean Water & Sanitation',                color: '#26BDE2' },
  { id: 7,  name: 'Affordable & Clean Energy',               color: '#FCC30B' },
  { id: 8,  name: 'Decent Work & Economic Growth',           color: '#A21942' },
  { id: 9,  name: 'Industry, Innovation & Infrastructure',   color: '#FD6925' },
  { id: 10, name: 'Reduced Inequalities',                    color: '#DD1367' },
  { id: 11, name: 'Sustainable Cities & Communities',        color: '#FD9D24' },
  { id: 12, name: 'Responsible Consumption & Production',    color: '#BF8B2E' },
  { id: 13, name: 'Climate Action',                          color: '#3F7E44' },
  { id: 14, name: 'Life Below Water',                        color: '#0A97D9' },
  { id: 15, name: 'Life on Land',                            color: '#56C02B' },
  { id: 16, name: 'Peace, Justice & Strong Institutions',    color: '#00689D' },
  { id: 17, name: 'Partnerships for the Goals',              color: '#19486A' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => '₹' + (n || 0).toLocaleString('en-IN');

function StatusBadge({ status }) {
  const map = {
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'On Track': 'bg-blue-100 text-blue-700 border-blue-200',
    'At Risk':  'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${map[status] || map['On Track']}`}>
      {status}
    </span>
  );
}

function ProgressRing({ percent, size = 80 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const filled = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#grad)" strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={filled}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Top gradient strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-t-2xl" />

      <div className="flex justify-between items-start mb-4 mt-1">
        <h3 className="font-bold text-gray-800 text-lg leading-tight pr-2 group-hover:text-indigo-600 transition-colors">
          {goal.name}
        </h3>
        <StatusBadge status={goal.status} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <ProgressRing percent={goal.progressPercent} size={72} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{goal.progressPercent}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">Target</p>
          <p className="font-semibold text-gray-800 text-sm">{fmt(goal.targetAmount)}</p>
          <p className="text-xs text-gray-400 mt-1">
            Saved: <span className="text-indigo-600 font-medium">{fmt(goal.currentAmount)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1 text-gray-500">
          <TrendingUp size={14} />
          <span>
            <span className={`font-bold ${goal.successProbability > 70 ? 'text-emerald-600' : goal.successProbability > 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {goal.successProbability}%
            </span>{' '}
            chance
          </span>
        </div>
        {goal.sdgs?.length > 0 && (
          <div className="flex gap-1">
            {goal.sdgs.slice(0, 3).map((id) => {
              const s = SDG_LIST.find((x) => x.id === id);
              return (
                <span
                  key={id}
                  className="inline-block w-5 h-5 rounded text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: s?.color || '#6366f1' }}
                  title={s?.name}
                >
                  {id}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GoalFormModal ────────────────────────────────────────────────────────────
function GoalFormModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    inflationRate: 6,
    sdgs: [],
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const toggleSdg = (id) => {
    setForm((p) => {
      if (p.sdgs.includes(id)) return { ...p, sdgs: p.sdgs.filter((s) => s !== id) };
      if (p.sdgs.length >= 3) return p;
      return { ...p, sdgs: [...p.sdgs, id] };
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Basic frontend validation
    if (!form.name.trim()) { setSaveError('Goal name is required.'); return; }
    if (!form.targetAmount || Number(form.targetAmount) < 1) { setSaveError('Target amount must be at least ₹1.'); return; }
    if (!form.targetDate) { setSaveError('Please select a target date.'); return; }
    setSaveError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount || 0),
      });
    } catch (err) {
      setSaveError(err?.response?.data?.error || err?.message || 'Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target size={20} className="text-indigo-600" /> New Goal
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Retirement, Child's Education, House..."
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹) *</label>
              <input
                required type="number" min="1" placeholder="500000"
                value={form.targetAmount} onChange={(e) => set('targetAmount', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Already Saved (₹)</label>
              <input
                type="number" min="0" placeholder="0"
                value={form.currentAmount} onChange={(e) => set('currentAmount', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
            <input
              required type="date"
              value={form.targetDate} onChange={(e) => set('targetDate', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Inflation Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Inflation Rate:{' '}
              <span className="text-indigo-600 font-bold">{form.inflationRate}%</span>
            </label>
            <input
              type="range" min="4" max="10" step="0.5"
              value={form.inflationRate} onChange={(e) => set('inflationRate', Number(e.target.value))}
              className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>4%</span><span>10%</span>
            </div>
          </div>

          {/* SDG Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SDG Alignment <span className="text-gray-400">(pick up to 3)</span>
            </label>
            <div className="h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1 bg-gray-50">
              {SDG_LIST.map((sdg) => (
                <div
                  key={sdg.id}
                  onClick={() => toggleSdg(sdg.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition ${
                    form.sdgs.includes(sdg.id)
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                      : 'hover:bg-gray-100 text-gray-700 border border-transparent'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: sdg.color }}
                  >
                    {sdg.id}
                  </span>
                  {sdg.name}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-gray-100">
          {saveError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              ⚠️ {saveError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GoalDetailModal ──────────────────────────────────────────────────────────
function GoalDetailModal({ goal: init, onClose, onRefresh }) {
  const [goal, setGoal] = useState(init);
  const [simSaving, setSimSaving] = useState(init.requiredMonthlySavings || 5000);
  const [deleting, setDeleting] = useState(false);

  const handleSim = async (val) => {
    setSimSaving(val);
    try {
      const res = await axios.post(`${API_URL}/api/goals/${goal._id}/calculate`, {
        simulatedMonthlySaving: val,
      });
      setGoal(res.data.data || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this goal permanently?')) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/goals/${goal._id}`);
      onRefresh();
      onClose();
    } catch (e) {
      setDeleting(false);
    }
  };

  const maxSlider = Math.max(50000, (goal.requiredMonthlySavings || 10000) * 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col md:flex-row">

        {/* LEFT: Snapshot */}
        <div className="bg-gradient-to-b from-indigo-50 to-white md:w-80 flex-shrink-0 p-7 flex flex-col border-r border-gray-100 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Goal Detail</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 md:hidden">
              <X size={20} />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 leading-tight mb-1">{goal.name}</h2>
          <StatusBadge status={goal.status} />

          {/* Large Ring */}
          <div className="flex justify-center my-6">
            <div className="relative">
              <ProgressRing percent={goal.progressPercent} size={140} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-800">{goal.healthScore}</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">health</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {[
              { label: 'Target Amount', value: fmt(goal.targetAmount) },
              { label: 'Inflation-adj Target', value: fmt(goal.inflationAdjustedTarget), sub: true },
              { label: 'Amount Saved', value: fmt(goal.currentAmount), accent: true },
              { label: 'Monthly Needed', value: fmt(goal.requiredMonthlySavings) },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className={`font-semibold ${accent ? 'text-indigo-600' : 'text-gray-800'} ${sub ? 'text-sm' : 'text-base'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* SDGs */}
          {goal.sdgs?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Leaf size={12} className="text-emerald-500" /> SDG Alignment
              </p>
              <div className="flex flex-wrap gap-2">
                {goal.sdgs.map((id) => {
                  const s = SDG_LIST.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="text-white text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: s?.color || '#6366f1' }}
                    >
                      SDG {id}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                <Leaf size={11} className="inline mr-1" />
                Est. SDG contribution: <strong>{fmt(goal.sdgContribution)}</strong>
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Analysis */}
        <div className="flex-1 overflow-y-auto p-7 relative">
          <button onClick={onClose} className="hidden md:block absolute top-5 right-5 text-gray-400 hover:text-gray-700">
            <X size={22} />
          </button>

          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3">Analysis & Projections</h3>

          {/* Success Probability */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-indigo-400 uppercase mb-1">Success Probability</p>
              <div className={`text-5xl font-black ${goal.successProbability > 70 ? 'text-emerald-500' : goal.successProbability > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                {goal.successProbability}%
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-emerald-500 uppercase mb-1 flex items-center gap-1">
                <Leaf size={11} /> SDG Value
              </p>
              <div className="text-2xl font-bold text-emerald-700">{fmt(goal.sdgContribution)}</div>
              <p className="text-xs text-emerald-600 mt-1">Lifetime impact</p>
            </div>
          </div>

          {/* What-If Scenario */}
          <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" />
              What-If Scenario Planner
            </h4>
            <label className="block text-gray-600 text-sm mb-3">
              If you save{' '}
              <span className="text-indigo-600 font-bold text-base">{fmt(simSaving)}</span>{' '}
              per month…
            </label>
            <input
              type="range" min="0" max={maxSlider} step="500"
              value={simSaving}
              onChange={(e) => handleSim(Number(e.target.value))}
              className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>₹0</span><span>{fmt(maxSlider)}</span>
            </div>
            {goal.requiredMonthlySavings > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                💡 You need approx. <strong>{fmt(goal.requiredMonthlySavings)}/month</strong> to stay on track.
              </div>
            )}
          </div>

          {/* Risk Factors */}
          {goal.riskFactors?.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Risk Factors</h4>
              <ul className="space-y-2">
                {goal.riskFactors.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                    <ArrowUpRight size={15} className="mt-0.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delete */}
          <div className="border-t pt-5 flex justify-end">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting…' : 'Delete Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main GoalsPage ───────────────────────────────────────────────────────────
export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/goals`);
      // Handle both {success, data: [...]} and plain array responses
      setGoals(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (e) {
      setError('Failed to load goals. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSave = async (formData) => {
    // throws on error so GoalFormModal can catch and display it
    const res = await axios.post(`${API_URL}/api/goals`, formData);
    setShowForm(false);
    fetchGoals();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="text-indigo-600" size={24} />
            Life Goal Planner
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan, track and achieve your long-term financial goals.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Summary Strip */}
      {goals.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex gap-8 text-sm">
          <span className="text-gray-500">
            Total Goals: <strong className="text-gray-800">{goals.length}</strong>
          </span>
          <span className="text-gray-500">
            On Track:{' '}
            <strong className="text-blue-600">
              {goals.filter((g) => g.status === 'On Track').length}
            </strong>
          </span>
          <span className="text-gray-500">
            At Risk:{' '}
            <strong className="text-red-600">
              {goals.filter((g) => g.status === 'At Risk').length}
            </strong>
          </span>
          <span className="text-gray-500">
            Completed:{' '}
            <strong className="text-emerald-600">
              {goals.filter((g) => g.status === 'Completed').length}
            </strong>
          </span>
        </div>
      )}

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading goals…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="max-w-md mx-auto mt-16 text-center">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="text-red-600 font-medium">⚠️ {error}</p>
              <button onClick={fetchGoals} className="mt-3 text-sm text-red-500 underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
              <Target className="text-indigo-400" size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No goals yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              Start planning your financial future. Add your first life goal and we'll help you track and
              achieve it with AI-powered insights.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition"
            >
              <Plus size={16} /> Create Your First Goal
            </button>
          </div>
        )}

        {/* Goal Grid */}
        {!loading && !error && goals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((g) => (
              <GoalCard key={g._id} goal={g} onClick={() => setSelected(g)} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && <GoalFormModal onClose={() => setShowForm(false)} onSave={handleSave} />}
      {selected && !showForm && (
        <GoalDetailModal
          goal={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchGoals}
        />
      )}
    </div>
  );
}
