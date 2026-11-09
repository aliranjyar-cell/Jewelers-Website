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

const INVENTORY_URL = '/api/admin/inventory';

async function inventoryRequest(path = '', options = {}) {
  const response = await fetch(`${INVENTORY_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'The inventory request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return result;
}

export const adminInventory = {
  list: (params = {}) => inventoryRequest(`?${new URLSearchParams(params)}`),
  movements: (params = {}) => inventoryRequest(`/movements?${new URLSearchParams(params)}`),
  receive: (variantId, payload) => inventoryRequest(`/variants/${encodeURIComponent(variantId)}/receive`, { method: 'POST', body: JSON.stringify(payload) }),
  adjust: (variantId, payload) => inventoryRequest(`/variants/${encodeURIComponent(variantId)}/adjust`, { method: 'POST', body: JSON.stringify(payload) }),
  setReorderPoint: (variantId, reorderPoint) => inventoryRequest(`/variants/${encodeURIComponent(variantId)}/reorder-point`, { method: 'PATCH', body: JSON.stringify({ reorderPoint }) }),
  reserveOrder: (orderId) => inventoryRequest(`/orders/${encodeURIComponent(orderId)}/reserve`, { method: 'POST', body: '{}' }),
  releaseOrder: (orderId) => inventoryRequest(`/orders/${encodeURIComponent(orderId)}/release`, { method: 'POST', body: '{}' }),
  fulfillOrder: (orderId) => inventoryRequest(`/orders/${encodeURIComponent(orderId)}/fulfill`, { method: 'POST', body: '{}' }),
};

const ORDER_URL = '/api/admin/orders';

async function orderRequest(path = '', options = {}) {
  const response = await fetch(`${ORDER_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'The order request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return result;
}

export const adminOrders = {
  list: (params = {}) => orderRequest(`?${new URLSearchParams(params)}`),
  get: (id) => orderRequest(`/${encodeURIComponent(id)}`),
  updateStatus: (id, payload) => orderRequest(`/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updatePayment: (id, payload) => orderRequest(`/${encodeURIComponent(id)}/payment`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateFulfillment: (id, payload) => orderRequest(`/${encodeURIComponent(id)}/fulfillment`, { method: 'PATCH', body: JSON.stringify(payload) }),
};

const PUBLIC_PRODUCT_URL = '/api/products';

async function publicProductRequest(path = '', options = {}) {
  const response = await fetch(`${PUBLIC_PRODUCT_URL}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'The product request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return result;
}

export const publicProducts = {
  list: (params = {}) => publicProductRequest(`?${new URLSearchParams(params)}`),
  categories: () => publicProductRequest('/categories'),
  get: (slug) => publicProductRequest(`/${encodeURIComponent(slug)}`),
};
