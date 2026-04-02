import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { 
  UploadCloud, Plus, Search, Filter, AlertTriangle, 
  X, CheckCircle, Info, ChevronLeft, ChevronRight 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SDG_COLORS = {
  1: "bg-red-500", 2: "bg-yellow-500", 3: "bg-green-500", 4: "bg-red-600",
  5: "bg-orange-500", 6: "bg-blue-400", 7: "bg-yellow-400", 8: "bg-rose-500",
  9: "bg-orange-400", 10: "bg-pink-500", 11: "bg-yellow-600", 12: "bg-amber-600",
  13: "bg-green-700", 14: "bg-blue-500", 15: "bg-emerald-500", 16: "bg-blue-600",
  17: "bg-indigo-600"
};

const SpendingImpactBadge = ({ tags = [] }) => {
  if (!tags || tags.length === 0) return <span className="text-gray-400 text-xs">No Impact</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(t => (
        <span key={t} className={`text-xs text-white px-2 py-0.5 rounded-full ${SDG_COLORS[t] || "bg-gray-500"}`}>
          SDG {t}
        </span>
      ))}
    </div>
  );
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drains, setDrains] = useState([]);
  
  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState(-1); // -1 = desc
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchTransactions();
    fetchDrains();
  }, [currentMonth]);

  const fetchTransactions = async () => {
    try {
      const qs = `?month=${currentMonth.toISOString()}`;
      const res = await axios.get(`${API_URL}/api/transactions${qs}`);
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrains = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/transactions/detect-drains`, { userId: "demo-user" });
      setDrains(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("csv", file);
      const res = await axios.post(`${API_URL}/api/transactions/upload-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCsvPreview(res.data.data);
    } catch (err) {
      alert("CSV Upload failed");
    }
    e.target.value = null; // reset
  };

  const confirmImport = async () => {
    try {
      await axios.post(`${API_URL}/api/transactions/import`, { transactions: csvPreview });
      setCsvPreview([]);
      fetchTransactions();
      fetchDrains(); // re-eval
    } catch (err) {
      alert("Failed to confirm import");
    }
  };

  // derived metrics
  const monthIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const monthSpend = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);

  // Sorting UI logic
  let displayData = [...transactions];
  if (filterType) displayData = displayData.filter(t => t.type === filterType);
  
  displayData.sort((a,b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA < valB) return sortOrder === 1 ? -1 : 1;
    if (valA > valB) return sortOrder === 1 ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortOrder(prev => prev * -1);
    else { setSortField(field); setSortOrder(-1); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-30 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
          <div className="flex items-center gap-2 mt-1">
             <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronLeft size={16}/></button>
             <p className="text-sm font-semibold text-gray-700 min-w-[100px] text-center">{format(currentMonth, "MMMM yyyy")}</p>
             <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronRight size={16}/></button>
          </div>
        </div>
        <div className="flex gap-6 h-full items-center bg-gray-100 px-6 py-2 rounded-xl">
          <div className="text-center"><p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Income</p><p className="text-green-600 font-bold text-lg">₹{monthIncome.toLocaleString()}</p></div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="text-center"><p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Spend</p><p className="text-red-500 font-bold text-lg">₹{monthSpend.toLocaleString()}</p></div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="text-center"><p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Net</p><p className="text-blue-600 font-bold text-lg">₹{(monthIncome - monthSpend).toLocaleString()}</p></div>
        </div>
        <div className="flex gap-3">
           <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 cursor-pointer px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 flex items-center gap-2 transition">
             <UploadCloud size={18} /> Upload CSV
             <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
           </label>
           <button onClick={() => setShowAddModal(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 transition">
             <Plus size={18} /> Add Transaction
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col gap-6">

        {/* Drain Detection Cards */}
        {drains.length > 0 && (
          <div className="flex flex-col gap-3">
            {drains.map((drain, idx) => (
              <div key={idx} className="bg-orange-50 border border-orange-200 flex justify-between items-start p-4 rounded-xl">
                <div className="flex gap-3 items-start">
                  <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-orange-900 text-sm font-medium leading-relaxed">{drain}</p>
                </div>
                <button onClick={() => setDrains(d.filter((_,i) => i !== idx))} className="text-orange-400 hover:text-orange-600"><X size={18} /></button>
              </div>
            ))}
          </div>
        )}

        {/* CSV Preview Interstitial */}
        {csvPreview.length > 0 && (
          <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-lg shadow-indigo-100/50">
            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900 mb-4"><UploadCloud /> CSV Import Preview ({csvPreview.length} rows)</h2>
            <div className="max-h-64 overflow-y-auto mb-4 border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                  <tr><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3 text-right">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvPreview.map((r, i) => (
                    <tr key={i}>
                      <td className="p-3">{format(new Date(r.date), "MMM d, yyyy")}</td>
                      <td className="p-3 truncate max-w-[200px]">{r.description}</td>
                      <td className="p-3"><span className="bg-gray-100 py-1 px-2 rounded">{r.category}</span></td>
                      <td className={`p-3 text-right font-medium ${r.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>₹{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 justify-end">
               <button onClick={() => setCsvPreview([])} className="text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium">Cancel Analysis</button>
               <button onClick={confirmImport} className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2 rounded-lg font-medium shadow-md shadow-indigo-200 flex items-center gap-2"><CheckCircle size={18}/> Confirm & Import</button>
            </div>
          </div>
        )}

        {/* Core Layout Grid */}
        <div className="flex gap-6 relative items-start">
          
          {/* Main Table Content */}
          <div className={`flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300`}>
            
            <div className="flex justify-between items-center bg-gray-50 px-5 py-3 border-b border-gray-200">
               <div className="flex gap-2">
                 <select onChange={e => setFilterType(e.target.value)} value={filterType} className="bg-white border border-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-indigo-500">
                   <option value="">All Types</option>
                   <option value="expense">Expenses</option>
                   <option value="income">Income</option>
                 </select>
               </div>
               <div className="text-xs text-gray-400 font-medium">Click headers to sort</div>
            </div>

            <div className="w-full relative min-h-[400px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center p-10"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
              ) : displayData.length === 0 ? (
                <div className="p-20 text-center text-gray-400">No transactions recorded yet.</div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-gray-200 text-gray-500 font-semibold sticky top-0 uppercase tracking-wider text-xs">
                    <tr>
                      <th onClick={() => toggleSort("date")} className="p-4 cursor-pointer hover:bg-gray-50 transition">Date {sortField === "date" && (sortOrder === 1 ? "▲" : "▼")}</th>
                      <th onClick={() => toggleSort("description")} className="p-4 cursor-pointer hover:bg-gray-50 transition">Description {sortField === "description" && (sortOrder === 1 ? "▲" : "▼")}</th>
                      <th onClick={() => toggleSort("category")} className="p-4 cursor-pointer hover:bg-gray-50 transition">Category {sortField === "category" && (sortOrder === 1 ? "▲" : "▼")}</th>
                      <th className="p-4">SDG Impact</th>
                      <th onClick={() => toggleSort("amount")} className="p-4 text-right cursor-pointer hover:bg-gray-50 transition">Amount {sortField === "amount" && (sortOrder === 1 ? "▲" : "▼")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayData.map((tx) => (
                      <tr key={tx._id} onClick={() => setSelectedTx(tx)} className={`hover:bg-indigo-50/50 cursor-pointer transition ${selectedTx?._id === tx._id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""}`}>
                        <td className="p-4 text-gray-600">{tx.date ? format(new Date(tx.date), "MMM dd, yyyy") : format(new Date(tx.createdAt), "MMM dd, yyyy")}</td>
                        <td className="p-4 font-medium text-gray-800 max-w-[220px] truncate">{tx.description || tx.notes}</td>
                        <td className="p-4"><span className="bg-gray-100 text-gray-600 text-xs py-1 px-2.5 rounded-md border border-gray-200">{tx.category}</span></td>
                        <td className="p-4"><SpendingImpactBadge tags={tx.sdgTags || []} /></td>
                        <td className={`p-4 text-right font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>{tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Side Panel Inspector */}
          {selectedTx && (
             <div className="w-80 bg-white border border-gray-200 rounded-xl p-5 shadow-sm sticky top-[100px] shrink-0">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight wrap-break-word max-w-[240px] whitespace-normal">{selectedTx.description || selectedTx.notes}</h3>
                   <p className="text-gray-400 text-xs uppercase tracking-widest">{format(new Date(selectedTx.date || selectedTx.createdAt), "MMMM dd, yyyy")}</p>
                 </div>
                 <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
               </div>

               <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Amount Transacted</span>
                  <span className={`text-2xl font-bold tracking-tight ${selectedTx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>₹{selectedTx.amount.toLocaleString()}</span>
               </div>

               <div className="space-y-4 mb-6">
                 <div>
                   <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">Category</p>
                   <span className="bg-gray-100 text-gray-700 font-medium text-sm py-1 px-3 rounded-md border border-gray-200">{selectedTx.category}</span>
                 </div>
               </div>

               <div className="border-t border-gray-100 pt-5">
                 <p className="text-xs text-indigo-500 uppercase tracking-wider font-bold mb-3 flex gap-1.5 items-center"><Info size={14} /> Sustainable Impact</p>
                 
                 {(!selectedTx.sdgTags || selectedTx.sdgTags.length === 0) ? (
                   <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">No specific UN SDG impact registered for this transaction context.</p>
                 ) : (
                   <div className="flex flex-col gap-3">
                     <SpendingImpactBadge tags={selectedTx.sdgTags} />
                     <p className="text-sm text-gray-600 leading-relaxed italic bg-indigo-50/50 p-3 rounded-lg border border-indigo-50">
                       "This ₹{selectedTx.amount} {selectedTx.type === 'expense' ? 'spend' : 'income'} supports multiple crucial development metrics globally based on categorical targeting. Impact score: {Math.max((selectedTx.sdgTags.length * 2.1).toFixed(1), 7.2)}/10"
                     </p>
                   </div>
                 )}
               </div>
             </div>
          )}
        </div>

      </main>

      {/* Manual / AI Add Modal */}
      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} refresh={fetchTransactions} />}

    </div>
  );
}

const AddModal = ({ onClose, refresh }) => {
  const [tab, setTab] = useState("manual");
  const [loading, setLoading] = useState(false);
  
  // Manual Form
  const [form, setForm] = useState({ date: format(new Date(), "yyyy-MM-dd"), description: "", amount: "", category: "Misc", type: "expense" });
  
  // AI Form
  const [aiText, setAiText] = useState("");
  const [aiPreview, setAiPreview] = useState(null);

  const submitManual = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/transactions`, form);
      refresh();
      onClose();
    } catch(err) { alert("Failed to add"); } finally { setLoading(false); }
  };

  const scanAI = async () => {
    if(!aiText) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/transactions/parse-ai`, { rawText: aiText });
      const p = res.data.data;
      setAiPreview({ ...p, date: format(new Date(), "yyyy-MM-dd") });
    } catch(err) { alert("AI Scan Failed"); } finally { setLoading(false); }
  };

  const commitAI = async () => {
    if(!aiPreview) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/transactions`, aiPreview);
      refresh();
      onClose();
    } catch(err) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setTab("manual")} className={`flex-1 py-4 font-semibold text-sm ${tab === 'manual' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:bg-gray-50'}`}>Manual Entry</button>
          <button onClick={() => setTab("ai")} className={`flex-1 py-4 font-semibold text-sm ${tab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:bg-gray-50'}`}>AI Parse Mode</button>
        </div>
        
        <div className="p-6">
          {tab === "manual" ? (
            <form onSubmit={submitManual} className="flex flex-col gap-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Description</label>
              <input required value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" placeholder="e.g. Swiggy Lunch" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Amount (₹)</label>
                <input required type="number" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none text-sm" /></div>
                
                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Type</label>
                <select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none text-sm bg-white">
                  <option value="expense">Expense</option><option value="income">Income</option>
                </select></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Category</label>
                <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none text-sm bg-white">
                  <option value="food">Food</option><option value="rent">Rent</option><option value="transport_public">Transit</option>
                  <option value="shopping_local">Shopping</option><option value="subscriptions">Subscriptions</option><option value="Misc">Misc</option>
                </select></div>
                
                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Date</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none text-sm text-gray-600" /></div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md">Save Log</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">Paste Raw Receipt/SMS</label>
                <textarea rows="4" value={aiText} onChange={e=>setAiText(e.target.value)} className="w-full border-2 border-indigo-100 bg-indigo-50/30 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="e.g. Sent Rs 450 to Uber via UPI" />
              </div>
              
              {!aiPreview ? (
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium">Cancel</button>
                  <button onClick={scanAI} disabled={loading||!aiText} className="flex-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md">Scan using Rule AI</button>
                </div>
              ) : (
                <div className="bg-white border text-sm border-gray-200 rounded-lg overflow-hidden mt-2">
                   <div className="bg-gray-100 p-2 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Parsed Result</div>
                   <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50">
                     <div><p className="text-xs text-gray-400">Amount</p><p className="font-bold">₹{aiPreview.amount}</p></div>
                     <div><p className="text-xs text-gray-400">Category</p><p className="font-bold">{aiPreview.category}</p></div>
                   </div>
                   <div className="flex gap-2 p-3">
                     <button onClick={()=>setAiPreview(null)} className="flex-1 px-3 py-2 text-gray-600 bg-gray-200 rounded-md font-medium text-xs">Retry</button>
                     <button onClick={commitAI} disabled={loading} className="flex-2 px-3 py-2 bg-indigo-600 text-white rounded-md font-medium text-xs shadow">Looks Good, Save</button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
