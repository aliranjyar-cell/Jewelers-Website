import { pool } from '../../config/database.js';

const STATUSES = new Set(['submitted', 'reviewing', 'quoted', 'rejected']);
const TRANSITIONS = {
  submitted: new Set(['submitted', 'reviewing', 'rejected']),
  reviewing: new Set(['reviewing', 'quoted', 'rejected']),
  quoted: new Set(['quoted', 'reviewing', 'rejected']),
  rejected: new Set(['rejected', 'reviewing']),
};
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function noteText(value) {
  const note = String(value ?? '').trim();
  if (note.length > 3000) fail('Seller response must be 3000 characters or fewer.');
  return note || null;
}
function parseJson(value) { if (value && typeof value === 'object') return value; try { return JSON.parse(value || ''); } catch { return null; } }

export async function listAdminCustomRequests({ search, status, page, pageSize }) {
  const clauses = ['1 = 1']; const values = [];
  if (search) {
    const term = `%${search}%`;
    clauses.push('(r.request_number LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    values.push(term, term, term, term);
  }
  if (STATUSES.has(status) || ['approved', 'converted'].includes(status)) { clauses.push('r.status = ?'); values.push(status); }
  const where = clauses.join(' AND ');
  const [[counts], [items]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM custom_order_requests r JOIN users u ON u.id = r.user_id WHERE ${where}`, values),
    pool.execute(
      `SELECT r.id, r.request_number AS requestNumber, r.status, r.requested_metal AS requestedMetal,
       r.requested_purity AS requestedPurity, r.estimated_weight_grams AS estimatedWeight,
       r.seller_quote_pkr AS quote, r.created_at AS createdAt, r.updated_at AS updatedAt,
       u.full_name AS customer, u.email, u.phone
       FROM custom_order_requests r JOIN users u ON u.id = r.user_id WHERE ${where}
       ORDER BY FIELD(r.status, 'submitted', 'reviewing', 'quoted', 'approved', 'rejected', 'converted'), r.created_at ASC
       LIMIT ? OFFSET ?`, [...values, pageSize, (page - 1) * pageSize],
    ),
  ]);
  return { items: items.map((row) => ({ ...row, id: String(row.id), quote: row.quote == null ? null : Number(row.quote), estimatedWeight: row.estimatedWeight == null ? null : Number(row.estimatedWeight) })), total: Number(counts[0].total), page, pageSize };
}

export async function getAdminCustomRequest(requestId) {
  const [rows] = await pool.execute(
    `SELECT r.*, r.id AS id, r.request_number AS requestNumber, r.requested_metal AS requestedMetal,
     r.requested_purity AS requestedPurity, r.estimated_weight_grams AS estimatedWeight,
     r.reference_image_url AS referenceImage, r.seller_quote_pkr AS quote, r.seller_note AS sellerNote,
     r.created_at AS createdAt, r.updated_at AS updatedAt,
     u.full_name AS customer, u.email, u.phone, c.name AS category
     FROM custom_order_requests r JOIN users u ON u.id = r.user_id
     LEFT JOIN categories c ON c.id = r.category_id WHERE r.id = ? OR r.request_number = ? LIMIT 1`, [requestId, requestId],
  );
  const request = rows[0]; if (!request) fail('Custom request not found.', 404);
  const [events] = await pool.execute(
    `SELECT e.id, e.event_type AS type, e.from_value AS fromValue, e.to_value AS toValue,
     e.quote_pkr AS quote, e.note, e.created_at AS createdAt, u.full_name AS actorName
     FROM custom_order_request_events e LEFT JOIN users u ON u.id = e.actor_id
     WHERE e.request_id = ? ORDER BY e.created_at DESC, e.id DESC`, [request.id],
  );
  return { ...request, id: String(request.id), userId: String(request.user_id), estimatedWeight: request.estimatedWeight == null ? null : Number(request.estimatedWeight), quote: request.quote == null ? null : Number(request.quote), referenceImage: parseJson(request.referenceImage) || request.referenceImage, events: events.map((event) => ({ ...event, id: String(event.id), quote: event.quote == null ? null : Number(event.quote) })) };
}

export async function saveAdminCustomRequest(requestId, input, admin) {
  const status = String(input.status || ''); if (!STATUSES.has(status)) fail('Choose a supported request status.');
  const sellerNote = noteText(input.sellerNote);
  const quote = input.quote === '' || input.quote == null ? null : Number(input.quote);
  if (quote != null && (!Number.isFinite(quote) || quote <= 0 || quote > 9999999999.99)) fail('Enter a valid quote greater than zero.');
  if (status === 'quoted' && quote == null) fail('Enter a quote before marking this request as quoted.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id, status, seller_quote_pkr, seller_note FROM custom_order_requests WHERE id = ? OR request_number = ? LIMIT 1 FOR UPDATE', [requestId, requestId]);
    const request = rows[0]; if (!request) fail('Custom request not found.', 404);
    if (!TRANSITIONS[request.status]?.has(status)) fail(`This request cannot move from ${request.status} to ${status}.`, 409);
    if (['approved', 'converted'].includes(request.status)) fail('This request has already been accepted or converted and is read-only.');
    await connection.execute('UPDATE custom_order_requests SET status = ?, seller_quote_pkr = ?, seller_note = ? WHERE id = ?', [status, quote, sellerNote, request.id]);
    const kind = status !== request.status ? 'status' : quote !== (request.seller_quote_pkr == null ? null : Number(request.seller_quote_pkr)) ? 'quote' : 'note';
    await connection.execute(
      `INSERT INTO custom_order_request_events (request_id, actor_id, event_type, from_value, to_value, quote_pkr, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [request.id, admin.id, kind, request.status, status, quote, sellerNote],
    );
    await connection.commit();
    return { id: String(request.id), status, quote, sellerNote };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
