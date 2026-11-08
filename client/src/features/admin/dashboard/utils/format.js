const TZ = "Asia/Karachi";

const numberFmt = new Intl.NumberFormat("en-PK");
const compactFmt = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TZ });
const dayLongFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});
const hourFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true, timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Intl throws on invalid dates, so every date formatter goes through this. */
const safe = (fmt, iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : fmt.format(d);
};

/* ------------------------------- Numbers -------------------------------- */

export const formatNumber = (v) => numberFmt.format(toNumber(v));
export const formatPKR = (v) => `PKR ${numberFmt.format(Math.round(toNumber(v)))}`;
export const formatCompact = (v) => compactFmt.format(toNumber(v));

/**
 * Percentage change between two periods.
 * Returns null when there is nothing meaningful to compare against.
 */
export function percentChange(current, previous) {
  if (previous === null || previous === undefined) return null;
  const cur = toNumber(current);
  const prev = toNumber(previous);
  if (prev === 0) return cur === 0 ? 0 : null;
  return ((cur - prev) / prev) * 100;
}

/* -------------------------------- Dates --------------------------------- */

export function ageInHours(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return Math.max(0, now - t) / 3_600_000;
}

/** "5m", "3h", "2d" */
export function formatAge(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const minutes = Math.floor(Math.max(0, now - t) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** "5m ago", "3h ago", "Just now" */
export function formatAgo(iso, now = Date.now()) {
  const age = formatAge(iso, now);
  return age === "Just now" || age === "—" ? age : `${age} ago`;
}

export const formatTime = (iso) => safe(timeFmt, iso);
export const formatDateTime = (iso) => safe(dateTimeFmt, iso);

/** Axis label: "8 Nov" or "2 PM". */
export const formatAxisLabel = (iso, granularity) =>
  safe(granularity === "hour" ? hourFmt : dayFmt, iso);

/** Tooltip/table label: "Sun, 8 Nov" or "2:00 PM". */
export const formatPointLabel = (iso, granularity) =>
  granularity === "hour"
    ? safe(timeFmt, iso)
    : safe(dayLongFmt, iso);
