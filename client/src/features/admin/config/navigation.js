import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleHelp,
  CreditCard,
  FolderOpen,
  LayoutGrid,
  Mail,
  Plug,
  ReceiptText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";

/* ------------------------------ Sidebar ------------------------------ */
export const SIDEBAR_SECTIONS = [
  {
    title: "Main",
    items: [
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
      { id: "wallets", label: "Wallets", icon: Wallet },
      { id: "cards", label: "Cards", icon: CreditCard },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "invoices", label: "Invoices", icon: ReceiptText },
      { id: "calendar", label: "Calendar", icon: CalendarDays },
      { id: "messages", label: "Messages", icon: Mail, badge: 4 },
      { id: "team", label: "Team", icon: Users },
      { id: "documents", label: "Documents", icon: FolderOpen },
    ],
  },
  {
    title: "System",
    items: [
      { id: "integrations", label: "Integrations", icon: Plug },
      { id: "security", label: "Security", icon: ShieldCheck },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

/* ------------------------------- Header ------------------------------ */
export const HEADER_TABS = [
  "Overview",
  "Activity",
  "Manage",
  "Program",
  "Account",
  "Reports",
];

export const SEARCH_ITEMS = [
  { id: "s1", label: "Transfer money", hint: "Action", icon: ArrowUpRight },
  { id: "s2", label: "Request payment", hint: "Action", icon: ArrowDownLeft },
  { id: "s3", label: "Wallets", hint: "Page", icon: Wallet },
  { id: "s4", label: "Invoices", hint: "Page", icon: ReceiptText },
  { id: "s5", label: "Reports", hint: "Page", icon: BarChart3 },
  { id: "s6", label: "Team members", hint: "Page", icon: Users },
  { id: "s7", label: "Settings", hint: "Page", icon: Settings },
];

export const QUICK_ACTIONS = [
  { id: "q1", label: "Transfer", hint: "Send money to a wallet", icon: ArrowUpRight },
  { id: "q2", label: "Request", hint: "Ask for a payment", icon: ArrowDownLeft },
  { id: "q3", label: "New invoice", hint: "Create and send an invoice", icon: ReceiptText },
  { id: "q4", label: "Add wallet", hint: "Connect a new currency", icon: Wallet },
];

export const NOTIFICATIONS = [
  {
    id: 1,
    icon: ArrowDownLeft,
    tone: "success",
    title: "Payment received",
    body: "$2,421.35 was credited to your USD wallet.",
    time: "2m ago",
    unread: true,
  },
  {
    id: 2,
    icon: ShieldAlert,
    tone: "warning",
    title: "New sign-in detected",
    body: "Chrome on Windows signed in to your account.",
    time: "28m ago",
    unread: true,
  },
  {
    id: 3,
    icon: Users,
    tone: "info",
    title: "Team invitation accepted",
    body: "A new member joined the Design workspace.",
    time: "1h ago",
    unread: true,
  },
  {
    id: 4,
    icon: Sparkles,
    tone: "info",
    title: "Monthly report ready",
    body: "Your October summary is ready to download.",
    time: "Yesterday",
    unread: false,
  },
];

export const PROFILE_LINKS = [
  { id: "p1", label: "My profile", icon: User },
  { id: "p2", label: "Billing & plans", icon: CreditCard },
  { id: "p3", label: "Account settings", icon: Settings },
  { id: "p4", label: "Help & support", icon: CircleHelp },
];
