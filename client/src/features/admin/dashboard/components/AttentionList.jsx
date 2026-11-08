import { useMemo, useState } from "react";
import { Banknote, CircleCheck, Gem, ShoppingBag, Truck } from "lucide-react";
import useNow from "../hooks/useNow";
import {
  AGE_CRITICAL_HOURS,
  AGE_WARN_HOURS,
  ORDER_STATUS,
  QUOTE_STATUS,
  adminPaths,
} from "../constants";
import { ageInHours, formatAge, formatPKR } from "../utils/format";
import {
  ActionLink,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  IconTile,
  Segmented,
  Skeleton,
  TextLink,
} from "./ui";

/** Per-type presentation + where the action button goes. */
const TYPES = {
  new_order: {
    label: "New order",
    icon: ShoppingBag,
    tone: "info",
    action: "View order",
    href: (item) => adminPaths.order(item.id),
  },
  payment: {
    label: "Payment to confirm",
    icon: Banknote,
    tone: "warning",
    action: "Review payment",
    href: (item) => adminPaths.order(item.id),
  },
  fulfilment: {
    label: "In progress",
    icon: Truck,
    tone: "neutral",
    action: "View order",
    href: (item) => adminPaths.order(item.id),
  },
  custom_request: {
    label: "Custom request",
    icon: Gem,
    tone: "accent",
    action: "Review request",
    href: (item) => adminPaths.customRequest(item.id),
  },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new_order", label: "New" },
  { value: "payment", label: "Payments" },
  { value: "fulfilment", label: "In progress" },
  { value: "custom_request", label: "Custom" },
];

const MAX_ROWS = 6;

function ageTone(hours) {
  if (hours >= AGE_CRITICAL_HOURS) return "text-red-600 dark:text-red-400";
  if (hours >= AGE_WARN_HOURS) return "text-amber-600 dark:text-amber-400";
  return "text-neutral-400 dark:text-neutral-500";
}

export default function AttentionList({ attention, loading, className = "", delay = 0 }) {
  const [filter, setFilter] = useState("all");
  const now = useNow();

  const items = attention?.items ?? [];

  // Prefer server-side counts (the list may be truncated); fall back to the list.
  const counts = useMemo(() => {
    const result = { new_order: 0, payment: 0, fulfilment: 0, custom_request: 0 };
    if (attention?.counts) {
      Object.keys(result).forEach((k) => (result[k] = Number(attention.counts[k]) || 0));
    } else {
      items.forEach((item) => {
        if (result[item.type] !== undefined) result[item.type] += 1;
      });
    }
    return result;
  }, [attention, items]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const visible = useMemo(() => {
    return items
      .filter((item) => TYPES[item.type] && (filter === "all" || item.type === filter))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // oldest first
      .slice(0, MAX_ROWS);
  }, [items, filter]);

  const filterTotal = filter === "all" ? total : counts[filter];
  const viewAllHref = filter === "custom_request" ? adminPaths.customRequests : adminPaths.orders;

  return (
    <Card
      id="needs-attention"
      tone={total > 0 ? "highlight" : "default"}
      delay={delay}
      className={`scroll-mt-4 p-5 ${className}`}
    >
      <CardHeader
        title="Needs attention"
        subtitle="Oldest first — deal with these before anything else"
        badge={
          !loading && total > 0 ? (
            <Badge tone="accent" className="px-2.5 py-0.5 text-xs">
              {total}
            </Badge>
          ) : null
        }
      />

      <div className="mt-4">
        <Segmented
          label="Filter by type"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((f) => ({
            ...f,
            count: f.value === "all" ? total : counts[f.value],
          }))}
        />
      </div>

      {loading ? (
        <ul className="mt-4 space-y-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 !rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-7 w-20 !rounded-full" />
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={CircleCheck}
          tone="success"
          title="You’re all caught up"
          description={
            filter === "all"
              ? "No orders, payments or custom requests are waiting on you."
              : "Nothing waiting in this category."
          }
        />
      ) : (
        <>
          <ul className="mt-3 space-y-0.5">
            {visible.map((item) => (
              <Row key={`${item.type}-${item.id}`} item={item} now={now} />
            ))}
          </ul>
          {filterTotal > visible.length && (
            <div className="mt-3 flex justify-end">
              <TextLink to={viewAllHref}>View all {filterTotal}</TextLink>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function Row({ item, now }) {
  const type = TYPES[item.type];
  const hours = ageInHours(item.createdAt, now);
  const status = ORDER_STATUS[item.status];
  const quote = QUOTE_STATUS[item.quoteStatus];

  // Orders show an amount; custom requests show their quote state.
  const detail =
    item.amount !== null && item.amount !== undefined
      ? formatPKR(item.amount)
      : quote?.label ?? "Quote not started";

  return (
    <li className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors duration-200 hover:bg-neutral-50 dark:hover:bg-white/5">
      <IconTile icon={type.icon} tone={type.tone} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
            {item.reference}
          </p>
          <Badge tone={status?.tone ?? type.tone}>{status?.label ?? type.label}</Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {item.customer || "Unknown customer"} · {detail}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`text-[11px] font-medium ${ageTone(hours)}`}
          title={`Waiting ${formatAge(item.createdAt, now)}`}
        >
          {formatAge(item.createdAt, now)}
        </span>
        <ActionLink to={type.href(item)}>{type.action}</ActionLink>
      </div>
    </li>
  );
}
