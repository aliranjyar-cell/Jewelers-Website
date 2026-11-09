import { pool } from '../../config/database.js';

const RESERVED_FOR_VARIANT = "(SELECT COALESCE(SUM(ir.quantity), 0) FROM inventory_reservations ir WHERE ir.variant_id = v.id AND ir.status = 'reserved')";
const AVAILABLE_FOR_VARIANT = `GREATEST(v.stock_quantity - ${RESERVED_FOR_VARIANT}, 0)`;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function integer(value, label, { min = 0, max = 2147483647 } = {}) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < min || result > max) fail(`${label} must be a whole number between ${min} and ${max}.`);
  return result;
}

function text(value, label, max, required = false) {
  const result = String(value ?? '').trim();
  if (required && !result) fail(`${label} is required.`);
  if (result.length > max) fail(`${label} must be ${max} characters or fewer.`);
  return result || null;
}

async function transaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function reservedQuantity(connection, variantId) {
  const [rows] = await connection.execute(
    "SELECT COALESCE(SUM(quantity), 0) AS quantity FROM inventory_reservations WHERE variant_id = ? AND status = 'reserved'",
    [variantId],
  );
  return Number(rows[0]?.quantity || 0);
}

async function getVariantForUpdate(connection, variantId) {
  const [rows] = await connection.execute(
    `SELECT v.id, v.sku, v.stock_quantity AS onHand, v.reorder_point AS reorderPoint,
     v.availability, p.name AS productName FROM product_variants v
     JOIN products p ON p.id = v.product_id WHERE v.id = ? FOR UPDATE`, [variantId],
  );
  if (!rows[0]) fail('Product variant not found.', 404);
  return { ...rows[0], onHand: Number(rows[0].onHand), reorderPoint: Number(rows[0].reorderPoint) };
}

