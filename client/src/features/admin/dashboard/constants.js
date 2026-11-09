/** Central place for ranges, thresholds and admin routes. */

export const RANGES = [
  { value: "today", label: "Today", long: "Today", compare: "yesterday", unit: "hour" },
  { value: "7d", label: "7 days", long: "Last 7 days", compare: "previous 7 days", unit: "day" },
  { value: "30d", label: "30 days", long: "Last 30 days", compare: "previous 30 days", unit: "day" },
  { value: "90d", label: "90 days", long: "Last 90 days", compare: "previous 90 days", unit: "day" },
];

export const DEFAULT_RANGE = "7d";

/** An item older than this is highlighted in "Needs attention". */
export const AGE_WARN_HOURS = 24;
export const AGE_CRITICAL_HOURS = 48;

/** A metal rate not updated within this many hours is flagged as stale. */
export const STALE_RATE_HOURS = 24;

/** Change these if your routes differ. */
export const adminPaths = {
  orders: "/admin/orders",
  order: (id) => `/admin/orders/${id}`,
  customRequests: "/admin/custom-requests",
  customRequest: (id) => `/admin/custom-requests/${id}`,
  products: "/admin/products",
  productEdit: (id) => `/admin/products/${id}/edit`,
  inventory: "/admin/inventory",
  metalRates: "/admin/metal-rates",
};

export const ORDER_STATUS = {
  pending: { label: "Pending", tone: "warning" },
  pending_payment: { label: "Awaiting payment", tone: "warning" },
  placed: { label: "New order", tone: "info" },
  payment_review: { label: "Payment to confirm", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "info" },
  processing: { label: "Processing", tone: "info" },
  shipped: { label: "Shipped", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const QUOTE_STATUS = {
  submitted: { label: "Awaiting review", tone: "warning" },
  reviewing: { label: "Under review", tone: "warning" },
  quoted: { label: "Quote sent", tone: "info" },
  awaiting_review: { label: "Awaiting review", tone: "warning" },
  quote_sent: { label: "Quote sent", tone: "info" },
  awaiting_customer: { label: "Awaiting customer", tone: "neutral" },
  converted: { label: "Converted to order", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  declined: { label: "Declined", tone: "danger" },
};
