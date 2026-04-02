import express from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlistController.js';

const router = express.Router();

router.get('/', getWatchlist);
router.post('/add', addToWatchlist);
router.delete('/:symbol', removeFromWatchlist);

export default router;
