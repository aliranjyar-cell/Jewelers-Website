import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Minus, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { percentChange } from "../utils/format";

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

const SURFACES = {
  default:
    "bg-white ring-1 ring-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#141416] dark:ring-white/10",
  highlight:
    "bg-white ring-1 ring-teal-700/20 shadow-[0_8px_30px_rgba(23,138,152,0.08)] dark:bg-[#141416] dark:ring-teal-400/25",
  accent:
    "bg-gradient-to-br from-[#3FBFC1] to-[#167D8E] text-white shadow-lg shadow-teal-800/20",
};

/** Surface with a soft fade-up on mount. `delay` staggers neighbouring cards. */
export function Card({ as: Tag = "section", tone = "default", delay = 0, className = "", children, ...rest }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Tag
      {...rest}
      style={{ transitionDelay: `${delay}ms` }}
      className={`rounded-3xl transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        SURFACES[tone]
      } ${shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, badge }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-neutral-950 dark:text-white">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

const TONES = {
  neutral: "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300",
  danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  accent: "bg-teal-700/10 text-teal-800 dark:bg-teal-300/15 dark:text-teal-300",
};

export function toneClass(tone) {
  return TONES[tone] ?? TONES.neutral;
}

export function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass(
        tone
      )} ${className}`}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-neutral-200/70 motion-reduce:animate-none dark:bg-white/10 ${className}`}
    />
  );
}

export function IconTile({ icon: Icon, tone = "neutral", className = "" }) {
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${toneClass(tone)} ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

/** Period-over-period change pill. */
export function Delta({ current, previous, compareLabel, onAccent = false }) {
  const change = percentChange(current, previous);

  if (change === null) {
    return (
      <span
        className={`text-xs ${onAccent ? "text-white/80" : "text-neutral-400 dark:text-neutral-500"}`}
      >
        No data for {compareLabel}
      </span>
    );
  }

  const rounded = Math.abs(change) < 0.05 ? 0 : change;
  const up = rounded > 0;
  const flat = rounded === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const tone = onAccent
    ? "bg-white/20 text-white"
    : flat
    ? TONES.neutral
    : up
    ? TONES.success
    : TONES.danger;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {Math.abs(rounded).toFixed(1)}%
      </span>
      <span
        className={`text-xs ${onAccent ? "text-white/80" : "text-neutral-400 dark:text-neutral-500"}`}
      >
        vs {compareLabel}
      </span>
    </span>
  );
}

/** Pill group for ranges, filters and view switches. */
export function Segmented({ options, value, onChange, label, className = "" }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-neutral-100 p-1 [scrollbar-width:none] dark:bg-white/5 [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-teal-600/60 sm:text-[13px] ${
              active
                ? "bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950"
                : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            {option.label}
            {option.count !== undefined && option.count > 0 && (
              <span
                className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold leading-none ${
                  active
                    ? "bg-white/20 text-white dark:bg-neutral-950/10 dark:text-neutral-950"
                    : "bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Row-level call to action (renders a router Link). */
export function ActionLink({ to, children, variant = "soft", className = "" }) {
  const styles =
    variant === "solid"
      ? "bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/15";
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-600/60 ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Subtle "View all →" link for card headers. */
export function TextLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1 rounded-full text-xs font-medium text-teal-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-teal-600/60 dark:text-teal-300"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function EmptyState({ icon: Icon, title, description, action, tone = "neutral", compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-8" : "px-4 py-12"
      }`}
    >
      <IconTile icon={Icon} tone={tone} className="h-12 w-12 rounded-full" />
      <p className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loader                                                                    */
/* -------------------------------------------------------------------------- */

export function Loader({ size = "w-8 h-8", className = "", message }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={message || "Loading"}
    >
      <div
        className={`${size} rounded-full border-3 border-neutral-200 border-t-teal-600 dark:border-neutral-800 dark:border-t-teal-400 animate-spin motion-reduce:animate-none`}
      ></div>
      {message && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {message}
        </p>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onRetry, className = "" }) {
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20 ${className}`}
    >
      <TriangleAlert className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
