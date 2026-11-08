const AUTH_URL = '/api/admin/auth';

async function authRequest(path, options = {}) {
  const response = await fetch(`${AUTH_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}

export const adminAuth = {
  login: (credentials) => authRequest('/login', { method: 'POST', body: JSON.stringify(credentials) }),
  current: () => authRequest('/me'),
  logout: (csrfToken) => authRequest('/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } }),
};

const PRODUCT_URL = '/api/admin/products';

async function productRequest(path = '', options = {}) {
  const response = await fetch(`${PRODUCT_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'The product request could not be completed.');
    error.status = response.status;
    error.details = result.details || [];
    throw error;
  }
  return result;
}

export const adminProducts = {
  list: (params = {}) => productRequest(`?${new URLSearchParams(params)}`),
  categories: () => productRequest('/categories'),
  get: (id) => productRequest(`/${encodeURIComponent(id)}`),
  create: (product) => productRequest('', { method: 'POST', body: JSON.stringify(product) }),
  update: (id, product) => productRequest(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(product) }),
  previewPrice: (details) => productRequest('/pricing-preview', { method: 'POST', body: JSON.stringify(details) }),
};