async function insertMovement(connection, {
  variant, onHandChange = 0, reservedChange = 0, onHandAfter, reservedAfter = 0,
  type, reason, note = null, orderId = null, actorId = null,
}) {
  await connection.execute(
    `INSERT INTO inventory_movements
     (variant_id, product_name_snapshot, sku_snapshot, movement_type, on_hand_change, reserved_change,
      on_hand_after, reserved_after, reason, note, order_id, performed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [variant.id, variant.productName, variant.sku, type, onHandChange, reservedChange,
      onHandAfter, reservedAfter, reason, note, orderId, actorId],
  );
}

export async function getInventoryOverview({ search = '', filter = 'all', page = 1, pageSize = 25 } = {}) {
  const clauses = [];
  const values = [];
  if (search) {
    clauses.push('(p.name LIKE ? OR v.sku LIKE ? OR v.option_label LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (filter === 'low') clauses.push(`v.availability = 'available' AND ${AVAILABLE_FOR_VARIANT} > 0 AND ${AVAILABLE_FOR_VARIANT} <= v.reorder_point`);
  if (filter === 'out') clauses.push(`v.availability = 'available' AND ${AVAILABLE_FOR_VARIANT} = 0`);
  if (filter === 'unavailable') clauses.push("v.availability = 'unavailable'");
  if (filter === 'made_to_order') clauses.push("v.availability = 'made_to_order'");
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [[summaryRows], [countRows], [items]] = await Promise.all([
    pool.execute(
      `SELECT COUNT(*) AS variants, COALESCE(SUM(v.stock_quantity), 0) AS units,
       SUM(CASE WHEN v.availability = 'available' AND ${AVAILABLE_FOR_VARIANT} = 0 THEN 1 ELSE 0 END) AS outOfStock,
       SUM(CASE WHEN v.availability = 'available' AND ${AVAILABLE_FOR_VARIANT} > 0 AND ${AVAILABLE_FOR_VARIANT} <= v.reorder_point THEN 1 ELSE 0 END) AS lowStock,
       SUM(CASE WHEN v.availability = 'made_to_order' THEN 1 ELSE 0 END) AS madeToOrder,
       (SELECT COALESCE(SUM(quantity), 0) FROM inventory_reservations WHERE status = 'reserved') AS reserved
       FROM product_variants v`,
    ),
    pool.execute(`SELECT COUNT(*) AS total FROM product_variants v JOIN products p ON p.id = v.product_id ${where}`, values),
    pool.execute(
      `SELECT v.id AS variantId, p.id AS productId, p.name AS productName, p.slug, p.status AS productStatus,
       v.sku, v.option_label AS optionLabel, v.availability, v.stock_quantity AS onHand,
       v.reorder_point AS reorderPoint, v.weight_grams AS weightGrams,
       c.name AS category,
       (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image,
       (SELECT COALESCE(SUM(ir.quantity), 0) FROM inventory_reservations ir WHERE ir.variant_id = v.id AND ir.status = 'reserved') AS reserved
       FROM product_variants v JOIN products p ON p.id = v.product_id
       LEFT JOIN categories c ON c.id = p.category_id ${where}
       ORDER BY CASE WHEN v.availability = 'available' AND ${AVAILABLE_FOR_VARIANT} = 0 THEN 0
                     WHEN v.availability = 'available' AND ${AVAILABLE_FOR_VARIANT} <= v.reorder_point THEN 1 ELSE 2 END,
                p.name, v.option_label, v.sku LIMIT ? OFFSET ?`,
      [...values, pageSize, (page - 1) * pageSize],
    ),
  ]);
  const summary = summaryRows[0];
  return {
    summary: {
      variants: Number(summary.variants || 0), units: Number(summary.units || 0),
      reserved: Number(summary.reserved || 0), outOfStock: Number(summary.outOfStock || 0),
      lowStock: Number(summary.lowStock || 0), madeToOrder: Number(summary.madeToOrder || 0),
    },
    items: items.map((item) => {
      const onHand = Number(item.onHand || 0);
      const reserved = Number(item.reserved || 0);
      return { ...item, variantId: String(item.variantId), productId: String(item.productId), onHand, reserved,
        available: item.availability === 'available' ? Math.max(0, onHand - reserved) : 0,
        reorderPoint: Number(item.reorderPoint), weightGrams: item.weightGrams === null ? null : Number(item.weightGrams) };
    }),
    total: Number(countRows[0].total || 0), page, pageSize,
  };
}

export async function listInventoryMovements({ search = '', page = 1, pageSize = 30 } = {}) {
  const searchClause = search ? 'WHERE (m.product_name_snapshot LIKE ? OR m.sku_snapshot LIKE ? OR m.reason LIKE ?)' : '';
  const searchValues = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
  const [[countRows], [rows]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM inventory_movements m ${searchClause}`, searchValues),
    pool.execute(
      `SELECT m.id, m.variant_id AS variantId, m.product_name_snapshot AS productName,
       m.sku_snapshot AS sku, m.movement_type AS type, m.on_hand_change AS onHandChange,
       m.reserved_change AS reservedChange, m.on_hand_after AS onHandAfter,
       m.reserved_after AS reservedAfter, m.reason, m.note, m.order_id AS orderId,
       m.created_at AS createdAt, u.full_name AS performedBy
       FROM inventory_movements m LEFT JOIN users u ON u.id = m.performed_by ${searchClause}
       ORDER BY m.created_at DESC, m.id DESC LIMIT ? OFFSET ?`,
      [...searchValues, pageSize, (page - 1) * pageSize],
    ),
  ]);
  return { items: rows.map((row) => ({ ...row, id: String(row.id), variantId: row.variantId === null ? null : String(row.variantId), orderId: row.orderId === null ? null : String(row.orderId), onHandChange: Number(row.onHandChange), reservedChange: Number(row.reservedChange), onHandAfter: Number(row.onHandAfter), reservedAfter: Number(row.reservedAfter) })), total: Number(countRows[0].total || 0), page, pageSize };
}

