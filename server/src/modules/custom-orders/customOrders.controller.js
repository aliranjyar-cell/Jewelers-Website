import { getAdminCustomRequest, listAdminCustomRequests, saveAdminCustomRequest } from './customOrders.service.js';

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export const getCustomRequests = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json(await listAdminCustomRequests({
    search: String(request.query.search || '').trim().slice(0, 120),
    status: String(request.query.status || ''),
    page: Math.max(1, Number.parseInt(request.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(100, Number.parseInt(request.query.pageSize, 10) || 20)),
  }));
});

export const getCustomRequest = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json(await getAdminCustomRequest(request.params.requestId));
});

export const updateCustomRequest = asyncHandler(async (request, response) => {
  response.json(await saveAdminCustomRequest(request.params.requestId, request.body || {}, request.admin));
});
