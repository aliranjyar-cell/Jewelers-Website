import { Coins, Gem, LayoutGrid, Megaphone, Package, Settings, ShoppingBag, Warehouse } from "lucide-react";

export const ADMIN_PAGES = [
  { id: "overview", label: "Dashboard", path: "/admin", icon: LayoutGrid, hint: "Store performance and daily work" },
  { id: "products", label: "Products", path: "/admin/products", icon: Package, hint: "Jewelry catalog and stock" },
  { id: "inventory", label: "Inventory", path: "/admin/inventory", icon: Warehouse, hint: "Stock counts and movement history" },
  { id: "orders", label: "Orders", path: "/admin/orders", icon: ShoppingBag, hint: "Customer orders and fulfillment" },
  { id: "custom-requests", label: "Custom requests", path: "/admin/custom-requests", icon: Gem, hint: "Made-to-order customer requests" },
  { id: "metal-rates", label: "Metal rates", path: "/admin/metal-rates", icon: Coins, hint: "Published gold and silver rates" },
  { id: "campaigns", label: "Advertising", path: "/admin/campaigns", icon: Megaphone, hint: "Homepage promotions and campaigns" },
  { id: "settings", label: "Website settings", path: "/admin/settings", icon: Settings, hint: "Store name and website identity" },
];

export const NAV_ROUTES = Object.fromEntries(ADMIN_PAGES.map(({ id, path }) => [id, path]));

export const SIDEBAR_SECTIONS = [
  { title: "Store", items: ADMIN_PAGES.slice(0, 4) },
  { title: "Customer care", items: [ADMIN_PAGES[4]] },
  { title: "Pricing", items: [ADMIN_PAGES[5]] },
  { title: "Marketing", items: [ADMIN_PAGES[6]] },
  { title: "Configuration", items: [ADMIN_PAGES[7]] },
];

export const SEARCH_ITEMS = ADMIN_PAGES;
