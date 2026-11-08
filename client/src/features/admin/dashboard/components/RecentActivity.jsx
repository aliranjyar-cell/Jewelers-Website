import { useState } from "react";
import { Link } from "react-router";
import { Clock } from "lucide-react";
import useNow from "../hooks/useNow";
import { ORDER_STATUS, QUOTE_STATUS, adminPaths } from "../constants";
import { formatAgo, formatDateTime, formatPKR } from "../utils/format";
import { Badge, Card, CardHeader, EmptyState, Segmented, Skeleton, TextLink } from "./ui";

const ORDER_EVENTS = {
  placed: "Order placed",
  paid: "Payment confirmed",
  status_changed: "Status updated",
  cancelled: "Order cancelled",
  refunded: "Order refunded",
};

const REQUEST_EVENTS = {
  received: "Request received",
  quote_sent: "Quote sent",
  quote_accepted: "Quote accepted",
  quote_declined: "Quote declined",
  message: "Customer replied",
};

const MAX_ROWS = 6;

export default function RecentActivity({ recent, loading, className = "", delay = 0 }) {
  const [tab, setTab] = useState("orders");
  const now = useNow();

  const isOrders = tab === "orders";
  const rows = (isOrders ? recent?.orders : recent?.customRequests) ?? [];
  const visible = rows.slice(0, MAX_ROWS);

  return (
    <Card delay={delay} className={`p-5 ${className}`}>
      <CardHeader
        title="Recent activity"
        subtitle="Latest orders and custom-request updates"
        action={
          <Segmented
            label="Activity type"
            value={tab}
            onChange={setTab}
            options={[
              { value: "orders", label: "Orders" },
              { value: "requests", label: "Custom requests" },
            ]}
          />
        }
      />

      {loading ? (
        <ul className="mt-5 space-y-4" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex gap-3">
              <Skeleton className="h-3 w-3 !rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-52" />
              </div>
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={Clock}
          title="No recent activity"
          description={isOrders ? "New orders and status changes will show up here." : "Custom-order activity will show up here."}
        />
      ) : (
        <>
          <ol className="mt-5">
            {visible.map((row, index) => {
              const events = isOrders ? ORDER_EVENTS : REQUEST_EVENTS;
              const statuses = isOrders ? ORDER_STATUS : QUOTE_STATUS;
              const status = statuses[row.status];
              const to = isOrders ? adminPaths.order(row.id) : adminPaths.customRequest(row.id);
              const last = index === visible.length - 1;

              return (
                <li key={`${row.id}-${row.kind}-${row.at}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {/* timeline rail */}
                  {!last && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-[5px] top-5 w-px bg-neutral-200 dark:bg-white/10"
                    />
                  )}
                  <span
                    aria-hidden
                    className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full bg-white ring-2 ring-teal-600 dark:bg-[#141416]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm text-neutral-700 dark:text-neutral-200">
                        <Link
                          to={to}
                          className="font-semibold text-neutral-950 hover:underline dark:text-white"
                        >
                          {row.reference}
                        </Link>{" "}
                        <span className="text-neutral-500 dark:text-neutral-400">
                          · {events[row.kind] ?? "Updated"}
                        </span>
                      </p>
                      <time
                        dateTime={row.at}
                        title={formatDateTime(row.at)}
                        className="shrink-0 text-[11px] text-neutral-400 dark:text-neutral-500"
                      >
                        {formatAgo(row.at, now)}
                      </time>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="truncate">{row.customer || "Unknown customer"}</span>
                      {isOrders && row.amount !== null && row.amount !== undefined && (
                        <span>· {formatPKR(row.amount)}</span>
                      )}
                      {status && <Badge tone={status.tone}>{status.label}</Badge>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex justify-end">
            <TextLink to={isOrders ? adminPaths.orders : adminPaths.customRequests}>
              {isOrders ? "All orders" : "All requests"}
            </TextLink>
          </div>
        </>
      )}
    </Card>
  );
}
