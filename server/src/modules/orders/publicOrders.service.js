import { randomBytes } from 'node:crypto';
import { pool } from '../../config/database.js';
import { reserveOrderInventoryInTransaction } from '../inventory/inventory.service.js';

const MAX_CART_LINES = 40;
const MAX_LINE_QUANTITY = 20;
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function text(value, label, max, required = false) {
  const result = String(value ?? '').trim();
  if (required && !result) fail(`${label} is required.`);
  if (result.length > max) fail(`${label} must be ${max} characters or fewer.`);
  return result || null;
}
function decimal(value) { return Math.round(Number(value) * 100) / 100; }

function validateItems(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_CART_LINES) fail('Your bag must contain between 1 and 40 different items.');
  const combined = new Map();
  for (const line of input) {
    const variantId = String(line?.variantId ?? '').trim();
    const quantity = Number(line?.quantity);
    if (!/^\d{1,20}$/.test(variantId) || BigInt(variantId) < 1n) fail('The bag contains an invalid product option.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) fail(`Each quantity must be between 1 and ${MAX_LINE_QUANTITY}.`);
    const next = (combined.get(variantId) || 0) + quantity;
    if (next > MAX_LINE_QUANTITY) fail(`Each product option is limited to ${MAX_LINE_QUANTITY} per order.`);
    combined.set(variantId, next);
  }
  return [...combined].map(([variantId, quantity]) => ({ variantId, quantity })).sort((a, b) => BigInt(a.variantId) < BigInt(b.variantId) ? -1 : 1);
}

async function loadPricedItems(connection, lines) {
  const items = [];
  for (const line of lines) {
    const [rows] = await connection.execute(
      `SELECT v.id AS variantId, v.product_id AS productId, v.sku, v.option_label AS optionLabel,
       v.weight_grams AS weightGrams, v.pricing_mode AS pricingMode, v.fixed_price_pkr AS fixedPrice,
       v.making_charge_type AS makingChargeType, v.making_charge_pkr AS makingCharge,
       v.stock_quantity AS stockQuantity, v.availability, p.name AS productName, p.slug AS productSlug,
       p.metal_type AS metalType, p.purity
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ? AND p.status = 'published' LIMIT 1 FOR UPDATE`, [line.variantId],
    );
    const variant = rows[0];
    if (!variant) fail('One of the selected products is no longer available. Refresh your bag and try again.', 409);
    if (variant.availability === 'unavailable') fail(`${variant.productName} (${variant.optionLabel || variant.sku}) is currently unavailable.`, 409);
    if (!['available', 'made_to_order'].includes(variant.availability)) fail(`${variant.productName} cannot be ordered right now.`, 409);

    if (variant.availability === 'available') {
      const [reservedRows] = await connection.execute("SELECT COALESCE(SUM(quantity), 0) AS quantity FROM inventory_reservations WHERE variant_id = ? AND status = 'reserved'", [variant.variantId]);
      const available = Math.max(0, Number(variant.stockQuantity) - Number(reservedRows[0]?.quantity || 0));
      if (available < line.quantity) fail(`${variant.productName} has only ${available} available. Update the quantity and try again.`, 409);
    }

    let unitPrice = variant.fixedPrice == null ? null : Number(variant.fixedPrice);
    let metalRate = null;
    const weight = variant.weightGrams == null ? null : Number(variant.weightGrams);
    const makingCharge = Number(variant.makingCharge || 0);
    if (variant.pricingMode === 'metal_weight') {
      if (!weight || weight <= 0 || !['gold', 'silver'].includes(variant.metalType) || !variant.purity) fail(`${variant.productName} is missing pricing details. Please contact the store.`, 409);
      const [rates] = await connection.execute(
        'SELECT rate_per_gram_pkr AS rate FROM metal_rates WHERE metal_type = ? AND purity = ? ORDER BY effective_at DESC, id DESC LIMIT 1',
        [variant.metalType, variant.purity],
      );
      if (!rates[0]) fail(`The current ${variant.metalType} ${variant.purity} rate is not available. Please contact the store.`, 409);
      metalRate = Number(rates[0].rate);
      const makingTotal = variant.makingChargeType === 'per_gram' ? makingCharge * weight : makingCharge;
      unitPrice = decimal(metalRate * weight + makingTotal);
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) fail(`${variant.productName} does not have a valid price. Please contact the store.`, 409);
    const [imageRows] = await connection.execute('SELECT image_url AS image FROM product_images WHERE product_id = ? ORDER BY sort_order, id LIMIT 1', [variant.productId]);
    items.push({
      ...line, ...variant, productId: String(variant.productId), variantId: String(variant.variantId),
      weightGrams: weight, unitPrice: decimal(unitPrice), lineTotal: decimal(unitPrice * line.quantity),
      metalRate, makingCharge, image: imageRows[0]?.image || null,
    });
  }
  return items;
}

