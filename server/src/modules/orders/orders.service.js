import { pool } from '../../config/database.js';
import { fulfillOrderInventoryInTransaction, releaseOrderInventoryInTransaction, reserveOrderInventoryInTransaction } from '../inventory/inventory.service.js';

const STATUSES = new Set(['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'pending_payment']);
const PAYMENT_STATUSES = new Set(['unpaid', 'pending', 'paid', 'failed', 'refunded']);
const TRANSITIONS = {
  pending_payment: new Set(['placed', 'confirmed', 'cancelled']),
  placed: new Set(['confirmed', 'cancelled']),
  confirmed: new Set(['processing', 'cancelled']),
  processing: new Set(['shipped', 'cancelled']),
  shipped: new Set(['delivered']),
  delivered: new Set(['refunded']),
  cancelled: new Set(['refunded']),
  refunded: new Set(),
};

function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function boundedText(value, label, max, required = false) {
  const result = String(value ?? '').trim();
  if (required && !result) fail(`${label} is required.`);
  if (result.length > max) fail(`${label} must be ${max} characters or fewer.`);
  return result || null;
}
function parseJson(value, fallback = {}) {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || ''); } catch { return fallback; }
}
async function withTransaction(work) {
  const connection = await pool.getConnection();
  try { await connection.beginTransaction(); const result = await work(connection); await connection.commit(); return result; }
  catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

async function recordEvent(connection, { orderId, actorId, type, fromValue = null, toValue = null, note = null, metadata = null }) {
  await connection.execute(
    `INSERT INTO order_events (order_id, actor_id, event_type, from_value, to_value, note, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [orderId, actorId || null, type, fromValue, toValue, note, metadata ? JSON.stringify(metadata) : null],
  );
}

function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }

export async function listAdminOrders(filters) {
  const clauses = ['1 = 1']; const values = [];
  if (filters.search) {
    const q = `%${filters.search}%`;
    clauses.push('(o.order_number LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR o.recipient_name LIKE ? OR o.phone LIKE ?)');
    values.push(q, q, q, q, q, q);
  }
  if (filters.status && STATUSES.has(filters.status)) { clauses.push('o.status = ?'); values.push(filters.status); }
  if (filters.paymentStatus && PAYMENT_STATUSES.has(filters.paymentStatus)) { clauses.push('o.payment_status = ?'); values.push(filters.paymentStatus); }
  if (filters.paymentMethod) { clauses.push('EXISTS (SELECT 1 FROM payment_transactions pm WHERE pm.order_id = o.id AND pm.provider LIKE ?)'); values.push(`%${filters.paymentMethod}%`); }
  if (filters.dateFrom && validDate(filters.dateFrom)) { clauses.push('o.created_at >= ?'); values.push(`${filters.dateFrom} 00:00:00`); }
  if (filters.dateTo && validDate(filters.dateTo)) { clauses.push('o.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); values.push(`${filters.dateTo} 00:00:00`); }
  const sort = { newest: 'o.created_at DESC, o.id DESC', oldest: 'o.created_at ASC, o.id ASC', total: 'o.total_pkr DESC, o.created_at DESC' }[filters.sort] || 'o.created_at DESC, o.id DESC';
  const where = clauses.join(' AND ');
  const [[countRows], [rows]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id WHERE ${where}`, values),
    pool.execute(
      `SELECT o.id, o.order_number AS orderNumber, o.created_at AS createdAt, o.updated_at AS updatedAt,
       o.status, o.payment_status AS paymentStatus, o.total_pkr AS total, o.delivery_fee_confirmed AS deliveryFeeConfirmed, o.phone AS recipientPhone,
       u.full_name AS customerName, u.email AS email, u.phone AS customerPhone,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS itemCount,
       (SELECT pt.provider FROM payment_transactions pt WHERE pt.order_id = o.id ORDER BY pt.updated_at DESC, pt.id DESC LIMIT 1) AS paymentMethod
       FROM orders o JOIN users u ON u.id = o.user_id WHERE ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`,
      [...values, filters.pageSize, (filters.page - 1) * filters.pageSize],
    ),
  ]);
  return { items: rows.map((row) => ({ ...row, id: String(row.id), itemCount: Number(row.itemCount), total: Number(row.total), deliveryFeeConfirmed: Boolean(row.deliveryFeeConfirmed) })), total: Number(countRows[0].total), page: filters.page, pageSize: filters.pageSize };
}

