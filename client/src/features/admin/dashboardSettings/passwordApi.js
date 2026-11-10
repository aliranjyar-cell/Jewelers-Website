export async function changePassword(payload, csrfToken) {
  const response = await fetch('/api/admin/auth/password', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) return;

  const result = await response.json().catch(() => ({}));
  const error = new Error(result.error || 'The password could not be updated. Please try again.');
  error.status = response.status;
  error.fieldErrors = result.fieldErrors || {};
  error.retryAfter = Number(response.headers.get('Retry-After')) || 0;
  throw error;
}
