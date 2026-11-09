import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getOrder, getOrders, updateFulfillment, updateOrderPayment, updateOrderStatus } from './orders.controller.js';

export const orderRoutes = Router();
orderRoutes.use(requireAuth, requireAdmin);
orderRoutes.get('/', getOrders);
orderRoutes.get('/:orderId', getOrder);
orderRoutes.patch('/:orderId/status', updateOrderStatus);
orderRoutes.patch('/:orderId/payment', updateOrderPayment);
orderRoutes.patch('/:orderId/fulfillment', updateFulfillment);