export async function getAdminOrder(orderId) {
  const [orders] = await pool.execute(
    `SELECT o.*, o.id AS id, u.full_name AS customerName, u.email AS customerEmail, u.phone AS customerPhone
     FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ? OR o.order_number = ? LIMIT 1`, [orderId, orderId],
  );
  const order = orders[0]; if (!order) fail('Order not found.', 404);
  const [items] = await pool.execute(
    `SELECT oi.id, oi.product_name_snapshot AS productName, oi.sku_snapshot AS sku, oi.option_snapshot AS optionLabel,
     oi.metal_type_snapshot AS metalType, oi.purity_snapshot AS purity, oi.weight_grams_snapshot AS weightGrams,
     oi.metal_rate_pkr_snapshot AS metalRate, oi.making_charge_type_snapshot AS makingChargeType,
     oi.making_charge_pkr_snapshot AS makingCharge, oi.unit_price_pkr AS unitPrice, oi.quantity, oi.line_total_pkr AS lineTotal,
     v.availability AS stockAvailability,
     (SELECT ir.status FROM inventory_reservations ir WHERE ir.order_item_id = oi.id ORDER BY ir.id DESC LIMIT 1) AS reservationStatus,
     (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image
     FROM order_items oi LEFT JOIN product_variants v ON v.id = oi.variant_id WHERE oi.order_id = ? ORDER BY oi.id`, [order.id],
  );
  const [payments] = await pool.execute(
    `SELECT id, provider, provider_reference AS reference, status, amount_pkr AS amount, created_at AS createdAt, updated_at AS updatedAt
     FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC, id DESC`, [order.id],
  );
  const [events] = await pool.execute(
    `SELECT e.id, e.event_type AS type, e.from_value AS fromValue, e.to_value AS toValue, e.note, e.metadata,
     e.created_at AS createdAt, u.full_name AS actorName FROM order_events e LEFT JOIN users u ON u.id = e.actor_id
     WHERE e.order_id = ? ORDER BY e.created_at DESC, e.id DESC`, [order.id],
  );
  const [reservations] = await pool.execute(
    `SELECT ir.quantity, ir.status, v.sku FROM inventory_reservations ir LEFT JOIN product_variants v ON v.id = ir.variant_id
     WHERE ir.order_id = ? ORDER BY ir.id`, [order.id],
  );
  return {
    ...order, id: String(order.id), userId: String(order.user_id), subtotal: Number(order.subtotal_pkr),
    deliveryFee: Number(order.delivery_fee_pkr), discount: Number(order.discount_pkr), total: Number(order.total_pkr),
    address: parseJson(order.address_snapshot), items: items.map((item) => ({ ...item, id: String(item.id), unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal), quantity: Number(item.quantity), weightGrams: item.weightGrams == null ? null : Number(item.weightGrams), metalRate: item.metalRate == null ? null : Number(item.metalRate), makingCharge: item.makingCharge == null ? null : Number(item.makingCharge) })),
    payments: payments.map((item) => ({ ...item, id: String(item.id), amount: Number(item.amount) })),
    events: events.map((event) => ({ ...event, id: String(event.id), metadata: parseJson(event.metadata, null) })),
    reservations,
  };
}

