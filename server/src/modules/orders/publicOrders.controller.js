import { createOrderFromStorefront, previewOrderFromStorefront } from './publicOrders.service.js';

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export const previewCustomerOrder = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json(await previewOrderFromStorefront(request.body || {}));
});

export const createCustomerOrder = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.status(201).json(await createOrderFromStorefront(request.body || {}, request.customer.id));
});
