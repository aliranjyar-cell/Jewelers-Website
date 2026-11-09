import { Router } from 'express';
import { requireCustomer } from '../../middleware/requireCustomer.js';
import { requireSameOrigin } from '../../middleware/requireAdmin.js';
import { createPublicCustomRequest } from './publicCustomOrders.controller.js';

export const publicCustomOrderRoutes = Router();
publicCustomOrderRoutes.post('/', requireSameOrigin, requireCustomer, createPublicCustomRequest);