export async function setOrderStatus(orderId, input, admin) {
  const status = String(input.status || ''); if (!STATUSES.has(status)) fail('Choose a valid order status.');
  const reason = boundedText(input.reason, 'Reason', 500, status === 'cancelled');
  const overrideReason = boundedText(input.overrideReason, 'Payment override reason', 500);
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute('SELECT id, status, payment_status, delivery_fee_confirmed AS deliveryFeeConfirmed FROM orders WHERE id = ? OR order_number = ? LIMIT 1 FOR UPDATE', [orderId, orderId]);
    const order = rows[0]; if (!order) fail('Order not found.', 404);
    if (order.status === status) fail('The order already has this status.', 409);
    if (!TRANSITIONS[order.status]?.has(status)) fail(`The order cannot move from ${order.status.replaceAll('_', ' ')} to ${status.replaceAll('_', ' ')}.`, 409);
    if (status === 'delivered' && !order.deliveryFeeConfirmed) fail('Confirm the delivery fee and final total before marking this order delivered.', 409);
    if (status === 'delivered' && order.payment_status !== 'paid' && !overrideReason) fail('Confirm payment first or provide a reason for the unpaid delivery override.', 409);
    if (status === 'confirmed') await reserveOrderInventoryInTransaction(connection, order.id, admin.id);
    if (status === 'shipped') {
      if (!order.deliveryFeeConfirmed) fail('Confirm the delivery fee and final total before shipping this order.', 409);
      if (order.payment_status === 'failed') fail('Resolve the failed payment before shipping this order.', 409);
      const [unreserved] = await connection.execute(
        `SELECT COUNT(*) AS total FROM order_items oi JOIN product_variants v ON v.id = oi.variant_id
         WHERE oi.order_id = ? AND v.availability <> 'made_to_order'
         AND NOT EXISTS (SELECT 1 FROM inventory_reservations ir WHERE ir.order_item_id = oi.id AND ir.status = 'reserved')`, [order.id],
      );
      if (Number(unreserved[0]?.total || 0)) fail('Some available items are not reserved. Reconfirm the order before shipping.', 409);
      await fulfillOrderInventoryInTransaction(connection, order.id, admin.id);
    }
    if (status === 'cancelled') await releaseOrderInventoryInTransaction(connection, order.id, admin.id);
    await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
    await recordEvent(connection, { orderId: order.id, actorId: admin.id, type: 'status', fromValue: order.status, toValue: status, note: reason || overrideReason });
    if (overrideReason && status === 'delivered') await recordEvent(connection, { orderId: order.id, actorId: admin.id, type: 'payment_override', note: overrideReason });
    return { id: String(order.id), status };
  });
}

export async function setOrderPayment(orderId, input, admin) {
  const status = String(input.status || ''); if (!PAYMENT_STATUSES.has(status)) fail('Choose a valid payment status.');
  const provider = boundedText(input.provider || 'Manual', 'Payment method', 40, true);
  const reference = boundedText(input.reference, 'Transaction reference', 160);
  const note = boundedText(input.note, 'Note', 500);
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute('SELECT id, status, payment_status, total_pkr, delivery_fee_confirmed AS deliveryFeeConfirmed FROM orders WHERE id = ? OR order_number = ? LIMIT 1 FOR UPDATE', [orderId, orderId]);
    const order = rows[0]; if (!order) fail('Order not found.', 404);
    if (order.payment_status === 'refunded' && status !== 'refunded') fail('A refunded payment cannot be changed.', 409);
    if (order.status === 'refunded' && status !== 'refunded') fail('A refunded order can only have a refunded payment status.', 409);
    if (order.payment_status === 'paid' && !['paid', 'refunded'].includes(status)) fail('A received payment cannot be changed to an unpaid or failed state. Record a refund if money was returned.', 409);
    if (status === 'paid' && !order.deliveryFeeConfirmed) fail('Confirm the delivery fee and final total before recording payment.', 409);
    if (status === 'paid' && ['confirmed', 'processing'].includes(order.status)) await reserveOrderInventoryInTransaction(connection, order.id, admin.id);
    await connection.execute('UPDATE orders SET payment_status = ? WHERE id = ?', [status, order.id]);
    const transactionStatus = ({ paid: 'succeeded', unpaid: 'initiated' })[status] || status;
    const [attempts] = await connection.execute(
      'SELECT id FROM payment_transactions WHERE order_id = ? AND provider = ? AND provider_reference <=> ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
      [order.id, provider, reference],
    );
    if (attempts[0]) {
      await connection.execute('UPDATE payment_transactions SET status = ?, amount_pkr = ? WHERE id = ?', [transactionStatus, order.total_pkr, attempts[0].id]);
    } else {
      await connection.execute(
        `INSERT INTO payment_transactions (order_id, provider, provider_reference, status, amount_pkr)
         VALUES (?, ?, ?, ?, ?)`, [order.id, provider, reference, transactionStatus, order.total_pkr],
      );
    }
    if (status === 'failed') await releaseOrderInventoryInTransaction(connection, order.id, admin.id);
    await recordEvent(connection, { orderId: order.id, actorId: admin.id, type: 'payment', fromValue: order.payment_status, toValue: status, note, metadata: { provider, reference } });
    return { id: String(order.id), paymentStatus: status };
  });
}

