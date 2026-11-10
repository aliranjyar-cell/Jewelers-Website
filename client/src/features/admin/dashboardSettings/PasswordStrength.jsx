import { Check, Circle } from "lucide-react";

const BAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];
const TEXT_COLORS = [
  "text-red-600 dark:text-red-400",
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-lime-700 dark:text-lime-400",
  "text-emerald-600 dark:text-emerald-400",
];

/** Strength meter plus the live requirements checklist. */
export default function PasswordStrength({ password, evaluation }) {
  const hasInput = password.length > 0;
  const { score, label, rules } = evaluation;

  return (
    <div className="mt-3 space-y-3">
      {hasInput && (
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">Password strength</span>
            <span className={`font-semibold ${TEXT_COLORS[score]}`} aria-live="polite">
              {label}
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5" aria-hidden>
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1.5 rounded-full transition-colors duration-300 ${
                  score >= segment ? BAR_COLORS[score] : "bg-neutral-200 dark:bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-1.5" aria-label="Password requirements">
        {rules.map((rule) => {
          const met = hasInput && rule.met;
          return (
            <li key={rule.id} className="flex items-center gap-2 text-xs">
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
                  met
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-100 text-neutral-300 dark:bg-white/10 dark:text-neutral-600"
                }`}
              >
                {met ? <Check className="h-3 w-3" strokeWidth={3} /> : <Circle className="h-2 w-2" />}
              </span>
              <span className={met ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-500 dark:text-neutral-400"}>
                {rule.label}
                <span className="sr-only">{met ? " — met" : " — not met yet"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
