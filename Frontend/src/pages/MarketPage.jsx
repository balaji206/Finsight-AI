import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Loader2, X, PlusCircle, Leaf, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './MarketPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MarketPage() {
  const [indices, setIndices]             = useState(null);
  const [watchlist, setWatchlist]         = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [modalData, setModalData]         = useState(null);
  const [loadingModal, setLoadingModal]   = useState(false);
  const [showSimModal, setShowSimModal]   = useState(false);
  const [simSuccess, setSimSuccess]       = useState(false);
  const navigate = useNavigate();

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
    } catch (err) { console.error('Index fetch error', err); }
  };

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/watchlist`);
      setWatchlist(res.data);
    } catch (err) { console.error('Watchlist fetch error', err); }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 2) return setSearchResults([]);
    try {
      const res = await axios.get(`${API_URL}/api/market/search?q=${val}`);
      setSearchResults(res.data);
    } catch { setSearchResults([]); }
  };

  const openStockModal = async (symbol) => {
    setSelectedStock(symbol);
    setLoadingModal(true);
    setSearchQuery('');
    setSearchResults([]);
    try {
      const res = await axios.get(`${API_URL}/api/market/stock/${symbol}`);
      setModalData(res.data);
    } catch { alert('Error loading stock data.'); }
    finally { setLoadingModal(false); }
  };

  const addToWatchlist = async () => {
    try {
      await axios.post(`${API_URL}/api/watchlist/add`, { symbol: modalData.symbol, name: modalData.companyName });
      fetchWatchlist();
    } catch (err) { alert(err.response?.data?.error || 'Error adding to watchlist'); }
  };

  const removeWatchlist = async (symbol) => {
    try {
      await axios.delete(`${API_URL}/api/watchlist/${symbol}`);
      fetchWatchlist();
    } catch { alert('Error removing from watchlist'); }
  };

  const confirmSimulate = () => {
    const injected = JSON.parse(localStorage.getItem('sdgSimulations') || '[]');
    if (!injected.find(i => i.symbol === modalData?.symbol) && modalData) {
      injected.push({ symbol: modalData.symbol, name: modalData.companyName, allocation: 8, expectedReturn: 0.14, volatility: 0.22, sdgFactor: 0.8 });
      localStorage.setItem('sdgSimulations', JSON.stringify(injected));
    }
    setSimSuccess(true);
    setTimeout(() => { setShowSimModal(false); navigate('/forecast'); }, 2500);
  };

  const fmt = (n) => parseFloat(n).toLocaleString('en-IN');
  const fmtD = (n) => n ? parseFloat(n).toFixed(2) : 'N/A';

  const indexKeys = ['nifty50', 'sensex', 'niftyBank'];

  return (
    <div className="mkt-root">
      {/* Indices bar */}
      <div className="mkt-indices">
        <div className="mkt-indices-inner">
          <span className="mkt-indices-label">LIVE INDICES</span>
          <div className="mkt-indices-row">
            {indices ? indexKeys.map(key => {
              const idx = indices[key];
              const up  = idx.change >= 0;
              return (
                <div key={key} className="mkt-index-item">
                  <span className="mkt-index-name">{key.toUpperCase()}</span>
                  <span className="mkt-index-val">{fmt(idx.value)}</span>
                  <span className={`mkt-index-chg ${up ? 'up' : 'down'}`}>
                    {up ? '▲' : '▼'} {Math.abs(idx.percentChange).toFixed(2)}%
                  </span>
                </div>
              );
            }) : <Loader2 className="mkt-spin" size={16} />}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="mkt-grid">

        {/* Left — search + detail */}
        <div className="mkt-main">
          {/* Search */}
          <div className="mkt-search-wrap">
            <Search size={16} className="mkt-search-icon" />
            <input
              className="mkt-search"
              placeholder="Search NSE stocks (e.g. RELIANCE, ADANIGREEN)…"
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchResults.length > 0 && (
              <div className="mkt-dropdown">
                {searchResults.map(s => (
                  <div key={s.symbol} className="mkt-dropdown-item" onClick={() => openStockModal(s.symbol)}>
                    <span className="mkt-dropdown-sym">{s.symbol}</span>
                    <span className="mkt-dropdown-name">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock detail */}
          {selectedStock && (
            <div className="mkt-card mkt-detail">
              <button className="mkt-close" onClick={() => { setSelectedStock(null); setModalData(null); }}>
                <X size={20} />
              </button>

              {loadingModal || !modalData ? (
                <div className="mkt-loading"><Loader2 size={28} className="mkt-spin" /></div>
              ) : (
                <>
                  <div className="mkt-detail-header">
                    <div>
                      <h2 className="mkt-company">{modalData.companyName}</h2>
                      <span className="mkt-symbol">({modalData.symbol})</span>
                      {modalData.source?.includes('mock') && <span className="mkt-stale">STALE CACHE</span>}
                    </div>
                    <div className="mkt-price-block">
                      <span className="mkt-price">₹{fmt(modalData.price)}</span>
                      <span className={`mkt-pct ${modalData.percentChange >= 0 ? 'up' : 'down'}`}>
                        {modalData.percentChange >= 0 ? '+' : ''}{modalData.percentChange}%
                      </span>
                    </div>
                  </div>

                  {/* 7-day chart */}
                  <div className="mkt-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={modalData.history}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip
                          contentStyle={{ background:'#111', border:'1px solid rgba(255,255,255,0.08)', color:'#fff', fontSize:'12px', borderRadius:'8px' }}
                          formatter={v => `₹${parseFloat(v).toFixed(2)}`}
                        />
                        <Line
                          type="monotone" dataKey="close" strokeWidth={2} dot={false}
                          stroke={modalData.percentChange >= 0 ? '#fff' : 'rgba(255,255,255,0.35)'}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats grid */}
                  <div className="mkt-stats">
                    {[
                      ['Market Cap', `₹${(modalData.marketCap / 1e7).toFixed(2)}Cr`],
                      ['P/E Ratio',  fmtD(modalData.peRatio)],
                      ['52W High',   `₹${fmtD(modalData.high52)}`],
                      ['Volume',     fmt(modalData.volume)],
                    ].map(([l, v]) => (
                      <div key={l} className="mkt-stat">
                        <span className="mkt-stat-label">{l}</span>
                        <span className="mkt-stat-val">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* SDG card */}
                  <div className="mkt-sdg-card">
                    <div className="mkt-sdg-header">
                      <Leaf size={16} />
                      <span>SDG Direct Impact Assessment</span>
                    </div>
                    <p className="mkt-sdg-text">
                      Supports <strong>SDG Tags: [{modalData.sdgTags?.join(', ')}]</strong>. Suggested portfolio allocation: <strong>8%</strong>.
                    </p>
                    <div className="mkt-sdg-actions">
                      <button className="mkt-btn-outline" onClick={addToWatchlist}>
                        <PlusCircle size={15} /> Add to Watchlist
                      </button>
                      <button className="mkt-btn-solid" onClick={() => { setShowSimModal(true); setSimSuccess(false); }}>
                        Simulate SDG Impact
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!selectedStock && (
            <div className="mkt-empty">
              <Search size={32} style={{ opacity: 0.12 }} />
              <p>Search for a stock to view its details</p>
            </div>
          )}
        </div>

        {/* Right — watchlist */}
        <div className="mkt-card mkt-watchlist">
          <div className="mkt-watchlist-header">
            <span>Watchlist</span>
            <span className="mkt-badge">{watchlist.length}</span>
          </div>
          {watchlist.length === 0 ? (
            <p className="mkt-watchlist-empty">Search and add stocks to track them here.</p>
          ) : (
            watchlist.map(item => (
              <div key={item.symbol} className="mkt-watchlist-item" onClick={() => openStockModal(item.symbol)}>
                <div>
                  <span className="mkt-wl-sym">{item.symbol}</span>
                  <span className="mkt-wl-name">{item.name}</span>
                </div>
                <button className="mkt-wl-remove" onClick={e => { e.stopPropagation(); removeWatchlist(item.symbol); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Simulate modal */}
      {showSimModal && (
        <div className="mkt-modal-overlay" onClick={() => setShowSimModal(false)}>
          <div className="mkt-modal" onClick={e => e.stopPropagation()}>
            {simSuccess ? (
              <div className="mkt-modal-success">
                <CheckCircle2 size={48} />
                <h3>Impact Added!</h3>
                <p>These metrics will reflect in the Forecast simulator.</p>
              </div>
            ) : (
              <>
                <h3 className="mkt-modal-title">Simulate Capital Integration</h3>
                <p className="mkt-modal-body">
                  Investing <strong>₹50,000</strong> in {modalData?.symbol} increases your aggregated SDG score by <strong>4.8 points</strong> via ESG tracking algorithms.
                </p>
                <div className="mkt-modal-actions">
                  <button className="mkt-btn-outline" onClick={() => setShowSimModal(false)}>Cancel</button>
                  <button className="mkt-btn-solid" onClick={confirmSimulate}>Confirm Injection</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
