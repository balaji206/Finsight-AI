import Watchlist from '../models/Watchlist.js';
import mongoose from 'mongoose';

let memoryWatchlist = [];
let nextId = 1;

const isMongoLive = () => mongoose.connection.readyState === 1;

export const getWatchlist = async (req, res) => {
  try {
    if (!isMongoLive()) {
      return res.json(memoryWatchlist);
    }
    const list = await Watchlist.find({ userId: 'demo-user' }).sort({ addedAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

export const addToWatchlist = async (req, res) => {
  const { symbol, name } = req.body;
  if (!symbol || !name) return res.status(400).json({ error: 'Symbol and Name required' });

  try {
    if (!isMongoLive()) {
      if (memoryWatchlist.find(w => w.symbol === symbol.toUpperCase())) {
        return res.status(400).json({ error: 'Stock already in watchlist' });
      }
      const newItem = { _id: nextId++, userId: 'demo-user', symbol: symbol.toUpperCase(), name, addedAt: new Date() };
      memoryWatchlist.unshift(newItem);
      return res.json({ success: true, item: newItem });
    }

    const newItem = new Watchlist({ userId: 'demo-user', symbol: symbol.toUpperCase(), name });
    await newItem.save();
    res.json({ success: true, item: newItem });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Stock already in watchlist' });
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

export const removeFromWatchlist = async (req, res) => {
  const { symbol } = req.params;
  try {
    if (!isMongoLive()) {
      memoryWatchlist = memoryWatchlist.filter(w => w.symbol !== symbol.toUpperCase());
      return res.json({ success: true });
    }

    await Watchlist.findOneAndDelete({ userId: 'demo-user', symbol: symbol.toUpperCase() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};
