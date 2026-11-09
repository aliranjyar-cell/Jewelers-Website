import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { adjustStock, fulfillOrder, getInventory, getMovements, receiveStock, releaseOrder, reserveOrder, setReorderPoint } from './inventory.controller.js';

export const inventoryRoutes = Router();
inventoryRoutes.use(requireAuth, requireAdmin);
inventoryRoutes.get('/movements', getMovements);
inventoryRoutes.post('/orders/:orderId/reserve', reserveOrder);
inventoryRoutes.post('/orders/:orderId/release', releaseOrder);
inventoryRoutes.post('/orders/:orderId/fulfill', fulfillOrder);
inventoryRoutes.post('/variants/:variantId/receive', receiveStock);
inventoryRoutes.post('/variants/:variantId/adjust', adjustStock);
inventoryRoutes.patch('/variants/:variantId/reorder-point', setReorderPoint);
inventoryRoutes.get('/', getInventory);
