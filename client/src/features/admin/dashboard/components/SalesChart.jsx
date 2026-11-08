import { useId, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import useElementWidth from "../hooks/useElementWidth";
import {
  formatAxisLabel,
  formatCompact,
  formatNumber,
  formatPKR,
  formatPointLabel,
} from "../utils/format";
import { Card, CardHeader, EmptyState, Segmented, Skeleton } from "./ui";

const METRICS = {
  revenue: {
    label: "Revenue",
    heading: "Paid revenue",
    color: "text-teal-700 dark:text-teal-300",
    full: formatPKR,
    axis: formatCompact,
  },
  orders: {
    label: "Orders",
    heading: "Orders placed",
    color: "text-neutral-900 dark:text-white",
    full: (n) => `${formatNumber(n)} order${n === 1 ? "" : "s"}`,
    axis: formatNumber,
  },
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Smallest "nice" step (1, 2, 5 × 10ⁿ) that is at least `raw`. */
function niceStep(raw) {
  if (raw <= 1) return 1;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const f = raw / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * exp;
}

/* -------------------------------------------------------------------------- */

export default function SalesChart({
  series = [],
  previousSeries = [],
  granularity = "day",
  range,
  loading,
  className = "",
  delay = 0,
}) {
  const [metric, setMetric] = useState("revenue");
  const [view, setView] = useState("chart");
  const [wrapRef, width] = useElementWidth();

  const cfg = METRICS[metric];
  const unit = granularity === "hour" ? "hour" : "day";
  const hasData = series.some((p) => p.revenue > 0 || p.orders > 0);
  const hasPrevious = series.length > 0 && previousSeries.length === series.length;

  const stats = useMemo(() => {
    const values = series.map((p) => p[metric]);
    const total = values.reduce((sum, v) => sum + v, 0);
    const peakIndex = values.length ? values.indexOf(Math.max(...values)) : -1;
    return {
      total,
      average: values.length ? total / values.length : 0,
      peak: peakIndex >= 0 ? { value: values[peakIndex], date: series[peakIndex].date } : null,
    };
  }, [series, metric]);

  return (
    <Card delay={delay} className={`p-5 ${className}`}>
      <CardHeader
        title="Sales"
        subtitle={`${cfg.heading} by ${unit} · ${range.long}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "revenue", label: "Revenue" },
                { value: "orders", label: "Orders" },
              ]}
            />
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: "chart", label: "Chart" },
                { value: "table", label: "Table" },
              ]}
            />
          </div>
        }
      />

      {loading ? (
        <div className="mt-5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="mt-4 h-60 w-full" />
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales in this period"
          description="Paid orders will appear here as soon as customers start buying. Try a longer date range."
        />
      ) : (
        <>
          {/* Plain-language summary: readable even when the chart is not */}
          <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
            <Stat label={`Total ${metric === "revenue" ? "paid" : "orders"}`} value={cfg.full(stats.total)} />
            <Stat label={`Average per ${unit}`} value={cfg.full(Math.round(stats.average * 10) / 10)} />
            <Stat
              label={`Best ${unit}`}
              value={stats.peak ? cfg.full(stats.peak.value) : "—"}
              hint={stats.peak ? formatPointLabel(stats.peak.date, granularity) : undefined}
            />
          </dl>

          <div ref={wrapRef} className="mt-5 w-full">
            {view === "chart" ? (
              width > 0 && (
                <Chart
                  key={`${metric}-${range.value}`}
                  series={series}
                  previous={hasPrevious ? previousSeries : null}
                  metric={metric}
                  granularity={granularity}
                  width={width}
                  compareLabel={range.compare}
                />
              )
            ) : (
              <DataTable series={series} previous={hasPrevious ? previousSeries : null} granularity={granularity} />
            )}
          </div>

          {view === "chart" && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-2">
                <span className={`h-0.5 w-5 rounded-full bg-current ${cfg.color}`} />
                {range.long}
              </span>
              {hasPrevious && (
                <span className="flex items-center gap-2">
                  <span className="h-0 w-5 border-t-2 border-dashed border-neutral-400 dark:border-neutral-500" />
                  {range.compare.charAt(0).toUpperCase() + range.compare.slice(1)}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="min-w-0 rounded-2xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
      <dt className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold text-neutral-950 dark:text-white">{value}</dd>
      {hint && <p className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SVG area chart                                                             */
/* -------------------------------------------------------------------------- */

function Chart({ series, previous, metric, granularity, width, compareLabel }) {
  const cfg = METRICS[metric];
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState(null);

  const compact = width < 480;
  const height = compact ? 220 : 280;
  const m = { top: 16, right: 20, bottom: 30, left: compact ? 44 : 56 };
  const iw = Math.max(10, width - m.left - m.right);
  const ih = height - m.top - m.bottom;
  const n = series.length;

  const values = series.map((p) => p[metric]);
  const prevValues = previous ? previous.map((p) => p[metric]) : [];
  const rawMax = Math.max(0, ...values, ...prevValues);
  const step = niceStep(rawMax / 4);
  const yMax = step * 4;

  const x = (i) => m.left + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v) => m.top + ih - (v / yMax) * ih;
  const pathOf = (list) =>
    list.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const linePath = pathOf(values);
  const baseY = m.top + ih;
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;

  const maxLabels = Math.max(2, Math.floor(iw / 72));
  const labelEvery = Math.ceil(n / maxLabels);

  const handlePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const index = n === 1 ? 0 : Math.round(((px - m.left) / iw) * (n - 1));
    setActive(clamp(index, 0, n - 1));
  };

  const handleKey = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActive((a) => (a === null ? 0 : Math.min(n - 1, a + 1)));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActive((a) => (a === null ? n - 1 : Math.max(0, a - 1)));
    } else if (event.key === "Escape") {
      setActive(null);
    }
  };

  const tooltipLeft = active === null ? 0 : clamp(x(active), 84, width - 84);

  return (
    <div className="relative select-none" style={{ height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        tabIndex={0}
        aria-label={`${cfg.heading} chart. Use the left and right arrow keys to inspect each point, or switch to the table view.`}
        className={`block overflow-visible rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-600/50 ${cfg.color}`}
        style={{ touchAction: "pan-y" }}
        onKeyDown={handleKey}
        onBlur={() => setActive(null)}
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid + y labels */}
        {[0, 1, 2, 3, 4].map((k) => {
          const v = k * step;
          return (
            <g key={k}>
              <line
                x1={m.left}
                x2={width - m.right}
                y1={y(v)}
                y2={y(v)}
                className="stroke-neutral-200 dark:stroke-white/10"
                strokeDasharray={k === 0 ? undefined : "3 4"}
              />
              <text
                x={m.left - 10}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-neutral-400 text-[11px] dark:fill-neutral-500"
              >
                {cfg.axis(v)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {series.map((p, i) =>
          i % labelEvery === 0 ? (
            <text
              key={p.date}
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-neutral-400 text-[11px] dark:fill-neutral-500"
            >
              {formatAxisLabel(p.date, granularity)}
            </text>
          ) : null
        )}

        {/* Previous period */}
        {previous && (
          <path
            d={pathOf(prevValues)}
            fill="none"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinejoin="round"
            className="stroke-neutral-400 dark:stroke-neutral-500"
          />
        )}

        {/* Current period */}
        {n > 1 && <path d={areaPath} fill={`url(#fill-${uid})`} />}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength="1"
          className="chart-draw"
        />
        {n === 1 && <circle cx={x(0)} cy={y(values[0])} r="4" fill="currentColor" />}

        {/* Hover / focus marker */}
        {active !== null && (
          <g pointerEvents="none">
            <line
              x1={x(active)}
              x2={x(active)}
              y1={m.top}
              y2={baseY}
              className="stroke-neutral-300 dark:stroke-white/20"
            />
            <circle
              cx={x(active)}
              cy={y(values[active])}
              r="5"
              fill="currentColor"
              className="stroke-white dark:stroke-[#141416]"
              strokeWidth="2.5"
            />
          </g>
        )}

        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="transparent"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
        />
      </svg>

      {active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 z-10 w-40 -translate-x-1/2 rounded-2xl bg-neutral-950 px-3 py-2 text-xs text-white shadow-xl dark:bg-white dark:text-neutral-950"
          style={{ left: tooltipLeft }}
        >
          <p className="font-medium opacity-70">{formatPointLabel(series[active].date, granularity)}</p>
          <p className="mt-0.5 text-sm font-semibold">{cfg.full(values[active])}</p>
          {previous && (
            <p className="mt-0.5 opacity-70">
              {cfg.full(prevValues[active])} {compareLabel}
            </p>
          )}
        </div>
      )}

      {/* Draw-in animation (respects reduced motion) */}
      <style>{`
        .chart-draw { stroke-dasharray: 1; stroke-dashoffset: 0; animation: chart-draw 900ms cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes chart-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .chart-draw { animation: none; } }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table view (accessible / mobile-friendly alternative)                      */
/* -------------------------------------------------------------------------- */

function DataTable({ series, previous, granularity }) {
  const rows = series
    .map((p, i) => ({ ...p, prev: previous ? previous[i] : null }))
    .reverse();

  return (
    <div className="max-h-72 overflow-auto rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead className="sticky top-0 bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500 dark:bg-[#1A1A1D] dark:text-neutral-400">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-semibold">
              {granularity === "hour" ? "Hour" : "Date"}
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">
              Orders
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">
              Paid revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
          {rows.map((row) => (
            <tr key={row.date} className="transition-colors hover:bg-neutral-50 dark:hover:bg-white/5">
              <th scope="row" className="whitespace-nowrap px-4 py-2.5 font-medium text-neutral-700 dark:text-neutral-200">
                {formatPointLabel(row.date, granularity)}
              </th>
              <td className="px-4 py-2.5 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                {formatNumber(row.orders)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums text-neutral-950 dark:text-white">
                {formatPKR(row.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
