import { useMemo } from "react";
import { CircleCheck, Coins, TriangleAlert } from "lucide-react";
import useNow from "../hooks/useNow";
import { STALE_RATE_HOURS, adminPaths } from "../constants";
import { ageInHours, formatAgo, formatDateTime, formatPKR } from "../utils/format";
import { ActionLink, Badge, Card, CardHeader, EmptyState, Skeleton } from "./ui";

const METAL_LABEL = { gold: "Gold", silver: "Silver" };

/** missing → no usable rate · stale → older than the threshold · current → fine */
function classify(rate, now) {
  const value = Number(rate.rate);
  if (!Number.isFinite(value) || value <= 0) {
    return { key: "missing", tone: "danger", label: "Missing" };
  }
  if (!rate.updatedAt || ageInHours(rate.updatedAt, now) >= STALE_RATE_HOURS) {
    return { key: "stale", tone: "warning", label: "Stale" };
  }
  return { key: "current", tone: "success", label: "Current" };
}

export default function MetalRates({ rates = [], loading, className = "", delay = 0 }) {
  const now = useNow();

  const { groups, problems } = useMemo(() => {
    const rows = rates.map((rate) => ({ ...rate, status: classify(rate, now) }));
    const grouped = rows.reduce((acc, row) => {
      (acc[row.metal] ??= []).push(row);
      return acc;
    }, {});
    return {
      groups: Object.entries(grouped),
      problems: rows.filter((r) => r.status.key !== "current"),
    };
  }, [rates, now]);

  const manage = (
    <ActionLink to={adminPaths.metalRates} variant="solid">
      Manage rates
    </ActionLink>
  );

  return (
    <Card delay={delay} className={`p-5 ${className}`}>
      <CardHeader
        title="Metal rates"
        subtitle="Published rates used for jewellery pricing"
        action={manage}
      />

      {loading ? (
        <div className="mt-5 space-y-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rates.length === 0 ? (
        <EmptyState
          compact
          icon={Coins}
          tone="danger"
          title="No metal rates published"
          description="Prices that depend on gold or silver can’t be calculated until you publish rates."
          action={manage}
        />
      ) : (
        <>
          {problems.length > 0 ? (
            <div
              role="alert"
              className="mt-4 flex gap-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                <span className="font-semibold">
                  {problems.length} rate{problems.length === 1 ? " needs" : "s need"} attention:
                </span>{" "}
                {problems
                  .map(
                    (p) =>
                      `${METAL_LABEL[p.metal] ?? p.metal} ${p.purity} ${
                        p.status.key === "missing" ? "is missing" : "is stale"
                      }`
                  )
                  .join(", ")}
                . Orders priced on these rates may be inaccurate.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CircleCheck className="h-4 w-4" />
              All published rates are up to date.
            </div>
          )}

          <div className="mt-4 space-y-5">
            {groups.map(([metal, rows]) => (
              <div key={metal}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                  {METAL_LABEL[metal] ?? metal}
                </p>
                <ul className="divide-y divide-neutral-100 dark:divide-white/5">
                  {rows.map((row) => (
                    <li key={row.id ?? `${row.metal}-${row.purity}`} className="flex items-center gap-3 py-2.5">
                      <span className="grid h-9 min-w-12 place-items-center rounded-xl bg-neutral-100 px-2 text-xs font-semibold text-neutral-800 dark:bg-white/10 dark:text-neutral-100">
                        {row.purity}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                          {row.status.key === "missing" ? (
                            <span className="text-red-600 dark:text-red-400">Not set</span>
                          ) : (
                            <>
                              {formatPKR(row.rate)}
                              <span className="font-normal text-neutral-400"> / {row.unit ?? "tola"}</span>
                            </>
                          )}
                        </p>
                        <p
                          className="truncate text-xs text-neutral-500 dark:text-neutral-400"
                          title={row.updatedAt ? formatDateTime(row.updatedAt) : undefined}
                        >
                          {row.updatedAt ? `Updated ${formatAgo(row.updatedAt, now)}` : "Never updated"}
                        </p>
                      </div>
                      <Badge tone={row.status.tone}>{row.status.label}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            Read-only here. Rates never change automatically — update them from Metal rates.
          </p>
        </>
      )}
    </Card>
  );
}
