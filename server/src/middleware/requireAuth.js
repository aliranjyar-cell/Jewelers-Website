import { loadAdminSession } from '../modules/auth/auth.service.js';
import { env } from '../config/env.js';

export function getSessionToken(request) {
  const cookie = request.headers.cookie || '';
  const pair = cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${env.sessionCookieName}=`));
  if (!pair) return null;
  try { return decodeURIComponent(pair.slice(env.sessionCookieName.length + 1)); } catch { return null; }
}

export async function requireAuth(request, response, next) {
  try {
    response.setHeader('Cache-Control', 'no-store');
    const token = getSessionToken(request);
    const session = await loadAdminSession(token);
    if (!session) return response.status(401).json({ error: 'Authentication required' });
    request.admin = session.user;
    request.adminSessionId = session.sessionId;
    request.sessionToken = token;
    next();
  } catch (error) { next(error); }
}
