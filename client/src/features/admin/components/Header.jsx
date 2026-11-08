import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Mail,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import useClickOutside from "../hooks/useClickOutside";
import {
  HEADER_TABS,
  NOTIFICATIONS,
  PROFILE_LINKS,
  QUICK_ACTIONS,
  SEARCH_ITEMS,
} from "../config/navigation";

const pill =
  "rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5 dark:bg-[#141416] dark:ring-white/10";

const defaultUser = {
  name: "Code XR",
  email: "hello@codexr.studio",
  role: "Administrator",
  avatar: "https://i.pravatar.cc/96?img=12",
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* -------------------------------------------------------------------------- */

export default function Header({
  activeTab = "Overview",
  onTabChange = () => {},
  onMenuClick = () => {},
  onNavigate = () => {},
  theme = "light",
  onToggleTheme = () => {},
  user = defaultUser,
}) {
  return (
    <header className="relative z-30 flex h-[76px] shrink-0 items-center gap-3 px-4 sm:px-6">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className={`${pill} grid h-12 w-12 shrink-0 place-items-center text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-white/5 md:hidden`}
      >
        <Menu className="h-5 w-5" />
      </button>

      <SearchBox />

      {/* Section tabs */}
      <div className="hidden flex-1 justify-center xl:flex">
        <Tabs active={activeTab} onChange={onTabChange} />
      </div>

      {/* Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <QuickCreate />

        <div className={`${pill} flex h-12 items-center gap-0.5 px-1.5`}>
          <span className="hidden sm:block">
            <IconButton
              label="Messages"
              badge={4}
              onClick={() => onNavigate("messages")}
            >
              <Mail className="h-[18px] w-[18px]" />
            </IconButton>
          </span>
          <NotificationsMenu />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <ProfileMenu user={user} />
      </div>
    </header>
  );
}

/* ------------------------------- Primitives ------------------------------- */

function Popover({ open, className = "", children }) {
  return (
    <div
      className={`absolute z-50 mt-3 origin-top rounded-3xl bg-white p-2 shadow-2xl shadow-black/10 ring-1 ring-black/5 transition-[opacity,transform,visibility] duration-200 ${EASE} motion-reduce:transition-none dark:bg-[#1A1A1D] dark:shadow-black/50 dark:ring-white/10 ${
        open
          ? "visible translate-y-0 scale-100 opacity-100"
          : "invisible -translate-y-1 scale-95 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function IconButton({ label, onClick, active, badge, expanded, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={`relative grid h-10 w-10 place-items-center rounded-full text-neutral-600 outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 dark:text-neutral-300 dark:hover:bg-white/10 ${
        active ? "bg-neutral-100 dark:bg-white/10" : ""
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#E8472B] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-[#141416]">
          {badge}
        </span>
      )}
    </button>
  );
}

function MenuRow({ icon: Icon, label, hint, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-150 ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/5"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
          danger
            ? "bg-red-50 dark:bg-red-500/10"
            : "bg-neutral-100 dark:bg-white/5"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        {hint && (
          <span className="block truncate text-xs text-neutral-400 dark:text-neutral-500">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

/* --------------------------------- Search --------------------------------- */

function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const close = () => setOpen(false);

  useClickOutside(wrapperRef, close, open);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? SEARCH_ITEMS.filter((i) => i.label.toLowerCase().includes(q))
      : SEARCH_ITEMS;
  }, [query]);

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0 flex-1 xl:w-56 xl:flex-none 2xl:w-80"
    >
      <div
        className={`${pill} flex h-12 items-center gap-3 px-4 transition-shadow duration-200 ${
          open ? "ring-2 ring-[#E8472B]/40" : ""
        }`}
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          type="search"
          placeholder="Search anything…"
          aria-label="Search"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="hidden shrink-0 rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-500 dark:bg-white/10 dark:text-neutral-400 sm:block">
          {isMac ? "⌘ K" : "Ctrl K"}
        </kbd>
      </div>

      <Popover open={open} className="inset-x-0 max-h-80 overflow-y-auto">
        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-400">
            No results for “{query}”
          </p>
        ) : (
          <>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
              {query ? "Results" : "Suggestions"}
            </p>
            {results.map((item) => (
              <MenuRow
                key={item.id}
                icon={item.icon}
                label={item.label}
                hint={item.hint}
                onClick={() => {
                  setQuery("");
                  close();
                }}
              />
            ))}
          </>
        )}
      </Popover>
    </div>
  );
}

/* ---------------------------------- Tabs ---------------------------------- */

const TAB_WIDTH = 80; // keep in sync with `w-20`

function Tabs({ active, onChange }) {
  const index = Math.max(0, HEADER_TABS.indexOf(active));
  return (
    <nav
      aria-label="Sections"
      className={`${pill} relative flex h-12 items-center p-1.5`}
    >
      <span
        aria-hidden
        className={`absolute left-1.5 top-1.5 h-9 w-20 rounded-full bg-neutral-950 transition-transform duration-300 ${EASE} motion-reduce:transition-none dark:bg-white`}
        style={{ transform: `translateX(${index * TAB_WIDTH}px)` }}
      />
      {HEADER_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            aria-current={isActive ? "page" : undefined}
            className={`relative z-10 h-9 w-20 rounded-full text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 ${
              isActive
                ? "text-white dark:text-neutral-950"
                : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------ Quick create ------------------------------ */

function QuickCreate() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = () => setOpen(false);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white shadow-lg shadow-black/10 outline-none transition-all duration-200 hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 active:scale-95 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 2xl:px-5"
      >
        <Plus
          className={`h-4 w-4 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        />
        <span className="hidden 2xl:inline">New</span>
      </button>

      <Popover open={open} className="right-0 w-72">
        {QUICK_ACTIONS.map((a) => (
          <MenuRow
            key={a.id}
            icon={a.icon}
            label={a.label}
            hint={a.hint}
            onClick={close}
          />
        ))}
      </Popover>
    </div>
  );
}

/* ------------------------------ Notifications ----------------------------- */

const TONES = {
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
};

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFICATIONS);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const unread = items.filter((n) => n.unread).length;
  const markAll = () => setItems((l) => l.map((n) => ({ ...n, unread: false })));

  return (
    <div ref={ref} className="relative">
      <IconButton
        label="Notifications"
        badge={unread}
        active={open}
        expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-[18px] w-[18px]" />
      </IconButton>

      <Popover
        open={open}
        className="-right-14 w-[360px] max-w-[calc(100vw-2rem)] sm:right-0"
      >
        <div className="flex items-center justify-between px-3 pb-2 pt-2">
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              Notifications
            </p>
            <p className="text-xs text-neutral-400">
              {unread > 0 ? `${unread} unread` : "You’re all caught up"}
            </p>
          </div>
          <button
            type="button"
            onClick={markAll}
            disabled={unread === 0}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#E8472B] transition-colors hover:bg-[#E8472B]/10 disabled:pointer-events-none disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <ul className="max-h-80 space-y-0.5 overflow-y-auto">
          {items.map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() =>
                    setItems((l) =>
                      l.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                    )
                  }
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-white/5"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONES[n.tone]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-neutral-400">
                        {n.time}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {n.body}
                    </span>
                  </span>
                  {n.unread && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#E8472B]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-1 border-t border-neutral-100 p-1 pt-2 dark:border-white/10">
          <button
            type="button"
            className="w-full rounded-2xl py-2.5 text-center text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5"
          >
            View all notifications
          </button>
        </div>
      </Popover>
    </div>
  );
}

/* ------------------------------ Theme toggle ------------------------------ */

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  const icon =
    "absolute inset-0 m-auto h-[18px] w-[18px] transition-all duration-500 motion-reduce:transition-none";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative h-10 w-10 rounded-full text-neutral-600 outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 dark:text-neutral-300 dark:hover:bg-white/10"
    >
      <Sun
        className={`${icon} ${
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`${icon} ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
}

/* ------------------------------ Profile menu ------------------------------ */

function ProfileMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = () => setOpen(false);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${pill} flex h-12 items-center gap-3 pl-1.5 pr-3 text-left outline-none transition-colors duration-200 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 dark:hover:bg-white/5 2xl:pr-4`}
      >
        <img
          src={user.avatar}
          alt=""
          className="h-9 w-9 rounded-full bg-neutral-200 object-cover dark:bg-neutral-700"
        />
        <span className="hidden flex-col leading-tight 2xl:flex">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            {user.name}
          </span>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
            {user.email}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <Popover open={open} className="right-0 w-72">
        <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 dark:bg-white/5">
          <img
            src={user.avatar}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-neutral-400">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-[#E8472B]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#E8472B]">
              {user.role}
            </span>
          </div>
        </div>

        <div className="mt-1">
          {PROFILE_LINKS.map((l) => (
            <MenuRow key={l.id} icon={l.icon} label={l.label} onClick={close} />
          ))}
        </div>

        <div className="mt-1 border-t border-neutral-100 pt-1 dark:border-white/10">
          <MenuRow icon={LogOut} label="Sign out" onClick={close} danger />
        </div>
      </Popover>
    </div>
  );
}
