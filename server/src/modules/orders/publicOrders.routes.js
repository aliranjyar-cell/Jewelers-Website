import { Router } from 'express';
import { createCustomerOrder, previewCustomerOrder } from './publicOrders.controller.js';

export const publicOrderRoutes = Router();
publicOrderRoutes.post('/preview', previewCustomerOrder);
publicOrderRoutes.post('/', createCustomerOrder);
