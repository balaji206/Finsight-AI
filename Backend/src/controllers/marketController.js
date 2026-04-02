import { getIndices, getStockDetail } from '../services/marketDataService.js';
import { sdgStockMap } from '../services/sdgStockMap.js';

export const getMarketIndices = async (req, res) => {
  try {
    const data = await getIndices();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch indices' });
  }
};

export const searchStocks = (req, res) => {
  const query = req.query.q?.toUpperCase() || '';
  if (!query) return res.json([]);
  
  const results = Object.keys(sdgStockMap)
    .filter(sym => sym.includes(query) || sdgStockMap[sym].name.toUpperCase().includes(query))
    .map(sym => ({ symbol: sym, name: sdgStockMap[sym].name }));
  
  res.json(results);
};

export const getStock = async (req, res) => {
  const { symbol } = req.params;
  try {
    const data = await getStockDetail(symbol.toUpperCase());
    const sdgInfo = sdgStockMap[symbol.toUpperCase()] || { name: symbol, tags: [8] };
    
    res.json({ ...data, sdgTags: sdgInfo.tags, companyName: sdgInfo.name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
};
