import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from '../../config/database.js';
import { env } from '../../config/env.js';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const IDLE_TTL_SECONDS = 30 * 60;
const SCRYPT_N = 131072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export class AuthError extends Error {
  constructor(message, status = 401) { super(message); this.status = status; }
}

function encryptionKey() {
  const key = Buffer.from(env.authEncryptionKey, 'base64');
  if (key.length !== 32) throw new Error('AUTH_ENCRYPTION_KEY must be a Base64 encoded 32-byte key');
  return key;
}

export function encryptTotpSecret(secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptTotpSecret(value) {
  const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, salt, expected] = encoded.split('$');
    if (algorithm !== 'scrypt' || Number(n) !== SCRYPT_N || Number(r) !== SCRYPT_R || Number(p) !== SCRYPT_P) return false;
    const expectedBytes = Buffer.from(expected, 'base64url');
    const actual = await scrypt(password, Buffer.from(salt, 'base64url'), expectedBytes.length, {
      N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024,
    });
    return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
  } catch { return false; }
}

export function newTotpSecret() { return base32Encode(randomBytes(20)); }

export function makeTotpUri(secret, email) {
  const issuer = 'Jewelry Admin';
  const label = `${issuer}:${email}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(secret, code, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const currentStep = Math.floor(now / 30000);
  for (const step of [currentStep, currentStep - 1, currentStep + 1]) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const digest = createHmac('sha1', base32Decode(secret)).update(counter).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const number = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    const expected = String(number).padStart(6, '0');
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(code))) return step;
  }
  return null;
}

export function sessionCsrfToken(sessionToken) {
  return createHmac('sha256', sessionToken).update('admin-csrf-v1').digest('base64url');
}

export function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }

async function rateLimitAttempt(connection, key, failed) {
  await connection.execute(
    'INSERT IGNORE INTO auth_login_attempts (bucket_key, failed_count, window_started_at, locked_until) VALUES (?, 0, UTC_TIMESTAMP(), NULL)',
    [key],
  );
  const [[row]] = await connection.execute(
    `SELECT failed_count,
            (locked_until IS NOT NULL AND locked_until > UTC_TIMESTAMP()) AS is_locked,
            (window_started_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)) AS window_expired
     FROM auth_login_attempts WHERE bucket_key = ? FOR UPDATE`,
    [key],
  );
  if (Boolean(row.is_locked)) return false;
  if (Boolean(row.window_expired)) {
    await connection.execute('UPDATE auth_login_attempts SET failed_count = 0, window_started_at = UTC_TIMESTAMP(), locked_until = NULL WHERE bucket_key = ?', [key]);
    row.failed_count = 0;
  }
  if (failed) {
    const count = row.failed_count + 1;
    await connection.execute('UPDATE auth_login_attempts SET failed_count = ?, locked_until = IF(? >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), NULL) WHERE bucket_key = ?', [count, count, key]);
  } else if (failed === false) {
    await connection.execute('UPDATE auth_login_attempts SET failed_count = 0, locked_until = NULL, window_started_at = UTC_TIMESTAMP() WHERE bucket_key = ?', [key]);
  }
  return true;
}

export async function loginAdmin({ email, password, otp, ipAddress }) {
  const normalizedEmail = email.trim().toLowerCase();
  const bucketKeys = [
    `email:${normalizedEmail}`,
    `ip:${ipAddress}`,
  ].map((value) => createHash('sha256').update(value).digest('hex')).sort();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const key of bucketKeys) {
      if (!await rateLimitAttempt(connection, key, null)) throw new AuthError('Unable to sign in. Check your details or try again later.', 429);
    }
    const [[user]] = await connection.execute(
      'SELECT id, email, full_name, role, password_hash, is_active, totp_secret_enc, totp_last_step FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
      [normalizedEmail],
    );
    const passwordOk = user
      ? await verifyPassword(password, user.password_hash)
      : (await scrypt(password, Buffer.alloc(16), 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 }), false);
    let step = user?.totp_secret_enc ? verifyTotp(decryptTotpSecret(user.totp_secret_enc), otp) : null;
    const valid = Boolean(user && passwordOk && user.role === 'admin' && user.is_active && step !== null && step > Number(user.totp_last_step || 0));
    for (const key of bucketKeys) await rateLimitAttempt(connection, key, !valid);
    if (!valid) {
      await connection.commit();
      throw new AuthError('Unable to sign in. Check your details or try again later.');
    }

    const [consumeResult] = await connection.execute('UPDATE users SET totp_last_step = ? WHERE id = ? AND totp_last_step < ?', [step, user.id, step]);
    if (consumeResult.affectedRows !== 1) {
      await connection.commit();
      throw new AuthError('Unable to sign in. Check your details or try again later.');
    }
    const sessionToken = randomBytes(32).toString('base64url');
    await connection.execute(
      'INSERT INTO admin_sessions (user_id, token_hash, created_at, last_seen_at, expires_at) VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))',
      [user.id, tokenHash(sessionToken), SESSION_TTL_SECONDS],
    );
    await connection.commit();
    return { token: sessionToken, csrfToken: sessionCsrfToken(sessionToken), user: publicUser(user), maxAge: SESSION_TTL_SECONDS };
  } catch (error) {
    if (connection.rollback) await connection.rollback().catch(() => {});
    throw error;
  } finally { connection.release(); }
}

export async function loadAdminSession(sessionToken) {
  if (!sessionToken || sessionToken.length > 128) return null;
  const [rows] = await pool.execute(
    `SELECT s.id AS session_id, s.user_id, u.id AS id, u.email, u.full_name, u.role
     FROM admin_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()
       AND s.last_seen_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? SECOND)
       AND u.role = 'admin' AND u.is_active = 1 LIMIT 1`,
    [tokenHash(sessionToken), IDLE_TTL_SECONDS],
  );
  if (!rows[0]) return null;
  await pool.execute('UPDATE admin_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?', [rows[0].session_id]);
  return { user: publicUser(rows[0]), sessionId: rows[0].session_id };
}

export async function revokeSession(token) {
  if (token) await pool.execute('DELETE FROM admin_sessions WHERE token_hash = ?', [tokenHash(token)]);
}

function publicUser(user) { return { id: user.id, email: user.email, name: user.full_name, role: user.role }; }

function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0; let value = 0; let out = '';
  for (const byte of buffer) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0; let value = 0; const out = [];
  for (const char of input.toUpperCase().replace(/=+$/, '')) { const index = alphabet.indexOf(char); if (index < 0) throw new Error('Invalid TOTP secret'); value = (value << 5) | index; bits += 5; if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}
