import { Coins, Gem, LayoutGrid, Package, ShoppingBag } from "lucide-react";

export const ADMIN_PAGES = [
  { id: "overview", label: "Dashboard", path: "/admin", icon: LayoutGrid, hint: "Store performance and daily work" },
  { id: "products", label: "Products", path: "/admin/products", icon: Package, hint: "Jewelry catalog and stock" },
  { id: "orders", label: "Orders", path: "/admin/orders", icon: ShoppingBag, hint: "Customer orders and fulfillment" },
  { id: "custom-requests", label: "Custom requests", path: "/admin/custom-requests", icon: Gem, hint: "Made-to-order customer requests" },
  { id: "metal-rates", label: "Metal rates", path: "/admin/metal-rates", icon: Coins, hint: "Published gold and silver rates" },
];

export const NAV_ROUTES = Object.fromEntries(ADMIN_PAGES.map(({ id, path }) => [id, path]));

export const SIDEBAR_SECTIONS = [
  { title: "Store", items: ADMIN_PAGES.slice(0, 3) },
  { title: "Customer care", items: [ADMIN_PAGES[3]] },
  { title: "Pricing", items: [ADMIN_PAGES[4]] },
];

export const SEARCH_ITEMS = ADMIN_PAGES;
