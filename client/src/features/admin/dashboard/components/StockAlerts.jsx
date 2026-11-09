import { useMemo, useState } from "react";
import { CircleCheck, ImageOff, Package, PackageMinus, PackageX, Pencil } from "lucide-react";
import { adminPaths } from "../constants";
import { formatNumber } from "../utils/format";
import { ActionLink, Badge, Card, CardHeader, EmptyState, IconTile, Segmented, Skeleton, TextLink } from "./ui";

const TABS = {
  out_of_stock: { label: "Out of stock", icon: PackageX, tone: "danger", action: "Receive stock" },
  low_stock: { label: "Low stock", icon: PackageMinus, tone: "warning", action: "Receive stock" },
  draft: { label: "Drafts", icon: Pencil, tone: "info", action: "Edit product" },
  incomplete: { label: "Needs info", icon: ImageOff, tone: "accent", action: "Complete" },
};

const MISSING_LABELS = {
  images: "images",
  image: "image",
  description: "description",
  weight: "weight",
  purity: "metal purity",
  price: "price",
  category: "category",
  sku: "SKU",
};

const MAX_ROWS = 5;

function describe(item) {
  const variant = item.variant ? `${item.variant} · ` : "";
  switch (item.type) {
    case "out_of_stock":
      return `${variant}0 in stock`;
    case "low_stock":
      return `${variant}${formatNumber(item.stock)} left${
        item.threshold ? ` (alert at ${formatNumber(item.threshold)})` : ""
      }`;
    case "draft":
      return "Unpublished — not visible in the store";
    case "incomplete": {
      const missing = (item.missing ?? []).map((m) => MISSING_LABELS[m] ?? m);
      return missing.length ? `Missing ${missing.join(", ")}` : "Missing important details";
    }
    default:
      return "";
  }
}

export default function StockAlerts({ stock, loading, className = "", delay = 0 }) {
  const [selected, setSelected] = useState(null);
  const items = stock?.items ?? [];

  const counts = useMemo(() => {
    const result = { out_of_stock: 0, low_stock: 0, draft: 0, incomplete: 0 };
    if (stock?.counts) {
      Object.keys(result).forEach((k) => (result[k] = Number(stock.counts[k]) || 0));
    } else {
      items.forEach((item) => {
        if (result[item.type] !== undefined) result[item.type] += 1;
      });
    }
    return result;
  }, [stock, items]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Default to the most urgent tab that has something in it.
  const activeTab =
    selected ?? Object.keys(TABS).find((key) => counts[key] > 0) ?? "out_of_stock";
  const visible = items.filter((item) => item.type === activeTab).slice(0, MAX_ROWS);
  const tab = TABS[activeTab];

  return (
    <Card delay={delay} className={`p-5 ${className}`}>
      <CardHeader
        title="Product & stock alerts"
        subtitle="Items that need your attention in the catalogue"
        badge={
          !loading && total > 0 ? (
            <Badge tone="warning" className="px-2.5 py-0.5 text-xs">
              {total}
            </Badge>
          ) : null
        }
        action={<TextLink to={adminPaths.products}>All products</TextLink>}
      />

      <div className="mt-4">
        <Segmented
          label="Alert type"
          value={activeTab}
          onChange={setSelected}
          options={Object.entries(TABS).map(([value, t]) => ({
            value,
            label: t.label,
            count: counts[value],
          }))}
        />
      </div>

      {loading ? (
        <ul className="mt-4 space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 !rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={CircleCheck}
          tone="success"
          title={`No ${tab.label.toLowerCase()} products`}
          description="Everything in this category looks good."
        />
      ) : (
        <>
          <ul className="mt-3 space-y-0.5">
            {visible.map((item) => (
              <li
                key={`${item.type}-${item.id}-${item.variant ?? ""}`}
                className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors duration-200 hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                <Thumb item={item} tab={tab} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {describe(item)}
                  </p>
                </div>
                <ActionLink to={item.type === "out_of_stock" || item.type === "low_stock" ? adminPaths.inventory : adminPaths.productEdit(item.id)}>{tab.action}</ActionLink>
              </li>
            ))}
          </ul>
          {counts[activeTab] > visible.length && (
            <div className="mt-3 flex justify-end">
              <TextLink to={`${adminPaths.products}?filter=${activeTab}`}>
                View all {counts[activeTab]}
              </TextLink>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function Thumb({ item, tab }) {
  const [failed, setFailed] = useState(false);
  if (item.image && !failed) {
    return (
      <img
        src={item.image}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-2xl bg-neutral-100 object-cover dark:bg-white/10"
      />
    );
  }
  return <IconTile icon={item.image === undefined ? tab.icon : Package} tone={tab.tone} className="h-11 w-11" />;
}