async function withConnection(work, { rollback = false } = {}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    if (rollback) await connection.rollback(); else await connection.commit();
    return result;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

function summarize(items) {
  const subtotal = decimal(items.reduce((sum, item) => sum + item.lineTotal, 0));
  if (!Number.isFinite(subtotal) || subtotal <= 0 || subtotal > 9999999999.99) fail('The order total is outside the supported price range.');
  return { items, subtotal, deliveryFee: null, total: null, deliveryFeeConfirmed: false };
}

export async function previewOrderFromStorefront(input) {
  const lines = validateItems(input.items);
  return withConnection(async (connection) => summarize(await loadPricedItems(connection, lines)), { rollback: true });
}

function validateCustomer(input) {
  const recipientName = text(input.recipientName, 'Recipient name', 160, true);
  const email = text(input.email, 'Email', 254)?.toLowerCase() || null;
  const phone = text(input.phone, 'Phone', 32, true);
  const addressLine1 = text(input.addressLine1, 'Address', 255, true);
  const addressLine2 = text(input.addressLine2, 'Address line 2', 255);
  const city = text(input.city, 'City', 100, true);
  const province = text(input.province, 'Province', 100, true);
  const postalCode = text(input.postalCode, 'Postal code', 20);
  const customerNote = text(input.note, 'Delivery instructions', 2000);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email address.');
  if (!/[0-9]/.test(phone) || phone.replace(/\D/g, '').length < 7) fail('Enter a valid phone number so the store can confirm your order.');
  return { recipientName, email, phone, addressLine1, addressLine2, city, province, postalCode, customerNote };
}

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ZJ-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createOrderFromStorefront(input, customerId) {
  if (!customerId) fail('Sign in or create an account before placing an order.', 401);
  const lines = validateItems(input.items);
  const customer = validateCustomer(input);
  const paymentMethod = String(input.paymentMethod || '').trim().toLowerCase();
  if (paymentMethod !== 'easypaisa') fail('Select Easypaisa as your payment method to continue.');
  if (!Array.isArray(input.expectedItems)) fail('Review the current price summary before submitting your order.');
  return withConnection(async (connection) => {
    const [[account]] = await connection.execute(
      "SELECT id, email, phone, role, is_active FROM users WHERE id = ? LIMIT 1 FOR UPDATE", [customerId],
    );
    if (!account || account.role !== 'customer' || !account.is_active) fail('Your customer account could not be verified. Sign in again.', 401);
    const items = await loadPricedItems(connection, lines);
    const quote = summarize(items);
    const expected = new Map(input.expectedItems.map((item) => [String(item.variantId), item]));
    if (expected.size !== items.length || items.some((item) => {
      const reviewed = expected.get(item.variantId);
      return !reviewed || !Number.isFinite(Number(reviewed.unitPrice)) || decimal(reviewed.unitPrice) !== item.unitPrice
        || String(reviewed.productName || '') !== item.productName || String(reviewed.optionLabel || '') !== item.optionLabel
        || (reviewed.metalRate == null ? null : decimal(reviewed.metalRate)) !== item.metalRate;
    })) {
      fail('A product price changed since you reviewed your bag. Please check the updated summary and submit again.', 409);
    }
    const reference = orderNumber();
    const addressSnapshot = {
      recipient_name: customer.recipientName, phone: customer.phone,
      address_line1: customer.addressLine1, address_line2: customer.addressLine2,
      city: customer.city, province: customer.province, postal_code: customer.postalCode,
    };
    const [inserted] = await connection.execute(
      `INSERT INTO orders (order_number, user_id, status, payment_status, currency, subtotal_pkr,
       delivery_fee_pkr, discount_pkr, total_pkr, recipient_name, phone, address_snapshot,
       customer_note, delivery_fee_confirmed)
       VALUES (?, ?, 'placed', 'pending', 'PKR', ?, 0, 0, ?, ?, ?, ?, ?, 0)`,
      [reference, customerId, quote.subtotal, quote.subtotal, customer.recipientName, customer.phone, JSON.stringify(addressSnapshot), customer.customerNote],
    );
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name_snapshot, sku_snapshot,
         option_snapshot, metal_type_snapshot, purity_snapshot, weight_grams_snapshot, metal_rate_pkr_snapshot,
         making_charge_type_snapshot, making_charge_pkr_snapshot, unit_price_pkr, quantity, line_total_pkr)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [inserted.insertId, item.productId, item.variantId, item.productName, item.sku, item.optionLabel,
          item.metalType, item.purity, item.weightGrams, item.metalRate, item.makingChargeType,
          item.makingCharge, item.unitPrice, item.quantity, item.lineTotal],
      );
    }
    await connection.execute(
      `INSERT INTO payment_transactions (order_id, provider, status, amount_pkr)
       VALUES (?, 'easypaisa', 'pending', ?)`, [inserted.insertId, quote.subtotal],
    );
    const reservation = await reserveOrderInventoryInTransaction(connection, String(inserted.insertId));
    await connection.execute(
      `INSERT INTO order_events (order_id, actor_id, event_type, from_value, to_value, note, metadata)
       VALUES (?, NULL, 'placed', NULL, 'placed', ?, ?)`,
      [inserted.insertId, 'Customer submitted the order using Easypaisa. Payment instructions and delivery fee require confirmation.', JSON.stringify({ paymentMethod: 'easypaisa', reservedLines: reservation.items.filter((item) => item.reserved).length })],
    );
    return { id: String(inserted.insertId), orderNumber: reference, status: 'placed', paymentStatus: 'pending', paymentMethod: 'easypaisa', subtotal: quote.subtotal, deliveryFee: null, total: null, deliveryFeeConfirmed: false, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
  });
}
