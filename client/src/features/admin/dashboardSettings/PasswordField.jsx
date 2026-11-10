import { forwardRef, useState } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";

/**
 * Password input with show/hide and a Caps Lock warning.
 * Pasting is allowed on purpose (password managers rely on it).
 */
const PasswordField = forwardRef(function PasswordField(
  { id, label, value, onChange, error, hint, autoComplete, required = true, onBlur, disabled, warnCapsLock = true, maxLength },
  ref
) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const detectCaps = (event) => {
    if (warnCapsLock && typeof event.getModifierState === "function") {
      setCapsLock(event.getModifierState("CapsLock"));
    }
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
        {label}
        {required && (
          <span className="ml-0.5 text-[#E8472B]" aria-hidden>
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onKeyUp={detectCaps}
          onKeyDown={detectCaps}
          onBlur={(event) => {
            setCapsLock(false);
            onBlur?.(event);
          }}
          className={`h-12 w-full rounded-2xl bg-neutral-50 pl-4 pr-12 text-sm text-neutral-900 ring-1 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:text-white dark:focus:bg-white/10 ${
            error
              ? "ring-red-400/70 focus:ring-red-500/60"
              : "ring-black/5 focus:ring-[#E8472B]/50 dark:ring-white/10"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          disabled={disabled}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-neutral-500 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {capsLock && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400" role="status">
          <TriangleAlert className="h-3.5 w-3.5" />
          Caps Lock is on
        </p>
      )}

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default PasswordField;
