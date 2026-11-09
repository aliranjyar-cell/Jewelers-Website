import { randomBytes, createHash } from 'node:crypto';
import { pool } from '../../config/database.js';
import { hashPassword, verifyPassword } from '../auth/auth.service.js';

const SESSION_DAYS = 30;
const digest = (token) => createHash('sha256').update(token).digest('hex');

function invalid(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function publicCustomer(row) {
  return { id: String(row.id), name: row.full_name, email: row.email, phone: row.phone };
}

function makeSessionToken() {
  return randomBytes(32).toString('base64url');
}

async function createSession(connection, userId) {
  const token = makeSessionToken();
  await connection.execute(
    `INSERT INTO customer_sessions (user_id, token_hash, created_at, last_seen_at, expires_at)
     VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))`,
    [userId, digest(token), SESSION_DAYS],
  );
  return token;
}

export async function registerCustomer({ fullName, email, phone, password }) {
  const name = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();
  if (name.length < 2 || name.length > 160) invalid('Enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) invalid('Enter a valid email address.');
  if (!/[0-9]/.test(normalizedPhone) || normalizedPhone.replace(/\D/g, '').length < 7 || normalizedPhone.length > 32) invalid('Enter a valid phone number.');
  if (typeof password !== 'string' || Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 1024) invalid('Use a password with at least 12 characters.');

  const passwordHash = await hashPassword(password);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? OR phone = ? FOR UPDATE', [normalizedEmail, normalizedPhone]);
    if (existing.length) invalid('An account already uses this email or phone. Sign in to continue.', 409);
    const [result] = await connection.execute(
      `INSERT INTO users (email, phone, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, 'customer', 1)`,
      [normalizedEmail, normalizedPhone, passwordHash, name],
    );
    const token = await createSession(connection, result.insertId);
    await connection.commit();
    return { token, customer: { id: String(result.insertId), name, email: normalizedEmail, phone: normalizedPhone }, maxAge: SESSION_DAYS * 24 * 60 * 60 };
  } catch (error) {
    await connection.rollback().catch(() => {});
    if (error.code === 'ER_DUP_ENTRY') invalid('An account already uses this email or phone. Sign in to continue.', 409);
    throw error;
  } finally { connection.release(); }
}

export async function loginCustomer({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || typeof password !== 'string') invalid('Enter your email and password.', 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[user]] = await connection.execute(
      `SELECT id, email, phone, full_name, password_hash, role, is_active
       FROM users WHERE email = ? LIMIT 1 FOR UPDATE`, [normalizedEmail],
    );
    const passwordOk = user ? await verifyPassword(password, user.password_hash) : false;
    if (!user || user.role !== 'customer' || !user.is_active || !passwordOk) invalid('Email or password is incorrect.', 401);
    const token = await createSession(connection, user.id);
    await connection.commit();
    return { token, customer: publicCustomer(user), maxAge: SESSION_DAYS * 24 * 60 * 60 };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally { connection.release(); }
}

export async function loadCustomerSession(token) {
  if (!token || token.length > 128) return null;
  const [rows] = await pool.execute(
    `SELECT s.id AS session_id, u.id, u.email, u.phone, u.full_name
     FROM customer_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()
       AND u.role = 'customer' AND u.is_active = 1 LIMIT 1`, [digest(token)],
  );
  if (!rows[0]) return null;
  await pool.execute('UPDATE customer_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?', [rows[0].session_id]);
  return publicCustomer(rows[0]);
}

export async function revokeCustomerSession(token) {
  if (token) await pool.execute('DELETE FROM customer_sessions WHERE token_hash = ?', [digest(token)]);
}
