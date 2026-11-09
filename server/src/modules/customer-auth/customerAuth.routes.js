import { Router } from 'express';
import { requireCustomer } from '../../middleware/requireCustomer.js';
import { requireSameOrigin } from '../../middleware/requireAdmin.js';
import { current, listCustomerOrders, login, logout, register } from './customerAuth.controller.js';

export const customerAuthRoutes = Router();
customerAuthRoutes.post('/register', requireSameOrigin, register);
customerAuthRoutes.post('/login', requireSameOrigin, login);
customerAuthRoutes.get('/me', requireCustomer, current);
customerAuthRoutes.get('/orders', requireCustomer, listCustomerOrders);
customerAuthRoutes.post('/logout', requireSameOrigin, requireCustomer, logout);
