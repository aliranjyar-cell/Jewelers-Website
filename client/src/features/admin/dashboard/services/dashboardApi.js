/**
 * Dashboard data access.
 *
 * Expected endpoint:  GET {VITE_API_URL}/api/admin/dashboard?range=today|7d|30d|90d
 * Auth:               session cookie (credentials: "include")
 *
 * Response shape (every field is optional — missing parts render as empty states):
 * {
 *   generatedAt: ISO string,
 *   range: "7d",
 *   granularity: "day" | "hour",
 *   summary: {
 *     revenue:  { paid, pending, pendingOrders, previousPaid },
 *     orders:   { total, needingAction, previousTotal },
 *     averageOrderValue: { value, previousValue },
 *     customers: { new, previousNew }
 *   },
 *   series:         [{ date: ISO, revenue, orders }],   // revenue = PAID orders only
 *   previousSeries: [{ revenue, orders }],              // same length as `series`
 *   attention: {
 *     counts: { new_order, payment, fulfilment, custom_request },
 *     items: [{ id, type, reference, customer, amount, status, quoteStatus, createdAt }]
 *   },
 *   stock: {
 *     counts: { out_of_stock, low_stock, draft, incomplete },
 *     items: [{ id, type, name, image, variant, stock, threshold, missing: [] }]
 *   },
 *   metalRates: [{ id, metal: "gold"|"silver", purity, unit, rate, updatedAt }],
 *   topProducts: [{ id, name, image, units, revenue }],
 *   recent: {
 *     orders:         [{ id, kind, reference, customer, status, amount, at }],
 *     customRequests: [{ id, kind, reference, customer, status, at }]
 *   }
 * }
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const numOrNull = (v) =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);

/** Fills defaults so a partial API response can never crash a component. */
export function normalizeDashboard(raw = {}, range = "7d") {
  const s = raw.summary ?? {};
  return {
    generatedAt: raw.generatedAt ?? null,
    range: raw.range ?? range,
    granularity: raw.granularity === "hour" ? "hour" : "day",
    summary: {
      revenue: {
        paid: num(s.revenue?.paid),
        pending: num(s.revenue?.pending),
        pendingOrders: num(s.revenue?.pendingOrders),
        previousPaid: numOrNull(s.revenue?.previousPaid),
      },
      orders: {
        total: num(s.orders?.total),
        needingAction: num(s.orders?.needingAction),
        previousTotal: numOrNull(s.orders?.previousTotal),
      },
      averageOrderValue: {
        value: num(s.averageOrderValue?.value),
        previousValue: numOrNull(s.averageOrderValue?.previousValue),
      },
      customers: {
        new: num(s.customers?.new),
        previousNew: numOrNull(s.customers?.previousNew),
      },
    },
    series: arr(raw.series).map((p) => ({
      date: p.date,
      revenue: num(p.revenue),
      orders: num(p.orders),
    })),
    previousSeries: arr(raw.previousSeries).map((p) => ({
      revenue: num(p.revenue),
      orders: num(p.orders),
    })),
    attention: {
      counts: raw.attention?.counts ?? null,
      items: arr(raw.attention?.items),
    },
    stock: {
      counts: raw.stock?.counts ?? null,
      items: arr(raw.stock?.items),
    },
    metalRates: arr(raw.metalRates),
    topProducts: arr(raw.topProducts).map((p) => ({
      ...p,
      units: num(p.units),
      revenue: num(p.revenue),
    })),
    recent: {
      orders: arr(raw.recent?.orders),
      customRequests: arr(raw.recent?.customRequests),
    },
  };
}

export async function fetchDashboard(range, { signal } = {}) {
  // Dev-only preview data. `import.meta.env.DEV` is false in production builds,
  // so this branch (and the mock file) is removed from the bundle entirely.
  if (import.meta.env.DEV && import.meta.env.VITE_DASHBOARD_MOCK === "true") {
    const { buildMockDashboard } = await import("../mocks/dashboardMock.js");
    return normalizeDashboard(buildMockDashboard(range), range);
  }

  const response = await fetch(
    `${API_BASE}/api/admin/dashboard?range=${encodeURIComponent(range)}`,
    { credentials: "include", headers: { Accept: "application/json" }, signal }
  );

  if (response.status === 401 || response.status === 403) {
    const error = new Error("Your session has expired. Please sign in again.");
    error.status = response.status === 401 ? 401 : 403;
    throw error;
  }
  if (!response.ok) {
    const error = new Error("The dashboard could not be loaded. Please try again.");
    error.status = response.status;
    throw error;
  }

  return normalizeDashboard(await response.json(), range);
}
