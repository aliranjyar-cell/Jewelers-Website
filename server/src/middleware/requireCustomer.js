import { loadCustomerSession } from '../modules/customer-auth/customerAuth.service.js';

const COOKIE_NAME = 'jewelry_customer_session';

export function getCustomerSessionToken(request) {
  const cookie = request.headers.cookie || '';
  for (const item of cookie.split(';')) {
    const [name, ...parts] = item.trim().split('=');
    if (name === COOKIE_NAME) {
      try { return decodeURIComponent(parts.join('=')); } catch { return ''; }
    }
  }
  return '';
}

export async function requireCustomer(request, response, next) {
  try {
    const token = getCustomerSessionToken(request);
    const customer = await loadCustomerSession(token);
    if (!customer) return response.status(401).json({ error: 'Sign in or create an account to continue.' });
    request.customer = customer;
    request.customerSessionToken = token;
    return next();
  } catch (error) { return next(error); }
}

export { COOKIE_NAME as CUSTOMER_SESSION_COOKIE };