export async function setOrderPricing(orderId, input, admin) {
  const deliveryFee = Number(input.deliveryFee);
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 9999999999.99) fail('Enter a valid delivery fee, including zero if no fee applies.');
  const roundedFee = Math.round(deliveryFee * 100) / 100;
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT id, status, payment_status, subtotal_pkr, discount_pkr, delivery_fee_pkr, delivery_fee_confirmed FROM orders WHERE id = ? OR order_number = ? LIMIT 1 FOR UPDATE', [orderId, orderId],
    );
    const order = rows[0]; if (!order) fail('Order not found.', 404);
    if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status) || order.payment_status === 'paid') fail('The final delivery total can no longer be changed for this order.', 409);
    const total = Math.round((Number(order.subtotal_pkr) - Number(order.discount_pkr) + roundedFee) * 100) / 100;
    await connection.execute('UPDATE orders SET delivery_fee_pkr = ?, delivery_fee_confirmed = 1, total_pkr = ? WHERE id = ?', [roundedFee, total, order.id]);
    await recordEvent(connection, {
      orderId: order.id, actorId: admin.id, type: 'pricing',
      fromValue: order.delivery_fee_confirmed ? String(order.delivery_fee_pkr) : 'unconfirmed',
      toValue: String(roundedFee), note: `Final order total confirmed: PKR ${total.toFixed(2)}.`,
      metadata: { deliveryFee: roundedFee, total },
    });
    return { id: String(order.id), deliveryFee: roundedFee, total, deliveryFeeConfirmed: true };
  });
}

export async function saveFulfillment(orderId, input, admin) {
  const courier = boundedText(input.courier, 'Courier', 120);
  const tracking = boundedText(input.tracking, 'Tracking number', 160);
  const internalNote = boundedText(input.internalNote, 'Internal note', 1000);
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute('SELECT id, courier_name, tracking_number, internal_note FROM orders WHERE id = ? OR order_number = ? LIMIT 1 FOR UPDATE', [orderId, orderId]);
    const order = rows[0]; if (!order) fail('Order not found.', 404);
    if (!['confirmed', 'processing', 'shipped'].includes((await getStatus(connection, order.id)))) fail('Fulfillment details can only be changed for confirmed, processing, or shipped orders.', 409);
    await connection.execute('UPDATE orders SET courier_name = ?, tracking_number = ?, internal_note = ? WHERE id = ?', [courier, tracking, internalNote, order.id]);
    const changes = [];
    for (const [field, previous, next] of [['courier', order.courier_name, courier], ['tracking', order.tracking_number, tracking], ['note', order.internal_note, internalNote]]) {
      if ((previous || null) !== (next || null)) changes.push({ field, previous, next });
    }
    if (changes.length) await recordEvent(connection, { orderId: order.id, actorId: admin.id, type: 'fulfillment', note: internalNote, metadata: { changes } });
    return { id: String(order.id), courier, tracking, internalNote };
  });
}

async function getStatus(connection, orderId) {
  const [rows] = await connection.execute('SELECT status FROM orders WHERE id = ?', [orderId]); return rows[0]?.status;
}
