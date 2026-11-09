import { createCustomerCustomRequest } from './publicCustomOrders.service.js';

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export const createPublicCustomRequest = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  const result = await createCustomerCustomRequest(request.body || {}, request.customer.id);
  response.status(201).json(result);
});
