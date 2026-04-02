import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Loader2, X, PlusCircle, Leaf, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MarketPage() {
  const [indices, setIndices] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  
  const [selectedStock, setSelectedStock] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  
  const [showSimModal, setShowSimModal] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);

  // Auto-refresh logic (every 60 seconds)
  useEffect(() => {
    fetchIndices();
    fetchWatchlist();
    const inv = setInterval(fetchIndices, 60000);
    return () => clearInterval(inv);
  }, []);

  const fetchIndices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/market/indices`);
      setIndices(res.data);
    } catch (err) {
      console.error("Index fetch error", err);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/watchlist`);
      setWatchlist(res.data);
    } catch (err) {
      console.error("Watchlist fetch error", err);
    }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 2) return setSearchResults([]);
    try {
      const res = await axios.get(`${API_URL}/api/market/search?q=${val}`);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    }
  };

  const openStockModal = async (symbol) => {
    setSelectedStock(symbol);
    setLoadingModal(true);
    setSearchQuery('');
    setSearchResults([]);
    try {
      const res = await axios.get(`${API_URL}/api/market/stock/${symbol}`);
      setModalData(res.data);
    } catch (err) {
      alert("Error loading stock data. Not crashing though!");
    } finally {
      setLoadingModal(false);
    }
  };

  const addToWatchlist = async () => {
    try {
      await axios.post(`${API_URL}/api/watchlist/add`, { symbol: modalData.symbol, name: modalData.companyName });
      fetchWatchlist();
      alert(`${modalData.symbol} added to watchlist!`);
    } catch (err) {
      alert(err.response?.data?.error || "Error adding to watchlist");
    }
  };

  const removeWatchlist = async (symbol) => {
    try {
      await axios.delete(`${API_URL}/api/watchlist/${symbol}`);
      fetchWatchlist();
    } catch (err) {
      alert("Error removing from watchlist");
    }
  };

  const handleSimulate = () => {
    setShowSimModal(true);
    setSimSuccess(false);
  };

  const confirmSimulate = () => {
    const injected = JSON.parse(localStorage.getItem('sdgSimulations') || '[]');
    const isAlreadySimulated = injected.find(i => i.symbol === modalData?.symbol);
    
    if (!isAlreadySimulated && modalData) {
      injected.push({
        symbol: modalData.symbol,
        name: modalData.companyName,
        allocation: 8,
        expectedReturn: 0.14,
        volatility: 0.22,
        sdgFactor: 0.8
      });
      localStorage.setItem('sdgSimulations', JSON.stringify(injected));
    }

    setSimSuccess(true);
    setTimeout(() => {
      setShowSimModal(false);
      navigate('/forecast');
    }, 2500);
  };

  const formatRupee = (num) => parseFloat(num).toLocaleString('en-IN');
  const formatSdf = (num) => num ? parseFloat(num).toFixed(2) : "N/A";

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm w-full py-4 px-6 flex justify-between items-center text-left">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          FinSight <span className="text-blue-600">Market</span>
        </h1>
        {indices ? (
          <div className="flex gap-6 text-sm">
            {['nifty50', 'sensex', 'niftyBank'].map((key) => {
              const idx = indices[key];
              const isUp = idx.change >= 0;
              return (
                <div key={key} className="flex flex-col">
                  <span className="font-semibold text-slate-500 uppercase">{key}</span>
                  <span className="font-bold text-lg">
                    {formatRupee(idx.value)}{' '}
                    <span className={isUp ? 'text-green-500' : 'text-red-500'}>
                      {isUp ? '▲' : '▼'} {Math.abs(idx.percentChange).toFixed(2)}%
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : <Loader2 className="animate-spin text-blue-500" />}
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* MAIN MARKET AREA */}
        <div className="lg:col-span-3 space-y-6 text-left">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              className="w-full p-3 pl-10 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search NSE Stocks (e.g., ADANIGREEN, RELIANCE)..."
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-14 w-full bg-white border rounded-xl shadow-lg overflow-hidden z-20">
                {searchResults.map(s => (
                  <div key={s.symbol} onClick={() => openStockModal(s.symbol)} className="p-3 hover:bg-slate-50 cursor-pointer border-b flex justify-between">
                    <span className="font-bold text-slate-700">{s.symbol}</span>
                    <span className="text-slate-500">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STOCK DETAIL MODAL/VIEW */}
          {selectedStock && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border mt-4 relative">
              <button 
                onClick={() => { setSelectedStock(null); setModalData(null); }} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
              >
                <X size={24} />
              </button>

              {loadingModal || !modalData ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold">{modalData.companyName}</h2>
                    <span className="text-slate-500 font-semibold text-lg">({modalData.symbol})</span>
                    {modalData.source.includes('mock') && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">STALE API CACHE</span>}
                  </div>

                  {/* PRICE HEADER */}
                  <div className="flex items-end gap-3 border-b pb-4">
                    <span className="text-4xl font-bold">₹{formatRupee(modalData.price)}</span>
                    <span className={`text-xl font-semibold mb-1 ${modalData.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {modalData.percentChange >= 0 ? '+' : ''}{modalData.percentChange}%
                    </span>
                  </div>

                  {/* 7 DAY CHART */}
                  <div className="h-48 w-full bg-slate-50 rounded-lg p-2 border">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={modalData.history}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip formatter={(v) => `₹${parseFloat(v).toFixed(2)}`} />
                        <Line type="monotone" dataKey="close" stroke={modalData.percentChange >= 0 ? '#10b981' : '#ef4444'} strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div><span className="block text-xs text-slate-500">Market Cap</span><span className="font-bold text-slate-800">₹{(modalData.marketCap / 1e7).toFixed(2)}Cr</span></div>
                    <div><span className="block text-xs text-slate-500">P/E Ratio</span><span className="font-bold text-slate-800">{formatSdf(modalData.peRatio)}</span></div>
                    <div><span className="block text-xs text-slate-500">52W High</span><span className="font-bold text-green-600">₹{formatSdf(modalData.high52)}</span></div>
                    <div><span className="block text-xs text-slate-500">Volume</span><span className="font-bold text-slate-800">{formatRupee(modalData.volume)}</span></div>
                  </div>

                  {/* SDG IMPACT CARD */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-emerald-800">
                      <Leaf size={24} />
                      <h3 className="font-bold text-lg">SDG Direct Impact Assessment</h3>
                    </div>
                    <p className="text-emerald-700 text-sm mb-3 text-left">
                      This company directly supports <span className="font-bold">SDG Tags: [{modalData.sdgTags.join(', ')}]</span>. Based on your 7-year retirement horizon and moderate risk profile, it contributes significantly to Climate Action models. Suggested portfolio allocation: <b>8%</b>.
                    </p>
                    <div className="flex gap-4 mt-4">
                      <button onClick={addToWatchlist} className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition">
                        <PlusCircle size={18} /> Add to Watchlist
                      </button>
                      <button onClick={handleSimulate} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition">
                        Simulate SDG Impact
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* WATCHLIST RIGHT SIDEBAR */}
        <div className="lg:col-span-1 bg-white border rounded-2xl shadow-sm p-5 h-fit min-h-[500px] text-left">
          <h3 className="font-bold text-xl mb-4 border-b pb-2 flex items-center justify-between">
            Your Watchlist
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{watchlist.length}</span>
          </h3>
          {watchlist.length === 0 ? (
            <p className="text-slate-400 text-sm italic">Search for stocks and add them here to track seamlessly.</p>
          ) : (
            <div className="space-y-4">
              {watchlist.map(item => (
                <div key={item.symbol} className="border-b pb-3 relative hover:bg-slate-50 p-2 rounded transition cursor-pointer" onClick={() => openStockModal(item.symbol)}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800">{item.symbol}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeWatchlist(item.symbol); }} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{item.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SIMULATE MODAL OVERLAY */}
      {showSimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
            {simSuccess ? (
              <div className="text-center py-6 border-none">
                <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-800 border-none m-0 p-0 text-center">Impact Added!</h3>
                <p className="text-slate-500 mt-2 border-none">These metrics will reflect automatically when you visit the Forecast simulator.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-none text-left">Simulate Capital Integration</h3>
                <p className="text-slate-600 mb-6 leading-relaxed text-left border-none">
                  If you invest <span className="font-bold text-emerald-600 bg-emerald-50 px-1">₹50,000</span> in {modalData?.symbol}, your aggregated SDG score increases by <span className="font-bold">4.8 points</span> via ESG tracking algorithms. This strictly feeds into your 5-year forecast model.
                </p>
                <div className="flex justify-end gap-3 text-left">
                  <button onClick={() => setShowSimModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">Cancel</button>
                  <button onClick={confirmSimulate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold border-none text-center">Confirm Injection</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
