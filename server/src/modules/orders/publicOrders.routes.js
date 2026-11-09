import { Router } from 'express';
import { createCustomerOrder, previewCustomerOrder } from './publicOrders.controller.js';
import { requireCustomer } from '../../middleware/requireCustomer.js';
import { requireSameOrigin } from '../../middleware/requireAdmin.js';

export const publicOrderRoutes = Router();
publicOrderRoutes.post('/preview', previewCustomerOrder);
publicOrderRoutes.post('/', requireSameOrigin, requireCustomer, createCustomerOrder);
