export function requireAdmin(request, response, next) {
  if (request.admin?.role !== 'admin') return response.status(403).json({ error: 'Administrator access required' });
  next();
}

import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { sessionCsrfToken } from '../modules/auth/auth.service.js';

export function requireSameOrigin(request, response, next) {
  if (request.get('origin') !== env.clientOrigin) {
    return response.status(403).json({ error: 'Request origin rejected' });
  }
  next();
}

export function requireCsrf(request, response, next) {
  const expected = request.sessionToken ? sessionCsrfToken(request.sessionToken) : null;
  const supplied = request.get('x-csrf-token');
  const valid = expected && supplied && Buffer.byteLength(expected) === Buffer.byteLength(supplied)
    && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
  if (!valid) return response.status(403).json({ error: 'CSRF validation failed' });
  next();
}
