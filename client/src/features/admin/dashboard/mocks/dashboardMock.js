/**
 * DEVELOPMENT-ONLY preview data.
 *
 * Loaded only when running `vite` (dev) AND VITE_DASHBOARD_MOCK=true is set in
 * client/.env.local. In production builds `import.meta.env.DEV` is false, so
 * this file is never bundled and the dashboard shows real data or empty states.
 * Everything below is fictional.
 */

const HOUR = 3_600_000;
const DAYS = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildMockDashboard(range = "7d") {
  const now = Date.now();
  const hourly = range === "today";
  const days = DAYS[range] ?? 7;
  const rand = rng(days * 7919);
  const n = hourly ? new Date().getHours() + 1 : days;

  const point = (date) => {
    const orders = Math.round(rand() * (hourly ? 2 : 6));
    const revenue = orders ? Math.round(((45 + rand() * 140) * orders) / 1) * 1000 : 0;
    return { date, orders, revenue };
  };

  const series = Array.from({ length: n }, (_, i) => {
    const d = new Date();
    if (hourly) d.setHours(i, 0, 0, 0);
    else {
      d.setDate(d.getDate() - (n - 1 - i));
      d.setHours(0, 0, 0, 0);
    }
    return point(d.toISOString());
  });
  const previousSeries = series.map(() => {
    const { orders, revenue } = point("");
    return { orders, revenue };
  });

  const sum = (list, key) => list.reduce((a, p) => a + p[key], 0);
  const paid = sum(series, "revenue");
  const orders = sum(series, "orders");
  const ago = (hours) => new Date(now - hours * HOUR).toISOString();

  return {
    generatedAt: new Date(now).toISOString(),
    range,
    granularity: hourly ? "hour" : "day",
    summary: {
      revenue: {
        paid,
        pending: Math.round(paid * 0.18),
        pendingOrders: 3,
        previousPaid: sum(previousSeries, "revenue"),
      },
      orders: { total: orders, needingAction: 6, previousTotal: sum(previousSeries, "orders") },
      averageOrderValue: {
        value: orders ? Math.round(paid / orders) : 0,
        previousValue: 82000,
      },
      customers: { new: Math.max(1, Math.round(orders * 0.6)), previousNew: Math.round(orders * 0.5) },
    },
    series,
    previousSeries,
    attention: {
      counts: { new_order: 2, payment: 2, fulfilment: 3, custom_request: 2 },
      items: [
        { id: "1042", type: "new_order", reference: "#1042", customer: "Ayesha Khan", amount: 185000, status: "pending", createdAt: ago(1.5) },
        { id: "1041", type: "new_order", reference: "#1041", customer: "Bilal Ahmed", amount: 92500, status: "pending", createdAt: ago(5) },
        { id: "1038", type: "payment", reference: "#1038", customer: "Sana Malik", amount: 264000, status: "payment_review", createdAt: ago(27) },
        { id: "1036", type: "payment", reference: "#1036", customer: "Hamza Tariq", amount: 58000, status: "payment_review", createdAt: ago(53) },
        { id: "1031", type: "fulfilment", reference: "#1031", customer: "Mehwish Raza", amount: 142000, status: "preparing", createdAt: ago(30) },
        { id: "1029", type: "fulfilment", reference: "#1029", customer: "Usman Ali", amount: 76000, status: "shipped", createdAt: ago(20) },
        { id: "CR-14", type: "custom_request", reference: "CR-14", customer: "Noor Fatima", amount: null, quoteStatus: "awaiting_review", createdAt: ago(8) },
        { id: "CR-12", type: "custom_request", reference: "CR-12", customer: "Imran Sheikh", amount: null, quoteStatus: "awaiting_review", createdAt: ago(60) },
      ],
    },
    stock: {
      counts: { out_of_stock: 2, low_stock: 3, draft: 2, incomplete: 2 },
      items: [
        { id: "p1", type: "out_of_stock", name: "Gold Jhumka Earrings", variant: "22K" },
        { id: "p2", type: "out_of_stock", name: "Silver Anklet Set" },
        { id: "p3", type: "low_stock", name: "Diamond Solitaire Ring", variant: "Size 7", stock: 1, threshold: 3 },
        { id: "p4", type: "low_stock", name: "Pearl Necklace", variant: "18 in", stock: 2, threshold: 3 },
        { id: "p5", type: "low_stock", name: "Gold Bangles (Pair)", variant: "2.6", stock: 2, threshold: 5 },
        { id: "p6", type: "draft", name: "Bridal Kundan Set" },
        { id: "p7", type: "draft", name: "Rose Gold Pendant" },
        { id: "p8", type: "incomplete", name: "Emerald Studs", missing: ["images", "weight"] },
        { id: "p9", type: "incomplete", name: "Silver Ring (Plain)", missing: ["description"] },
      ],
    },
    metalRates: [
      { id: "g24", metal: "gold", purity: "24K", unit: "tola", rate: 412500, updatedAt: ago(3) },
      { id: "g22", metal: "gold", purity: "22K", unit: "tola", rate: 378000, updatedAt: ago(3) },
      { id: "g21", metal: "gold", purity: "21K", unit: "tola", rate: 361000, updatedAt: ago(50) },
      { id: "g18", metal: "gold", purity: "18K", unit: "tola", rate: null, updatedAt: null },
      { id: "s999", metal: "silver", purity: "999", unit: "tola", rate: 5150, updatedAt: ago(3) },
      { id: "s925", metal: "silver", purity: "925", unit: "tola", rate: 4760, updatedAt: ago(3) },
    ],
    topProducts: [
      { id: "p10", name: "Gold Bangles (Pair)", units: 14, revenue: 1860000 },
      { id: "p11", name: "Diamond Solitaire Ring", units: 6, revenue: 1450000 },
      { id: "p12", name: "Pearl Necklace", units: 11, revenue: 690000 },
      { id: "p13", name: "Silver Chain", units: 19, revenue: 410000 },
      { id: "p14", name: "Gold Nose Pin", units: 22, revenue: 330000 },
    ],
    recent: {
      orders: [
        { id: "1042", kind: "placed", reference: "#1042", customer: "Ayesha Khan", status: "pending", amount: 185000, at: ago(1.5) },
        { id: "1040", kind: "paid", reference: "#1040", customer: "Zainab Noor", status: "confirmed", amount: 98000, at: ago(3) },
        { id: "1029", kind: "status_changed", reference: "#1029", customer: "Usman Ali", status: "shipped", amount: 76000, at: ago(20) },
        { id: "1025", kind: "status_changed", reference: "#1025", customer: "Farah Iqbal", status: "delivered", amount: 54000, at: ago(26) },
      ],
      customRequests: [
        { id: "CR-14", kind: "received", reference: "CR-14", customer: "Noor Fatima", status: "awaiting_review", at: ago(8) },
        { id: "CR-11", kind: "quote_sent", reference: "CR-11", customer: "Kamran Butt", status: "quote_sent", at: ago(22) },
        { id: "CR-09", kind: "quote_accepted", reference: "CR-09", customer: "Rabia Aslam", status: "accepted", at: ago(40) },
      ],
    },
  };
}
