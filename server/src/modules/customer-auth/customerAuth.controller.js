import { env } from '../../config/env.js';
import { getCustomerSessionToken, CUSTOMER_SESSION_COOKIE } from '../../middleware/requireCustomer.js';
import { loginCustomer, registerCustomer, revokeCustomerSession } from './customerAuth.service.js';
import { pool } from '../../config/database.js';

const cookieOptions = (token, maxAge = 0) => [
  `${CUSTOMER_SESSION_COOKIE}=${encodeURIComponent(token)}`,
  'Path=/', 'HttpOnly', 'SameSite=Strict',
  ...(env.nodeEnv === 'production' ? ['Secure'] : []),
  `Max-Age=${maxAge}`,
];

function setSession(response, token, maxAge) {
  response.setHeader('Set-Cookie', cookieOptions(token, maxAge).join('; '));
}

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export const register = asyncHandler(async (request, response) => {
  const session = await registerCustomer(request.body || {});
  setSession(response, session.token, session.maxAge);
  response.setHeader('Cache-Control', 'no-store');
  response.status(201).json({ customer: session.customer });
});

export const login = asyncHandler(async (request, response) => {
  const session = await loginCustomer(request.body || {});
  setSession(response, session.token, session.maxAge);
  response.setHeader('Cache-Control', 'no-store');
  response.json({ customer: session.customer });
});

export const current = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json({ customer: request.customer });
});

export const listCustomerOrders = asyncHandler(async (request, response) => {
  const [rows] = await pool.execute(
    `SELECT o.id, o.order_number AS orderNumber, o.status, o.payment_status AS paymentStatus,
     o.currency, o.subtotal_pkr AS subtotal, o.delivery_fee_pkr AS deliveryFee,
     o.total_pkr AS total, o.delivery_fee_confirmed AS deliveryFeeConfirmed,
     o.created_at AS createdAt,
     (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS itemCount,
     (SELECT pt.provider FROM payment_transactions pt WHERE pt.order_id = o.id ORDER BY pt.id DESC LIMIT 1) AS paymentMethod
     FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC, o.id DESC LIMIT 100`,
    [request.customer.id],
  );
  response.setHeader('Cache-Control', 'no-store');
  response.json({ items: rows.map((row) => ({ ...row, id: String(row.id), itemCount: Number(row.itemCount), subtotal: Number(row.subtotal), deliveryFee: Number(row.deliveryFee), total: Number(row.total), deliveryFeeConfirmed: Boolean(row.deliveryFeeConfirmed) })) });
});

export const logout = asyncHandler(async (request, response) => {
  await revokeCustomerSession(getCustomerSessionToken(request));
  setSession(response, '', 0);
  response.status(204).end();
});
