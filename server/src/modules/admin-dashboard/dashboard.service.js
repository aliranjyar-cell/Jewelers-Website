import { pool } from '../../config/database.js';

const TIME_ZONE = 'Asia/Karachi';
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };
const STOCK_THRESHOLD = 3;

function localDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map(({ type, value }) => [type, value]));
}
function localHour(date = new Date()) {
  return number(new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23',
  }).format(date));
}

function dateString({ year, month, day }) { return `${year}-${month}-${day}`; }
function shiftDay(value, amount) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
function mysqlTime(day, hour = 0) { return `${day} ${String(hour).padStart(2, '0')}:00:00`; }
function isoPoint(day, hour) {
  return new Date(`${day}T${String(hour).padStart(2, '0')}:00:00+05:00`).toISOString();
}
function number(value) { return Number(value ?? 0) || 0; }

function periodFor(range) {
  const today = dateString(localDateParts());
  if (range === 'today') {
    const currentHour = localHour();
    const yesterday = shiftDay(today, -1);
    return {
      granularity: 'hour',
      currentStart: mysqlTime(today),
      currentEnd: currentHour === 23 ? mysqlTime(shiftDay(today, 1)) : mysqlTime(today, currentHour + 1),
      previousStart: mysqlTime(yesterday),
      previousEnd: currentHour === 23 ? mysqlTime(today) : mysqlTime(yesterday, currentHour + 1),
      currentDay: today,
      previousDay: yesterday,
      currentHour,
      days: 1,
    };
  }
  const days = RANGE_DAYS[range];
  const currentStartDay = shiftDay(today, -(days - 1));
  const previousStartDay = shiftDay(currentStartDay, -days);
  return {
    granularity: 'day',
    currentStart: mysqlTime(currentStartDay),
    currentEnd: mysqlTime(shiftDay(today, 1)),
    previousStart: mysqlTime(previousStartDay),
    previousEnd: mysqlTime(currentStartDay),
    currentStartDay,
    previousStartDay,
    currentDay: today,
    days,
  };
}

