import { RefreshCw } from "lucide-react";
import { RANGES } from "../constants";
import { formatTime } from "../utils/format";
import { Segmented } from "./ui";

export default function DashboardHeader({
  range,
  onRangeChange,
  onRefresh,
  refreshing,
  loading,
  updatedAt,
}) {
  return (
    <div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Sales, tasks and stock at a glance. Showing{" "}
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {range.long.toLowerCase()}
          </span>
          , paid orders only, in PKR.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Date range"
          value={range.value}
          onChange={onRangeChange}
          options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
        />

        <div className="flex items-center gap-2">
          <span
            className="text-xs text-neutral-400 dark:text-neutral-500"
            aria-live="polite"
          >
            {loading ? "Loading…" : updatedAt ? `Updated ${formatTime(updatedAt)}` : ""}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            aria-label="Refresh dashboard"
            title="Refresh"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-neutral-600 ring-1 ring-black/5 outline-none transition-all duration-200 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-teal-600/60 active:scale-95 disabled:opacity-60 dark:bg-[#141416] dark:text-neutral-300 dark:ring-white/10 dark:hover:bg-white/5"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing || loading ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
