import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Moon, Search, Sun } from "lucide-react";
import useClickOutside from "../hooks/useClickOutside";
import { SEARCH_ITEMS } from "../config/navigation";
import { useStoreBrand } from '../../../contexts/StoreBrandContext.jsx';

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
}

export default function Header({
  currentPage = "Dashboard",
  onMenuClick = () => {},
  onNavigate = () => {},
  theme = "light",
  onToggleTheme = () => {},
  user = {},
}) {
  const { storeName } = useStoreBrand();
  return (
    <header className="relative z-30 flex h-[76px] shrink-0 items-center gap-3 px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-[#141416] dark:text-neutral-200 dark:ring-white/10 dark:hover:bg-white/5 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-[155px] xl:block">
        <p className="max-w-full truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">{storeName}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-neutral-900 dark:text-white">{currentPage}</p>
      </div>

      <SearchBox onNavigate={onNavigate} />

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-black/5 outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-[#141416] dark:text-neutral-300 dark:ring-white/10 dark:hover:bg-white/5"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 ring-1 ring-teal-700/10 dark:bg-teal-400/15 dark:text-teal-100 dark:ring-teal-300/20">
            {initials(user.name)}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-36 truncate text-xs font-semibold text-neutral-800 dark:text-neutral-100">{user.name || "Administrator"}</span>
            <span className="mt-0.5 block text-[10px] text-neutral-400 dark:text-neutral-500">Administrator</span>
          </span>
        </div>
      </div>
    </header>
  );
}

function SearchBox({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapperRef, close, open);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value
      ? SEARCH_ITEMS.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(value))
      : SEARCH_ITEMS;
  }, [query]);

  function select(item) {
    onNavigate(item.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0 flex-1 xl:mx-auto xl:max-w-[430px]">
      <div className={`flex h-11 items-center gap-3 rounded-full bg-white px-4 shadow-sm ring-1 ring-black/5 transition-shadow dark:bg-[#141416] dark:ring-white/10 ${open ? "ring-2 ring-teal-600/35" : ""}`}>
        <Search className="h-[17px] w-[17px] shrink-0 text-neutral-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setQuery(""); close(); inputRef.current?.blur(); }
            if (event.key === "Enter" && results[0]) { event.preventDefault(); select(results[0]); }
          }}
          type="search"
          placeholder="Search admin sections…"
          aria-label="Search admin sections"
          aria-expanded={open}
          aria-controls="admin-search-results"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="hidden shrink-0 rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-500 dark:bg-white/10 dark:text-neutral-400 sm:block">Ctrl K</kbd>
      </div>

      {open && (
        <div id="admin-search-results" role="listbox" aria-label="Admin sections" className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl shadow-black/10 ring-1 ring-black/5 dark:bg-[#1A1A1D] dark:ring-white/10">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{query ? "Sections" : "Go to"}</p>
          {results.length ? results.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" role="option" onClick={() => select(item)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-white/5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-neutral-900 dark:text-white">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-neutral-500 dark:text-neutral-400">{item.hint}</span>
                </span>
                <span className="text-xs text-neutral-400">↵</span>
              </button>
            );
          }) : <p className="px-3 py-5 text-center text-xs text-neutral-400">No admin section matches “{query}”.</p>}
        </div>
      )}
    </div>
  );
}
