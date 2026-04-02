import express from 'express';
import { getMarketIndices, searchStocks, getStock } from '../controllers/marketController.js';

const router = express.Router();

router.get('/indices', getMarketIndices);
router.get('/search', searchStocks);
router.get('/stock/:symbol', getStock);

export default router;
