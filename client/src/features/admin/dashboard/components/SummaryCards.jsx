import { Banknote, CircleCheck, Coins, ShoppingBag, Users } from "lucide-react";
import { formatNumber, formatPKR } from "../utils/format";
import { Badge, Card, Delta, Skeleton } from "./ui";

export default function SummaryCards({ summary, range, loading }) {
  if (loading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} tone={i === 0 ? "accent" : "default"} delay={i * 60} className="p-5">
            <Skeleton className={`h-4 w-28 ${i === 0 ? "!bg-white/25" : ""}`} />
            <Skeleton className={`mt-5 h-9 w-40 ${i === 0 ? "!bg-white/25" : ""}`} />
            <Skeleton className={`mt-4 h-4 w-32 ${i === 0 ? "!bg-white/25" : ""}`} />
          </Card>
        ))}
      </div>
    );
  }

  const { revenue, orders, averageOrderValue, customers } = summary;
  const placedValue = revenue.paid + revenue.pending;
  const paidShare = placedValue > 0 ? (revenue.paid / placedValue) * 100 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Sales revenue — paid vs pending kept visibly separate */}
      <Card tone="accent" delay={0} className="relative overflow-hidden p-5">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white/85">Sales revenue (paid)</p>
            <p className="mt-0.5 text-xs text-white/70">{range.long}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20">
            <Banknote className="h-[18px] w-[18px]" />
          </span>
        </div>

        <p className="relative mt-4 text-3xl font-semibold tracking-tight">
          {formatPKR(revenue.paid)}
        </p>
        <div className="relative mt-2">
          <Delta
            onAccent
            current={revenue.paid}
            previous={revenue.previousPaid}
            compareLabel={range.compare}
          />
        </div>

        <div className="relative mt-5">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/25"
            role="img"
            aria-label={`${paidShare.toFixed(0)}% of order value is paid`}
          >
            <div
              className="h-full rounded-full bg-white transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${paidShare}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-white/70">Paid</p>
              <p className="font-semibold">{formatPKR(revenue.paid)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70">
                Awaiting payment
                {revenue.pendingOrders > 0 ? ` · ${revenue.pendingOrders}` : ""}
              </p>
              <p className="font-semibold">{formatPKR(revenue.pending)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Orders */}
      <StatCard
        delay={60}
        icon={ShoppingBag}
        label="Orders placed"
        caption={range.long}
        value={formatNumber(orders.total)}
        delta={
          <Delta current={orders.total} previous={orders.previousTotal} compareLabel={range.compare} />
        }
        footer={
          orders.needingAction > 0 ? (
            <a
              href="#needs-attention"
              className="inline-flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-teal-600/60"
            >
              <Badge tone="accent" className="px-2.5 py-1 text-xs">
                {orders.needingAction} need{orders.needingAction === 1 ? "s" : ""} action
              </Badge>
            </a>
          ) : (
            <Badge tone="success" className="px-2.5 py-1 text-xs">
              <CircleCheck className="h-3.5 w-3.5" />
              Nothing needs action
            </Badge>
          )
        }
      />

      {/* Average order value */}
      <StatCard
        delay={120}
        icon={Coins}
        label="Average order value"
        caption={`Per order · ${range.long}`}
        value={formatPKR(averageOrderValue.value)}
        delta={
          <Delta
            current={averageOrderValue.value}
            previous={averageOrderValue.previousValue}
            compareLabel={range.compare}
          />
        }
      />

      {/* New customers */}
      <StatCard
        delay={180}
        icon={Users}
        label="New customers"
        caption={`Signed up · ${range.long}`}
        value={formatNumber(customers.new)}
        delta={
          <Delta
            current={customers.new}
            previous={customers.previousNew}
            compareLabel={range.compare}
          />
        }
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, caption, value, delta, footer, delay }) {
  return (
    <Card delay={delay} className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}</p>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{caption}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
        {value}
      </p>
      <div className="mt-2">{delta}</div>
      {footer && <div className="mt-auto pt-4">{footer}</div>}
    </Card>
  );
}
