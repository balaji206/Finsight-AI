import express from 'express';
import { generateForecast } from '../controllers/forecastController.js';

const router = express.Router();

// POST /api/forecast
router.post('/', generateForecast);

export default router;
