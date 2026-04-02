import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, default: 'demo-user' },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export default mongoose.model('Watchlist', WatchlistSchema);
