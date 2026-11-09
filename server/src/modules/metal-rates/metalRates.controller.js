import { listMetalRateHistory, listMetalRates, saveMetalRate } from './metalRates.service.js';

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export const getMetalRates = asyncHandler(async (_request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json({ items: await listMetalRates() });
});

export const getMetalRateHistory = asyncHandler(async (request, response) => {
  const limit = Math.max(1, Math.min(100, Number.parseInt(request.query.limit, 10) || 30));
  response.setHeader('Cache-Control', 'no-store');
  response.json({ items: await listMetalRateHistory(limit) });
});

export const publishMetalRate = asyncHandler(async (request, response) => {
  response.status(201).json(await saveMetalRate(request.body || {}, request.admin.id));
});
