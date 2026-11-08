import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getDashboard } from './dashboard.controller.js';

export const dashboardRoutes = Router();
dashboardRoutes.get('/', requireAuth, requireAdmin, getDashboard);
