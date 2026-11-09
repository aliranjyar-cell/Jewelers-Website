import express, { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getStoreName, updateStoreName } from './storeSettings.service.js';

function asyncHandler(handler) { return (request, response, next) => Promise.resolve(handler(request, response)).catch(next); }

export const publicStoreSettingsRoutes = Router();
publicStoreSettingsRoutes.get('/', asyncHandler(async (_request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json({ storeName: await getStoreName() });
}));

export const adminStoreSettingsRoutes = Router();
adminStoreSettingsRoutes.use(requireAuth, requireAdmin, express.json({ limit: '2kb' }));
adminStoreSettingsRoutes.get('/store', asyncHandler(async (_request, response) => response.json({ storeName: await getStoreName() })));
adminStoreSettingsRoutes.put('/store', asyncHandler(async (request, response) => {
  const storeName = await updateStoreName(request.body?.storeName, request.admin.id);
  response.json({ storeName });
}));
