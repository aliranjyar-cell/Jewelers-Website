import { env } from '../../config/env.js';
import { AuthError, changeAdminPassword, loginAdmin, revokeSession, sessionCsrfToken } from './auth.service.js';
import { getSessionToken } from '../../middleware/requireAuth.js';

const cookieOptions = (token, maxAge) => [
  `${env.sessionCookieName}=${encodeURIComponent(token)}`,
  'Path=/',
  'HttpOnly',
  'SameSite=Strict',
  ...(env.nodeEnv === 'production' ? ['Secure'] : []),
  ...(maxAge ? [`Max-Age=${maxAge}`] : ['Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT']),
];

function setSessionCookie(response, token, maxAge) {
  response.setHeader('Set-Cookie', cookieOptions(token, maxAge).join('; '));
}
function clearSessionCookie(response) { response.setHeader('Set-Cookie', cookieOptions('', 0).join('; ')); }

export async function login(request, response, next) {
  try {
    response.setHeader('Cache-Control', 'no-store');
    const { email, password, otp } = request.body || {};
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length > 1024 || typeof otp !== 'string') {
      throw new AuthError('Unable to sign in. Check your details or try again later.');
    }
    const session = await loginAdmin({ email, password, otp, ipAddress: request.ip || 'unknown' });
    setSessionCookie(response, session.token, session.maxAge);
    response.json({ user: session.user, csrfToken: session.csrfToken });
  } catch (error) { next(error); }
}

export function currentAdmin(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.json({ user: request.admin, csrfToken: sessionCsrfToken(request.sessionToken) });
}

export async function logout(request, response, next) {
  try {
    await revokeSession(getSessionToken(request));
    clearSessionCookie(response);
    response.setHeader('Cache-Control', 'no-store');
    response.status(204).end();
  } catch (error) { next(error); }
}

export async function changePassword(request, response, next) {
  try {
    response.setHeader('Cache-Control', 'no-store');
    const { currentPassword, newPassword, signOutOtherSessions } = request.body || {};
    const fieldErrors = {};
    if (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > 1024) {
      fieldErrors.currentPassword = 'Enter your current password.';
    }
    if (typeof newPassword !== 'string' || !newPassword || newPassword.length > 128) {
      fieldErrors.newPassword = 'Enter a new password of no more than 128 characters.';
    }
    if (typeof signOutOtherSessions !== 'boolean') {
      throw new AuthError('Invalid password-change request.', 400);
    }
    if (Object.keys(fieldErrors).length) {
      const error = new AuthError('Check the password fields and try again.', 400);
      error.fieldErrors = fieldErrors;
      throw error;
    }

    await changeAdminPassword({
      userId: request.admin.id,
      sessionId: request.adminSessionId,
      currentPassword,
      newPassword,
      signOutOtherSessions,
    });
    response.status(204).end();
  } catch (error) {
    if (error.retryAfter) response.setHeader('Retry-After', String(error.retryAfter));
    next(error);
  }
}