export async function receiveInventory(variantId, input, actorId) {
  const quantity = integer(input.quantity, 'Quantity', { min: 1 });
  const reason = text(input.reason, 'Reason', 120, true);
  const note = text(input.note, 'Note', 500);
  const reorderPoint = input.reorderPoint === undefined ? null : integer(input.reorderPoint, 'Reorder point');
  const type = input.type === 'return' ? 'return' : 'receipt';
  return transaction(async (connection) => {
    const variant = await getVariantForUpdate(connection, variantId);
    const reserved = await reservedQuantity(connection, variantId);
    const onHandAfter = variant.onHand + quantity;
    if (onHandAfter > 2147483647) fail('The resulting stock count is too large.');
    if (reorderPoint !== null) await connection.execute('UPDATE product_variants SET reorder_point = ? WHERE id = ?', [reorderPoint, variantId]);
    await connection.execute('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [onHandAfter, variantId]);
    await insertMovement(connection, { variant, type, onHandChange: quantity, onHandAfter, reservedAfter: reserved, reason, note, actorId });
    return { onHand: onHandAfter, reserved, available: variant.availability === 'available' ? Math.max(0, onHandAfter - reserved) : 0, reorderPoint: reorderPoint ?? variant.reorderPoint };
  });
}

export async function adjustInventory(variantId, input, actorId) {
  const countedQuantity = integer(input.countedQuantity, 'Counted quantity');
  const reason = text(input.reason, 'Reason', 120, true);
  const note = text(input.note, 'Note', 500);
  const reorderPoint = input.reorderPoint === undefined ? null : integer(input.reorderPoint, 'Reorder point');
  return transaction(async (connection) => {
    const variant = await getVariantForUpdate(connection, variantId);
    const reserved = await reservedQuantity(connection, variantId);
    if (countedQuantity < reserved) fail(`There are ${reserved} units reserved for orders. The count cannot be set below that quantity.`);
    const change = countedQuantity - variant.onHand;
    if (reorderPoint !== null) await connection.execute('UPDATE product_variants SET reorder_point = ? WHERE id = ?', [reorderPoint, variantId]);
    await connection.execute('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [countedQuantity, variantId]);
    if (change !== 0) await insertMovement(connection, { variant, type: 'adjustment', onHandChange: change, onHandAfter: countedQuantity, reservedAfter: reserved, reason, note, actorId });
    return { onHand: countedQuantity, reserved, available: variant.availability === 'available' ? Math.max(0, countedQuantity - reserved) : 0, reorderPoint: reorderPoint ?? variant.reorderPoint, change };
  });
}

export async function updateReorderPoint(variantId, input) {
  const reorderPoint = integer(input.reorderPoint, 'Reorder point');
  return transaction(async (connection) => {
    await getVariantForUpdate(connection, variantId);
    await connection.execute('UPDATE product_variants SET reorder_point = ? WHERE id = ?', [reorderPoint, variantId]);
    return { reorderPoint };
  });
}

export async function reserveOrderInventory(orderId, actorId = null) {
  return transaction((connection) => reserveOrderInventoryInTransaction(connection, orderId, actorId));
}

export async function reserveOrderInventoryInTransaction(connection, orderId, actorId = null) {
    const [orders] = await connection.execute('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!orders[0]) fail('Order not found.', 404);
    if (['cancelled', 'refunded', 'shipped', 'delivered'].includes(orders[0].status)) fail('Inventory cannot be reserved for an order in this status.', 409);
    const [items] = await connection.execute(
      `SELECT oi.id AS orderItemId, oi.variant_id AS variantId, oi.quantity, oi.product_name_snapshot AS productName,
       oi.sku_snapshot AS sku FROM order_items oi WHERE oi.order_id = ? AND oi.variant_id IS NOT NULL
       ORDER BY oi.variant_id, oi.id`, [orderId],
    );
    const results = [];
    for (const item of items) {
      const [active] = await connection.execute("SELECT id, quantity FROM inventory_reservations WHERE order_item_id = ? AND status = 'reserved' LIMIT 1 FOR UPDATE", [item.orderItemId]);
      const quantity = Number(item.quantity);
      if (active[0]) {
        if (Number(active[0].quantity) !== quantity) fail('An existing reservation does not match the order quantity.', 409);
        continue;
      }
      const variant = await getVariantForUpdate(connection, item.variantId);
      if (variant.availability === 'made_to_order') { results.push({ orderItemId: String(item.orderItemId), reserved: false, reason: 'made_to_order' }); continue; }
      if (variant.availability !== 'available') fail(`${variant.productName} (${variant.sku}) is unavailable.`, 409);
      const reserved = await reservedQuantity(connection, item.variantId);
      if (variant.onHand - reserved < quantity) fail(`Not enough available stock for ${variant.productName} (${variant.sku}).`, 409);
      await connection.execute(
        "INSERT INTO inventory_reservations (order_id, order_item_id, variant_id, quantity, status) VALUES (?, ?, ?, ?, 'reserved')",
        [orderId, item.orderItemId, item.variantId, quantity],
      );
      await insertMovement(connection, { variant, type: 'reserve', reservedChange: quantity, onHandAfter: variant.onHand, reservedAfter: reserved + quantity, reason: 'Order placed', orderId, actorId });
      results.push({ orderItemId: String(item.orderItemId), reserved: true, quantity });
    }
  return { orderId: String(orderId), items: results };
}

async function closeOrderReservations(orderId, actorId, action) {
  return transaction((connection) => closeOrderReservationsInTransaction(connection, orderId, actorId, action));
}

async function closeOrderReservationsInTransaction(connection, orderId, actorId, action) {
    const [orders] = await connection.execute('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!orders[0]) fail('Order not found.', 404);
    const [reservations] = await connection.execute(
      `SELECT id, order_item_id AS orderItemId, variant_id AS variantId, quantity
       FROM inventory_reservations WHERE order_id = ? AND status = 'reserved' ORDER BY variant_id, id FOR UPDATE`, [orderId],
    );
    const results = [];
    for (const reservation of reservations) {
      if (!reservation.variantId) continue;
      const variant = await getVariantForUpdate(connection, reservation.variantId);
      const reserved = await reservedQuantity(connection, reservation.variantId);
      const quantity = Number(reservation.quantity);
      if (action === 'fulfill' && variant.onHand < quantity) fail(`Stock changed below the reserved quantity for ${variant.productName} (${variant.sku}).`, 409);
      const onHandChange = action === 'fulfill' ? -quantity : 0;
      const onHandAfter = variant.onHand + onHandChange;
      const reservedAfter = Math.max(0, reserved - quantity);
      await connection.execute('UPDATE inventory_reservations SET status = ? WHERE id = ?', [action === 'fulfill' ? 'fulfilled' : 'released', reservation.id]);
      if (action === 'fulfill') await connection.execute('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [onHandAfter, reservation.variantId]);
      await insertMovement(connection, { variant, type: action === 'fulfill' ? 'fulfill' : 'release', onHandChange, reservedChange: -quantity, onHandAfter, reservedAfter, reason: action === 'fulfill' ? 'Order fulfilled' : 'Order cancelled', orderId, actorId });
      results.push({ orderItemId: String(reservation.orderItemId), quantity, status: action === 'fulfill' ? 'fulfilled' : 'released' });
    }
  return { orderId: String(orderId), items: results };
}

export const releaseOrderInventoryInTransaction = (connection, orderId, actorId = null) => closeOrderReservationsInTransaction(connection, orderId, actorId, 'release');
export const fulfillOrderInventoryInTransaction = (connection, orderId, actorId = null) => closeOrderReservationsInTransaction(connection, orderId, actorId, 'fulfill');

export const releaseOrderInventory = (orderId, actorId = null) => closeOrderReservations(orderId, actorId, 'release');
export const fulfillOrderInventory = (orderId, actorId = null) => closeOrderReservations(orderId, actorId, 'fulfill');
