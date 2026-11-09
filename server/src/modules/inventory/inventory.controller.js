import { adjustInventory, fulfillOrderInventory, getInventoryOverview, listInventoryMovements, receiveInventory, releaseOrderInventory, reserveOrderInventory, updateReorderPoint } from './inventory.service.js';

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

const paging = (request, maxPageSize = 100) => ({
  page: Math.max(1, Number.parseInt(request.query.page, 10) || 1),
  pageSize: Math.max(1, Math.min(maxPageSize, Number.parseInt(request.query.pageSize, 10) || 25)),
});

export const getInventory = asyncHandler(async (request, response) => {
  response.json(await getInventoryOverview({
    ...paging(request), search: String(request.query.search || '').trim().slice(0, 120),
    filter: String(request.query.filter || 'all'),
  }));
});

export const getMovements = asyncHandler(async (request, response) => {
  response.json(await listInventoryMovements({ ...paging(request), search: String(request.query.search || '').trim().slice(0, 120) }));
});

export const receiveStock = asyncHandler(async (request, response) => {
  response.json(await receiveInventory(request.params.variantId, request.body || {}, request.admin.id));
});

export const adjustStock = asyncHandler(async (request, response) => {
  response.json(await adjustInventory(request.params.variantId, request.body || {}, request.admin.id));
});

export const setReorderPoint = asyncHandler(async (request, response) => {
  response.json(await updateReorderPoint(request.params.variantId, request.body || {}));
});

export const reserveOrder = asyncHandler(async (request, response) => {
  response.json(await reserveOrderInventory(request.params.orderId, request.admin.id));
});

export const releaseOrder = asyncHandler(async (request, response) => {
  response.json(await releaseOrderInventory(request.params.orderId, request.admin.id));
});

export const fulfillOrder = asyncHandler(async (request, response) => {
  response.json(await fulfillOrderInventory(request.params.orderId, request.admin.id));
});
