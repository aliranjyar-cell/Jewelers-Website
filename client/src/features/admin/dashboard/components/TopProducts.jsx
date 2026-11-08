import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { formatNumber, formatPKR } from "../utils/format";
import { Card, CardHeader, EmptyState, Segmented, Skeleton } from "./ui";

export default function TopProducts({ products = [], range, loading, className = "", delay = 0 }) {
  const [by, setBy] = useState("units");

  const ranked = useMemo(
    () => [...products].sort((a, b) => b[by] - a[by]).filter((p) => p[by] > 0).slice(0, 5),
    [products, by]
  );
  const max = ranked[0]?.[by] ?? 0;

  return (
    <Card delay={delay} className={`p-5 ${className}`}>
      <CardHeader
        title="Best sellers"
        subtitle={`Paid orders · ${range.long}`}
        action={
          <Segmented
            label="Rank by"
            value={by}
            onChange={setBy}
            options={[
              { value: "units", label: "Units" },
              { value: "revenue", label: "Revenue" },
            ]}
          />
        }
      />

      {loading ? (
        <ul className="mt-5 space-y-4" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-2 h-2 w-full !rounded-full" />
            </li>
          ))}
        </ul>
      ) : ranked.length === 0 ? (
        <EmptyState
          compact
          icon={Trophy}
          title="No sales yet"
          description="Your best-selling products will appear here once paid orders come in."
        />
      ) : (
        <ol className="mt-5 space-y-4">
          {ranked.map((product, index) => (
            <li key={product.id ?? product.name}>
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                  {index + 1}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {product.name}
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-neutral-950 dark:text-white">
                  {by === "units" ? `${formatNumber(product.units)} sold` : formatPKR(product.revenue)}
                </p>
              </div>
              <div className="mt-2 pl-9">
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: `${max ? (product[by] / max) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                  {by === "units" ? formatPKR(product.revenue) : `${formatNumber(product.units)} sold`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