async function getSummary(period) {
  const [rows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN created_at >= ? AND created_at < ? AND payment_status = 'paid' THEN total_pkr ELSE 0 END) AS paid_current,
       SUM(CASE WHEN created_at >= ? AND created_at < ? AND payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders_current,
       SUM(CASE WHEN created_at >= ? AND created_at < ? AND payment_status IN ('unpaid', 'pending') AND status NOT IN ('cancelled', 'refunded') THEN total_pkr ELSE 0 END) AS pending_current,
       SUM(CASE WHEN created_at >= ? AND created_at < ? AND payment_status IN ('unpaid', 'pending') AND status NOT IN ('cancelled', 'refunded') THEN 1 ELSE 0 END) AS pending_orders_current,
       SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS orders_current,
       SUM(CASE WHEN created_at >= ? AND created_at < ? AND payment_status = 'paid' THEN total_pkr ELSE 0 END) AS paid_previous,
       SUM(CASE WHEN created_at >= ? AND created_at < ? AND payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders_previous,
       SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS orders_previous
     FROM orders WHERE created_at >= ? AND created_at < ?`,
    [
      period.currentStart, period.currentEnd,
      period.currentStart, period.currentEnd,
      period.currentStart, period.currentEnd,
      period.currentStart, period.currentEnd,
      period.currentStart, period.currentEnd,
      period.previousStart, period.previousEnd,
      period.previousStart, period.previousEnd,
      period.previousStart, period.previousEnd,
      period.previousStart, period.currentEnd,
    ],
  );
  const row = rows[0] ?? {};

  const [customerRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS customers_current,
       SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS customers_previous
     FROM users WHERE role = 'customer' AND created_at >= ? AND created_at < ?`,
    [period.currentStart, period.currentEnd, period.previousStart, period.previousEnd, period.previousStart, period.currentEnd],
  );
  const customers = customerRows[0] ?? {};
  const paidCurrent = number(row.paid_current);
  const paidPrevious = number(row.paid_previous);
  const paidOrdersCurrent = number(row.paid_orders_current);
  const paidOrdersPrevious = number(row.paid_orders_previous);
  const attention = await getAttention();

  return {
    revenue: {
      paid: paidCurrent,
      pending: number(row.pending_current),
      pendingOrders: number(row.pending_orders_current),
      previousPaid: paidPrevious,
    },
    orders: {
      total: number(row.orders_current),
      needingAction: attention.counts.new_order + attention.counts.payment + attention.counts.fulfilment,
      previousTotal: number(row.orders_previous),
    },
    averageOrderValue: {
      value: paidOrdersCurrent ? paidCurrent / paidOrdersCurrent : 0,
      previousValue: paidOrdersPrevious ? paidPrevious / paidOrdersPrevious : 0,
    },
    customers: {
      new: number(customers.customers_current),
      previousNew: number(customers.customers_previous),
    },
    attention,
  };
}

async function getSeries(period, start, end, hourly) {
  const group = hourly ? 'HOUR(created_at)' : 'DATE_FORMAT(created_at, \'%Y-%m-%d\')';
  const [rows] = await pool.execute(
    `SELECT ${group} AS bucket,
            SUM(CASE WHEN payment_status = 'paid' THEN total_pkr ELSE 0 END) AS revenue,
            COUNT(*) AS orders
     FROM orders WHERE created_at >= ? AND created_at < ?
     GROUP BY ${group} ORDER BY bucket`,
    [start, end],
  );
  const byBucket = new Map(rows.map((row) => [String(row.bucket), row]));

  if (hourly) {
    return Array.from({ length: period.currentHour + 1 }, (_, hour) => {
      const row = byBucket.get(String(hour)) ?? {};
      const day = start.slice(0, 10);
      return { date: isoPoint(day, hour), revenue: number(row.revenue), orders: number(row.orders) };
    });
  }
  return Array.from({ length: period.days }, (_, index) => {
    const day = shiftDay(start.slice(0, 10), index);
    const row = byBucket.get(day) ?? {};
    return { date: isoPoint(day, 0), revenue: number(row.revenue), orders: number(row.orders) };
  });
}

async function getAttention() {
  const [orderCounts] = await pool.execute(
    `SELECT
       SUM(CASE WHEN status = 'placed' THEN 1 ELSE 0 END) AS new_order,
       SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) AS payment,
       SUM(CASE WHEN status IN ('confirmed', 'processing') THEN 1 ELSE 0 END) AS fulfilment
     FROM orders WHERE status IN ('placed', 'pending_payment', 'confirmed', 'processing')`,
  );
  const [requestCounts] = await pool.execute(
    `SELECT COUNT(*) AS custom_request FROM custom_order_requests WHERE status IN ('submitted', 'reviewing')`,
  );
  const counts = {
    new_order: number(orderCounts[0]?.new_order),
    payment: number(orderCounts[0]?.payment),
    fulfilment: number(orderCounts[0]?.fulfilment),
    custom_request: number(requestCounts[0]?.custom_request),
  };

  const [[orderRows], [requestRows]] = await Promise.all([
    pool.execute(
      `SELECT o.id, o.order_number, o.total_pkr, o.status, o.created_at, u.full_name AS customer,
              CASE
                WHEN o.status = 'placed' THEN 'new_order'
                WHEN o.status = 'pending_payment' THEN 'payment'
                ELSE 'fulfilment'
              END AS attention_type
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.status IN ('placed', 'pending_payment', 'confirmed', 'processing')
       ORDER BY o.created_at ASC LIMIT 30`,
    ),
    pool.execute(
      `SELECT r.id, r.request_number, r.status, r.created_at, u.full_name AS customer
       FROM custom_order_requests r JOIN users u ON u.id = r.user_id
       WHERE r.status IN ('submitted', 'reviewing')
       ORDER BY r.created_at ASC LIMIT 30`,
    ),
  ]);

  const orderItems = orderRows.map((row) => ({
    id: String(row.id),
    type: row.attention_type,
    reference: `#${row.order_number}`,
    customer: row.customer,
    amount: number(row.total_pkr),
    status: row.attention_type === 'payment' ? 'payment_review' : row.status,
    createdAt: row.created_at,
  }));
  const requestItems = requestRows.map((row) => ({
    id: String(row.id),
    type: 'custom_request',
    reference: row.request_number,
    customer: row.customer,
    amount: null,
    quoteStatus: 'awaiting_review',
    createdAt: row.created_at,
  }));
  const items = [...orderItems, ...requestItems].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(0, 40);
  return { counts, items };
}

async function getStock() {
  const noSellableVariant = `NOT EXISTS (
    SELECT 1 FROM product_variants v WHERE v.product_id = p.id
      AND ((v.pricing_mode = 'fixed' AND v.fixed_price_pkr IS NOT NULL)
        OR (v.pricing_mode = 'metal_weight' AND v.weight_grams > 0))
  )`;
  const incompleteCondition = `(
    p.description IS NULL OR TRIM(p.description) = ''
    OR p.category_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
    OR (p.product_mode <> 'custom_made' AND ${noSellableVariant})
    OR (p.metal_type IN ('gold', 'silver') AND (p.purity IS NULL OR TRIM(p.purity) = ''))
    OR EXISTS (SELECT 1 FROM product_variants vw WHERE vw.product_id = p.id AND vw.pricing_mode = 'metal_weight' AND (vw.weight_grams IS NULL OR vw.weight_grams <= 0))
  )`;

  const [countsResult, outResult, lowResult, draftResult, incompleteResult] = await Promise.all([
    pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM product_variants v WHERE v.is_available = 1 AND v.availability <> 'made_to_order' AND v.stock_quantity = 0) AS out_of_stock,
         (SELECT COUNT(*) FROM product_variants v WHERE v.is_available = 1 AND v.availability <> 'made_to_order' AND v.stock_quantity BETWEEN 1 AND ?) AS low_stock,
         (SELECT COUNT(*) FROM products WHERE status = 'draft') AS draft,
         (SELECT COUNT(*) FROM products p WHERE ${incompleteCondition}) AS incomplete`,
      [STOCK_THRESHOLD],
    ),
    pool.execute(
      `SELECT p.id, p.name, pvi.image_url AS image, COALESCE(v.option_label, v.sku) AS variant, v.stock_quantity AS stock
       FROM product_variants v JOIN products p ON p.id = v.product_id
       LEFT JOIN product_images pvi ON pvi.product_id = p.id AND pvi.sort_order = (SELECT MIN(pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id)
       WHERE v.is_available = 1 AND v.availability <> 'made_to_order' AND v.stock_quantity = 0 ORDER BY v.updated_at DESC LIMIT 5`,
    ),
    pool.execute(
      `SELECT p.id, p.name, pvi.image_url AS image, COALESCE(v.option_label, v.sku) AS variant, v.stock_quantity AS stock
       FROM product_variants v JOIN products p ON p.id = v.product_id
       LEFT JOIN product_images pvi ON pvi.product_id = p.id AND pvi.sort_order = (SELECT MIN(pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id)
       WHERE v.is_available = 1 AND v.availability <> 'made_to_order' AND v.stock_quantity BETWEEN 1 AND ? ORDER BY v.stock_quantity ASC, v.updated_at DESC LIMIT 5`,
      [STOCK_THRESHOLD],
    ),
    pool.execute(
      `SELECT p.id, p.name, pvi.image_url AS image
       FROM products p
       LEFT JOIN product_images pvi ON pvi.product_id = p.id AND pvi.sort_order = (SELECT MIN(pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id)
       WHERE p.status = 'draft' ORDER BY p.updated_at DESC LIMIT 5`,
    ),
    pool.execute(
      `SELECT p.id, p.name, pvi.image_url AS image, p.product_mode, p.metal_type, p.purity, p.description, p.category_id,
              EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) AS has_image,
              EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id = p.id) AS has_variant,
              EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.pricing_mode = 'metal_weight' AND (v.weight_grams IS NULL OR v.weight_grams <= 0)) AS missing_weight
       FROM products p
       LEFT JOIN product_images pvi ON pvi.product_id = p.id AND pvi.sort_order = (SELECT MIN(pi.sort_order) FROM product_images pi WHERE pi.product_id = p.id)
       WHERE ${incompleteCondition} ORDER BY p.updated_at DESC LIMIT 5`,
    ),
  ]);
  const counts = countsResult[0][0];
  const productItems = (rows) => rows.map((row) => ({
    id: String(row.id), name: row.name, image: row.image || null,
  }));
  const incompleteItems = incompleteResult[0].map((row) => {
    const missing = [];
    if (!row.has_image) missing.push('images');
    if (!row.description?.trim()) missing.push('description');
    if (!row.category_id) missing.push('category');
    if (row.product_mode !== 'custom_made' && !row.has_variant) missing.push('sku', 'price');
    if (['gold', 'silver'].includes(row.metal_type) && !row.purity?.trim()) missing.push('purity');
    if (row.missing_weight) missing.push('weight');
    return { id: String(row.id), name: row.name, image: row.image || null, type: 'incomplete', missing };
  });
  const variantItems = (rows, type) => rows.map((row) => ({
    id: String(row.id), type, name: row.name, image: row.image || null,
    variant: row.variant || null, stock: number(row.stock), threshold: STOCK_THRESHOLD,
  }));
  return {
    counts: {
      out_of_stock: number(counts.out_of_stock), low_stock: number(counts.low_stock),
      draft: number(counts.draft), incomplete: number(counts.incomplete),
    },
    items: [
      ...variantItems(outResult[0], 'out_of_stock'),
      ...variantItems(lowResult[0], 'low_stock'),
      ...productItems(draftResult[0]).map((item) => ({ ...item, type: 'draft' })),
      ...incompleteItems,
    ],
  };
}

async function getMetalRates() {
  const [rows] = await pool.execute(
    `SELECT mr.id, mr.metal_type AS metal, mr.purity, mr.rate_per_gram_pkr AS rate,
            mr.effective_at AS updatedAt, 'gram' AS unit
     FROM metal_rates mr
     WHERE mr.effective_at = (
       SELECT MAX(latest.effective_at) FROM metal_rates latest
       WHERE latest.metal_type = mr.metal_type AND latest.purity = mr.purity
     )
     ORDER BY mr.metal_type, mr.purity`,
  );
  return rows.map((row) => ({ ...row, rate: number(row.rate) }));
}

async function getTopProducts(start, end) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(p.id, oi.product_id) AS id, oi.product_name_snapshot AS name,
            SUM(oi.quantity) AS units, SUM(oi.line_total_pkr) AS revenue
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.payment_status = 'paid' AND o.created_at >= ? AND o.created_at < ?
     GROUP BY COALESCE(p.id, oi.product_id), oi.product_name_snapshot
     ORDER BY revenue DESC LIMIT 5`,
    [start, end],
  );
  return rows.map((row) => ({ ...row, id: String(row.id), units: number(row.units), revenue: number(row.revenue) }));
}

async function getRecent() {
  const [[orders], [requests]] = await Promise.all([
    pool.execute(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.total_pkr AS amount,
              o.updated_at AS at, u.full_name AS customer,
              CASE
                WHEN o.status = 'cancelled' THEN 'cancelled'
                WHEN o.status = 'refunded' OR o.payment_status = 'refunded' THEN 'refunded'
                WHEN o.payment_status = 'paid' THEN 'paid'
                WHEN o.created_at = o.updated_at THEN 'placed'
                ELSE 'status_changed'
              END AS kind
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.updated_at DESC LIMIT 6`,
    ),
    pool.execute(
      `SELECT r.id, r.request_number, r.status, r.updated_at AS at, u.full_name AS customer,
              CASE r.status
                WHEN 'submitted' THEN 'received'
                WHEN 'quoted' THEN 'quote_sent'
                WHEN 'approved' THEN 'quote_accepted'
                WHEN 'rejected' THEN 'quote_declined'
                ELSE 'message'
              END AS kind
       FROM custom_order_requests r JOIN users u ON u.id = r.user_id
       ORDER BY r.updated_at DESC LIMIT 6`,
    ),
  ]);
  return {
    orders: orders.map((row) => ({ ...row, id: String(row.id), reference: `#${row.order_number}`, amount: number(row.amount) })),
    customRequests: requests.map((row) => ({ ...row, id: String(row.id), reference: row.request_number })),
  };
}

export async function getAdminDashboard(range) {
  if (range !== 'today' && !RANGE_DAYS[range]) {
    const error = new Error('Unsupported dashboard range');
    error.status = 400;
    throw error;
  }
  const period = periodFor(range);
  const [summary, series, previousSeries, stock, metalRates, topProducts, recent] = await Promise.all([
    getSummary(period),
    getSeries(period, period.currentStart, period.currentEnd, period.granularity === 'hour'),
    getSeries(period, period.previousStart, period.previousEnd, period.granularity === 'hour'),
    getStock(),
    getMetalRates(),
    getTopProducts(period.currentStart, period.currentEnd),
    getRecent(),
  ]);
  const { attention, ...summaryValues } = summary;
  return {
    generatedAt: new Date().toISOString(),
    range,
    granularity: period.granularity,
    summary: summaryValues,
    series,
    previousSeries,
    attention,
    stock,
    metalRates,
    topProducts,
    recent,
  };
}
