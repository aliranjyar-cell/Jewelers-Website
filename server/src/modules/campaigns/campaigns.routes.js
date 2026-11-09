import express, { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getCampaign, listCampaigns, removeCampaign, saveCampaign, saveCampaignImage } from './campaigns.service.js';

function asyncHandler(handler) { return (req, res, next) => Promise.resolve(handler(req, res)).catch(next); }
export const adminCampaignRoutes = Router();
adminCampaignRoutes.use(requireAuth, requireAdmin, express.json({ limit: '6mb' }));
adminCampaignRoutes.get('/', asyncHandler(async (_req, res) => res.json({ items: await listCampaigns() })));
adminCampaignRoutes.post('/images', asyncHandler(async (req, res) => res.status(201).json({ imageUrl: await saveCampaignImage(req.body?.dataUrl) })));
adminCampaignRoutes.post('/', asyncHandler(async (req, res) => res.status(201).json(await saveCampaign(null, req.body, req.admin.id))));
adminCampaignRoutes.put('/:id', asyncHandler(async (req, res) => res.json(await saveCampaign(req.params.id, req.body, req.admin.id))));
adminCampaignRoutes.delete('/:id', asyncHandler(async (req, res) => { await removeCampaign(req.params.id); res.status(204).end(); }));

export const publicCampaignRoutes = Router();
publicCampaignRoutes.get('/:placement', asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  const campaign = await getCampaign(req.params.placement);
  if (!campaign) return res.status(404).json({ error: 'No active campaign' });
  res.json(campaign);
}));
