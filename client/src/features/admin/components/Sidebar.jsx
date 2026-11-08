import { useEffect, useRef, useState } from "react";
import { CircleHelp, LogOut, Pin, PinOff, X } from "lucide-react";
import { SIDEBAR_SECTIONS } from "../config/navigation";

export const SIDEBAR_COLLAPSED = 72;
export const SIDEBAR_EXPANDED = 264;
const GUTTER = 12;

const surface =
  "bg-white ring-1 ring-black/5 dark:bg-[#141416] dark:ring-white/10";

/** Fade + slide for labels that appear when the sidebar opens. */
const reveal = (expanded) =>
  `whitespace-nowrap transition-all duration-300 ease-out motion-reduce:transition-none ${
    expanded
      ? "translate-x-0 opacity-100 delay-75"
      : "pointer-events-none -translate-x-2 opacity-0"
  }`;

/* -------------------------------------------------------------------------- */

export default function Sidebar({
  activeId = "overview",
  onNavigate = () => {},
  pinned = false,
  onPinChange = () => {},
  mobileOpen = false,
  onMobileClose = () => {},
  onHelp = () => {},
  onLogout = () => {},
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef(null);

  // Small intent delay so a stray cursor pass doesn't flicker the panel.
  const handleEnter = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHovered(true), 80);
  };
  const handleLeave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHovered(false), 140);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onMobileClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  const expanded = hovered || focused || pinned;

  const panelProps = {
    activeId,
    pinned,
    onPinChange,
    onHelp,
    onLogout,
  };

  return (
    <>
      {/* ---------------------------- Desktop ---------------------------- */}
      <div
        className="relative hidden shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:block"
        style={{
          width:
            (pinned ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED) + GUTTER * 2,
        }}
      >
        <aside
          aria-label="Sidebar"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onFocus={(e) => e.target.matches(":focus-visible") && setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
          }}
          style={{ width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
          className={`absolute bottom-3 left-3 top-3 z-40 overflow-hidden rounded-[28px] transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${surface} ${
            expanded && !pinned
              ? "shadow-2xl shadow-black/10 dark:shadow-black/50"
              : "shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          }`}
        >
          <Panel
            {...panelProps}
            expanded={expanded}
            onNavigate={onNavigate}
          />
        </aside>
      </div>

      {/* ------------------------ Mobile drawer -------------------------- */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          mobileOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={onMobileClose}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          aria-label="Sidebar"
          className={`absolute bottom-3 left-3 top-3 w-[264px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[28px] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${surface} ${
            mobileOpen ? "translate-x-0" : "-translate-x-[110%]"
          }`}
        >
          <Panel
            {...panelProps}
            expanded
            showPin={false}
            onClose={onMobileClose}
            onNavigate={(id) => {
              onNavigate(id);
              onMobileClose();
            }}
          />
        </aside>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Panel({
  expanded,
  activeId,
  onNavigate,
  pinned,
  onPinChange,
  onHelp,
  onLogout,
  onClose,
  showPin = true,
}) {
  return (
    <div className="flex h-full w-full flex-col p-3">
      {/* Brand */}
      <div className="flex h-12 shrink-0 items-center">
        <span className="grid h-12 w-12 shrink-0 place-items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#F2643F] to-[#D9341B] text-lg font-bold text-white shadow-md shadow-[#E8472B]/30">
            V
          </span>
        </span>
        <div className={`min-w-0 flex-1 leading-tight ${reveal(expanded)}`}>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-950 dark:text-white">
            Vertix
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Finance workspace
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="mr-1 grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main"
        className="-mx-1 mt-3 flex-1 overflow-y-auto overflow-x-hidden px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <SectionLabel title={section.title} expanded={expanded} />
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.id}>
                  <NavItem
                    item={item}
                    active={item.id === activeId}
                    expanded={expanded}
                    onClick={() => onNavigate(item.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-2 shrink-0 space-y-1 border-t border-neutral-200/80 pt-3 dark:border-white/10">
        <FooterItem
          icon={CircleHelp}
          label="Help & support"
          expanded={expanded}
          onClick={onHelp}
        />
        {showPin && (
          <FooterItem
            icon={pinned ? PinOff : Pin}
            label={pinned ? "Unpin sidebar" : "Pin sidebar"}
            expanded={expanded}
            onClick={() => onPinChange(!pinned)}
          />
        )}
        <FooterItem
          icon={LogOut}
          label="Log out"
          expanded={expanded}
          onClick={onLogout}
          danger
        />
      </div>
    </div>
  );
}

function SectionLabel({ title, expanded }) {
  return (
    <div className="relative flex h-8 items-center">
      <span
        aria-hidden
        className={`absolute inset-x-2 h-px bg-neutral-200 transition-opacity duration-300 dark:bg-white/10 ${
          expanded ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`pl-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 ${reveal(
          expanded
        )}`}
      >
        {title}
      </span>
    </div>
  );
}

function NavItem({ item, active, expanded, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      title={expanded ? undefined : item.label}
      className={`group/item relative flex h-12 w-full items-center rounded-2xl text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 ${
        active
          ? "bg-neutral-950 text-white shadow-lg shadow-black/10 dark:bg-white dark:text-neutral-950"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
      }`}
    >
      <span className="relative grid h-12 w-12 shrink-0 place-items-center">
        <Icon className="h-[19px] w-[19px] transition-transform duration-200 group-hover/item:scale-110" />
        {item.badge && !expanded && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#E8472B] ring-2 ring-white dark:ring-[#141416]" />
        )}
      </span>
      <span className={`flex-1 truncate text-left ${reveal(expanded)}`}>
        {item.label}
      </span>
      {item.badge && (
        <span
          className={`mr-3 grid h-5 min-w-5 place-items-center rounded-full bg-[#E8472B] px-1.5 text-[11px] font-semibold text-white ${reveal(
            expanded
          )}`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}

function FooterItem({ icon: Icon, label, expanded, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={expanded ? undefined : label}
      className={`flex h-11 w-full items-center rounded-2xl text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#E8472B]/60 ${
        danger
          ? "text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
      }`}
    >
      <span className="grid h-11 w-12 shrink-0 place-items-center">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className={`flex-1 truncate text-left ${reveal(expanded)}`}>
        {label}
      </span>
    </button>
  );
}
