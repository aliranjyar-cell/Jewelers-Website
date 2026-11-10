import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin, requireCsrf, requireSameOrigin } from '../../middleware/requireAdmin.js';
import { changePassword, currentAdmin, login, logout } from './auth.controller.js';

export const authRoutes = Router();
authRoutes.post('/login', requireSameOrigin, login);
authRoutes.get('/me', requireAuth, requireAdmin, currentAdmin);
authRoutes.post('/logout', requireAuth, requireAdmin, requireCsrf, logout);
authRoutes.post('/password', requireAuth, requireAdmin, requireCsrf, changePassword);
