import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { CircleCheck, Clock, KeyRound, LogOut, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { Card, CardHeader, ErrorBanner } from "../dashboard/components/ui.jsx";
import PasswordField from "./PasswordField.jsx";
import PasswordStrength from "./PasswordStrength.jsx";
import { changePassword } from "./passwordApi.js";
import { evaluatePassword, MAX_LENGTH } from "./passwordPolicy.js";

const FIELD = { current: "current-password", next: "new-password", confirm: "confirm-password" };

const BLANK = { current: "", next: "", confirm: "" };

export default function AdminChangePasswordPage() {
  const navigate = useNavigate();
  // Provided by AdminLayout: <Outlet context={{ user, csrfToken }} />
  const { user, csrfToken } = useOutletContext() ?? {};

  const [values, setValues] = useState(BLANK);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success
  const [lockSeconds, setLockSeconds] = useState(0);
  const successRef = useRef(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "Change password · Admin · Jewelry House";
    // Keep the admin area out of search engines.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = previous;
      meta.remove();
    };
  }, []);

  // Rate-limit countdown (server sent 429 + Retry-After)
  useEffect(() => {
    if (lockSeconds <= 0) return undefined;
    const id = setTimeout(() => setLockSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [lockSeconds]);

  const context = [user?.name, user?.email?.split("@")[0]];
  const evaluation = useMemo(
    () => evaluatePassword(values.next, { current: values.current, context }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values.next, values.current, user?.name, user?.email]
  );

  const clientErrors = {
    current: values.current ? "" : "Enter your current password.",
    next: !values.next
      ? "Enter a new password."
      : values.next.length > MAX_LENGTH || !evaluation.valid
      ? evaluation.issue
      : "",
    confirm: !values.confirm
      ? "Confirm your new password."
      : values.confirm !== values.next
      ? "The passwords don’t match."
      : "",
  };
  const errors = {
    current: clientErrors.current || serverErrors.current || "",
    next: clientErrors.next || serverErrors.next || "",
    confirm: clientErrors.confirm,
  };
  const visibleError = (key) => ((submitted || touched[key]) && errors[key]) || "";
  const confirmMatches = values.confirm.length > 0 && values.confirm === values.next;

  const setValue = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setServerErrors((e) => ({ ...e, [key]: "" }));
    setFormError("");
    if (status === "success") setStatus("idle");
  };
  const markTouched = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "submitting" || lockSeconds > 0) return;
    setSubmitted(true);
    setFormError("");

    const firstInvalid = ["current", "next", "confirm"].find((k) => clientErrors[k]);
    if (firstInvalid) {
      document.getElementById(FIELD[firstInvalid])?.focus();
      return;
    }

    setStatus("submitting");
    try {
      await changePassword(
        { currentPassword: values.current, newPassword: values.next, signOutOtherSessions: signOutOthers },
        csrfToken
      );
      setValues(BLANK);
      setTouched({});
      setSubmitted(false);
      setServerErrors({});
      setStatus("success");
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (error) {
      setStatus("idle");
      if (error.status === 401) {
        setFormError("Your session has expired. Redirecting you to sign in…");
        setTimeout(() => navigate("/admin/login", { replace: true }), 1500);
      } else if (error.status === 429) {
        setLockSeconds(error.retryAfter || 60);
        setFormError("Too many attempts. Please wait before trying again.");
      } else if (error.fieldErrors && Object.keys(error.fieldErrors).length) {
        setServerErrors({
          current: error.fieldErrors.currentPassword ?? "",
          next: error.fieldErrors.newPassword ?? "",
        });
        if (error.fieldErrors.currentPassword) document.getElementById(FIELD.current)?.focus();
        else if (error.fieldErrors.newPassword) document.getElementById(FIELD.next)?.focus();
      } else {
        setFormError(error.message || "The password could not be updated. Please try again.");
      }
    }
  }

  const busy = status === "submitting";
  const locked = lockSeconds > 0;

  return (
    <section className="pb-2">
      <div className="pt-2">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-2xl">Change administrator password</h2>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Update the password for{" "}
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {user?.email ?? user?.name ?? "your administrator account"}
          </span>
          .
        </p>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5 sm:p-7">
          <CardHeader
            title="Password"
            subtitle="Choose a long, unique password you don’t use anywhere else."
          />

          {status === "success" && (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="mt-5 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 outline-none ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
            >
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Your password has been updated</p>
                <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                  {signOutOthers
                    ? "You’ve stayed signed in here. Every other device was signed out."
                    : "Use the new password next time you sign in."}
                </p>
              </div>
            </div>
          )}

          {formError && (
            <ErrorBanner
              className="mt-5"
              message={locked ? `${formError} Try again in ${formatWait(lockSeconds)}.` : formError}
            />
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
            {/* Lets password managers attach the new password to the right account. */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              defaultValue={user?.email ?? ""}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />

            <PasswordField
              id={FIELD.current}
              label="Current password"
              autoComplete="current-password"
              value={values.current}
              maxLength={1024}
              onChange={setValue("current")}
              onBlur={markTouched("current")}
              error={visibleError("current")}
              disabled={busy || locked}
            />

            <hr className="border-neutral-100 dark:border-white/10" />

            <div>
              <PasswordField
                id={FIELD.next}
                label="New password"
                autoComplete="new-password"
                value={values.next}
                maxLength={MAX_LENGTH}
                onChange={setValue("next")}
                onBlur={markTouched("next")}
                error={visibleError("next")}
                disabled={busy || locked}
              />
              <PasswordStrength password={values.next} evaluation={evaluation} />
            </div>

            <div>
              <PasswordField
                id={FIELD.confirm}
                label="Confirm new password"
                autoComplete="new-password"
                value={values.confirm}
                maxLength={MAX_LENGTH}
                onChange={setValue("confirm")}
                onBlur={markTouched("confirm")}
                error={visibleError("confirm")}
                warnCapsLock={false}
                disabled={busy || locked}
              />
              {confirmMatches && !visibleError("confirm") && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400" role="status">
                  <CircleCheck className="h-3.5 w-3.5" />
                  Passwords match
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
              <input
                type="checkbox"
                checked={signOutOthers}
                onChange={(e) => setSignOutOthers(e.target.checked)}
                disabled={busy || locked}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#E8472B]"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                  Sign out of all other devices
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Recommended. Anyone using an old session — for example on a shared computer — will need to sign in again.
                </span>
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="submit"
                disabled={busy || locked}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-medium text-white shadow-lg shadow-black/10 outline-none transition-all duration-200 hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {busy ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    Updating…
                  </>
                ) : locked ? (
                  <>
                    <Clock className="h-4 w-4" />
                    Try again in {formatWait(lockSeconds)}
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Update password
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>

        <Card delay={80} className="p-5 sm:p-6">
          <CardHeader title="Keeping your account safe" />
          <ul className="mt-4 space-y-4">
            <Tip icon={ShieldCheck} title="Longer beats complicated">
              A phrase of several unrelated words is easier to remember and harder to crack than one short, “clever” password.
            </Tip>
            <Tip icon={KeyRound} title="Use a password manager">
              Let it generate and store a unique password. Pasting into these fields is fine.
            </Tip>
            <Tip icon={Smartphone} title="Never share it">
              Nobody from the store team or support will ever ask for your password.
            </Tip>
            <Tip icon={LogOut} title="Signed out elsewhere?">
              After changing it, other devices must sign in again with the new password.
            </Tip>
          </ul>
        </Card>
      </div>
    </section>
  );
}

function Tip({ icon: Icon, title, children }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{children}</p>
      </div>
    </li>
  );
}

function formatWait(seconds) {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `${seconds}s`;
}
