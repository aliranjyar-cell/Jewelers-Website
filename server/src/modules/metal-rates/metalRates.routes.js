import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getMetalRateHistory, getMetalRates, publishMetalRate } from './metalRates.controller.js';

export const metalRateRoutes = Router();
metalRateRoutes.use(requireAuth, requireAdmin);
metalRateRoutes.get('/', getMetalRates);
metalRateRoutes.get('/history', getMetalRateHistory);
metalRateRoutes.post('/', publishMetalRate);
