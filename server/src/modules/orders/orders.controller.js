import { getAdminOrder, listAdminOrders, saveFulfillment, setOrderPayment, setOrderPricing, setOrderStatus } from './orders.service.js';

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export const getOrders = asyncHandler(async (request, response) => {
  const result = await listAdminOrders({
    search: String(request.query.search || '').trim().slice(0, 120),
    status: String(request.query.status || ''),
    paymentStatus: String(request.query.paymentStatus || ''),
    paymentMethod: String(request.query.paymentMethod || '').trim().slice(0, 40),
    dateFrom: String(request.query.dateFrom || ''),
    dateTo: String(request.query.dateTo || ''),
    sort: String(request.query.sort || 'newest'),
    page: Math.max(1, Number.parseInt(request.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(100, Number.parseInt(request.query.pageSize, 10) || 20)),
  });
  response.setHeader('Cache-Control', 'no-store');
  response.json(result);
});

export const getOrder = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json(await getAdminOrder(request.params.orderId));
});

export const updateOrderStatus = asyncHandler(async (request, response) => {
  response.json(await setOrderStatus(request.params.orderId, request.body || {}, request.admin));
});

export const updateOrderPayment = asyncHandler(async (request, response) => {
  response.json(await setOrderPayment(request.params.orderId, request.body || {}, request.admin));
});

export const updateOrderPricing = asyncHandler(async (request, response) => {
  response.json(await setOrderPricing(request.params.orderId, request.body || {}, request.admin));
});

export const updateFulfillment = asyncHandler(async (request, response) => {
  response.json(await saveFulfillment(request.params.orderId, request.body || {}, request.admin));
});
