import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getCustomRequest, getCustomRequests, updateCustomRequest } from './customOrders.controller.js';

export const customOrderRoutes = Router();
customOrderRoutes.use(requireAuth, requireAdmin);
customOrderRoutes.get('/', getCustomRequests);
customOrderRoutes.get('/:requestId', getCustomRequest);
customOrderRoutes.patch('/:requestId', updateCustomRequest);
