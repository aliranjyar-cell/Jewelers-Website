import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { adminAuth } from "../../lib/api.js";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import useTheme from "./hooks/useTheme";
import { ADMIN_PAGES, NAV_ROUTES } from "./config/navigation";

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
 * Fixed 100vh admin shell: checks the session once, then renders the
 * selected admin page in <Outlet />. Only <main> scrolls.
 */
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [auth, setAuth] = useState({ loading: true, user: null, csrfToken: null });
  const [logoutError, setLogoutError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(readPinned);

  // Session check (runs once — the layout stays mounted while you move between pages)
  useEffect(() => {
    let active = true;
    adminAuth
      .current()
      .then((result) => {
        if (active) setAuth({ loading: false, user: result.user, csrfToken: result.csrfToken });
      })
      .catch(() => {
        if (active) setAuth({ loading: false, user: null, csrfToken: null });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PIN_KEY, pinned ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [pinned]);

  async function signOut() {
    setLogoutError("");
    try {
      await adminAuth.logout(auth.csrfToken);
      window.location.assign("/admin/login");
    } catch {
      setLogoutError("Could not sign out. Please try again.");
    }
  }

  function handleNavigate(id) {
    const destination = NAV_ROUTES[id];
    if (destination) navigate(destination);
  }

  const currentPage = ADMIN_PAGES.find((page) =>
    page.path === "/admin"
      ? location.pathname === page.path
      : location.pathname === page.path || location.pathname.startsWith(`${page.path}/`)
  ) ?? ADMIN_PAGES[0];

  if (auth.loading) {
    return (
      <main className="grid h-screen place-items-center bg-[#F4F3F5] text-sm text-neutral-500 dark:bg-[#0A0A0B] dark:text-neutral-400">
        Checking administrator session…
      </main>
    );
  }
  if (!auth.user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F3F5] text-neutral-900 antialiased supports-[height:100dvh]:h-dvh dark:bg-[#0A0A0B] dark:text-neutral-100">
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-neutral-950 px-4 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Sidebar
        activeId={currentPage.id}
        onNavigate={handleNavigate}
        pinned={pinned}
        onPinChange={setPinned}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={signOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          currentPage={currentPage.label}
          onMenuClick={() => setMobileOpen(true)}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
          user={{
            name: auth.user.name,
            email: auth.user.email ?? "",
            role: "Administrator",
          }}
        />

        {/* The only scrolling region */}
        <main
          id="main"
          className="min-h-0 flex-1 scroll-smooth overflow-y-auto overscroll-contain px-4 pb-10 pt-2 [scrollbar-color:#d4d4d8_transparent] [scrollbar-width:thin] dark:[scrollbar-color:#3f3f46_transparent] sm:px-6"
        >
          <div className="mx-auto w-full max-w-[1600px]">
            {logoutError && (
              <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                {logoutError}
              </p>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
