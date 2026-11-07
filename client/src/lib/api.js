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
