import { randomBytes } from 'node:crypto';
import { pool } from '../../config/database.js';

function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }

function requestNumber() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `CR-${day}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function validate(input) {
  const type = String(input.requestType || '').trim();
  const description = String(input.description || '').trim();
  const metal = String(input.requestedMetal || '').trim().toLowerCase() || null;
  const purity = String(input.requestedPurity || '').trim() || null;
  const weightText = String(input.estimatedWeight || '').trim();
  const weight = weightText ? Number(weightText) : null;
  const reference = String(input.referenceImageUrl || '').trim() || null;
  if (!['ring', 'necklace', 'chain', 'other'].includes(type)) fail('Choose what kind of piece you are requesting.');
  if (description.length < 20 || description.length > 5000) fail('Describe your design in 20 to 5000 characters.');
  if (metal && !['gold', 'silver', 'other'].includes(metal)) fail('Choose gold, silver, or other for the preferred metal.');
  if (purity && purity.length > 40) fail('Purity must be 40 characters or fewer.');
  if (weight != null && (!Number.isFinite(weight) || weight <= 0 || weight > 10000)) fail('Enter an estimated weight between 0 and 10000 grams.');
  if (reference && (reference.length > 1000 || !/^https:\/\//i.test(reference))) fail('Reference link must be a valid HTTPS URL.');
  return { type, description: `Requested item: ${type}\n\n${description}`, metal, purity, weight, reference };
}

export async function createCustomerCustomRequest(input, userId) {
  if (!userId) fail('Sign in or create an account before sending a custom request.', 401);
  const form = validate(input);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[user]] = await connection.execute("SELECT id FROM users WHERE id = ? AND role = 'customer' AND is_active = 1 LIMIT 1 FOR UPDATE", [userId]);
    if (!user) fail('Your customer account could not be verified. Sign in again.', 401);
    const reference = requestNumber();
    const [result] = await connection.execute(
      `INSERT INTO custom_order_requests
       (request_number, user_id, description, requested_metal, requested_purity,
        estimated_weight_grams, reference_image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [reference, userId, form.description, form.metal, form.purity, form.weight, form.reference],
    );
    await connection.execute(
      `INSERT INTO custom_order_request_events
       (request_id, actor_id, event_type, from_value, to_value, quote_pkr, note)
       VALUES (?, ?, 'submitted', NULL, 'submitted', NULL, 'Customer submitted a custom design request.')`,
      [result.insertId, userId],
    );
    await connection.commit();
    return { id: String(result.insertId), requestNumber: reference, status: 'submitted' };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally { connection.release(); }
}
