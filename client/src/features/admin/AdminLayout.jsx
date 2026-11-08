import { useEffect, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import useTheme from "./hooks/useTheme";
import AdminHomePage from "./AdminHomePage.jsx";


const PIN_KEY = "sidebar-pinned";

function readPinned() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PIN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Fixed 100vh application shell.
 * Header and sidebar never move — only <main> scrolls.
 */
export default function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState("overview");
  const [activeTab, setActiveTab] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(readPinned);

  useEffect(() => {
    try {
      window.localStorage.setItem(PIN_KEY, pinned ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [pinned]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F3F5] text-neutral-900 antialiased supports-[height:100dvh]:h-dvh dark:bg-[#0A0A0B] dark:text-neutral-100">
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-neutral-950 px-4 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Sidebar
        activeId={activeNav}
        onNavigate={setActiveNav}
        pinned={pinned}
        onPinChange={setPinned}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMenuClick={() => setMobileOpen(true)}
          onNavigate={setActiveNav}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* The only scrolling region */}
        <main
          id="main"
          className="min-h-0 flex-1 scroll-smooth overflow-y-auto overscroll-contain px-4 pb-10 pt-2 [scrollbar-color:#d4d4d8_transparent] [scrollbar-width:thin] dark:[scrollbar-color:#3f3f46_transparent] sm:px-6"
        >
          <div className="mx-auto w-full max-w-[1600px]"><AdminHomePage /></div>
        </main>
      </div>
    </div>
  );
}
