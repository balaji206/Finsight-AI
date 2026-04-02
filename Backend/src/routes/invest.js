import express from 'express';
import { submitRiskAssessment, getFunds } from '../controllers/investController.js';

const router = express.Router();

// POST /api/invest/risk-assessment -> accepts quiz answers
router.post('/risk-assessment', submitRiskAssessment);

// GET /api/invest/funds -> returns full static fund database
router.get('/funds', getFunds);

export default router;
