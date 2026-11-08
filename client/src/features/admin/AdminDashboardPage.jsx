import { Navigate, useSearchParams } from "react-router";
// If your pages still wrap themselves in the layout, uncomment this and wrap
// the returned JSX in <AdminLayout> … </AdminLayout>.
// import AdminLayout from "./AdminLayout.jsx";

import { DEFAULT_RANGE, RANGES } from "./dashboard/constants";
import useDashboardData from "./dashboard/hooks/useDashboardData";
import DashboardHeader from "./dashboard/components/DashboardHeader";
import SummaryCards from "./dashboard/components/SummaryCards";
import SalesChart from "./dashboard/components/SalesChart";
import AttentionList from "./dashboard/components/AttentionList";
import StockAlerts from "./dashboard/components/StockAlerts";
import MetalRates from "./dashboard/components/MetalRates";
import TopProducts from "./dashboard/components/TopProducts";
import RecentActivity from "./dashboard/components/RecentActivity";
import { ErrorBanner } from "./dashboard/components/ui";

export default function AdminDashboardPage() {
  const [params, setParams] = useSearchParams();

  // The selected range lives in the URL (?range=30d) so it survives refresh and can be shared.
  const requested = params.get("range");
  const range = RANGES.find((r) => r.value === requested) ?? RANGES.find((r) => r.value === DEFAULT_RANGE);

  const { data, status, error, updatedAt, refresh } = useDashboardData(range.value);
  const loading = status === "loading";
  const refreshing = status === "refreshing";

  const changeRange = (value) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("range", value);
        return next;
      },
      { replace: true }
    );

  if (error?.status === 401 || error?.status === 403) return <Navigate to="/admin/login" replace />;

  return (
    <div className="space-y-6 pb-6">
      <DashboardHeader
        range={range}
        onRangeChange={changeRange}
        onRefresh={refresh}
        refreshing={refreshing}
        loading={loading}
        updatedAt={updatedAt}
      />

      {error && (
        <ErrorBanner
          message={
            data
              ? "We couldn’t refresh the dashboard. You’re looking at the last loaded data."
              : error.message
          }
          onRetry={refresh}
        />
      )}

      {/* With no data and an error there is nothing meaningful to draw. */}
      {!(error && !data) && (
        <>
          <SummaryCards summary={data?.summary} range={range} loading={loading} />

          {/*
            Mobile order (top → bottom): attention, stock, sales, metal rates, best sellers, activity.
            Desktop (xl): sales | attention, stock | metal rates, best sellers | activity.
          */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <SalesChart
              series={data?.series}
              previousSeries={data?.previousSeries}
              granularity={data?.granularity}
              range={range}
              loading={loading}
              delay={240}
              className="order-3 xl:order-1 xl:col-span-8"
            />
            <AttentionList
              attention={data?.attention}
              loading={loading}
              delay={280}
              className="order-1 xl:order-2 xl:col-span-4"
            />
            <StockAlerts
              stock={data?.stock}
              loading={loading}
              delay={320}
              className="order-2 xl:order-3 xl:col-span-7"
            />
            <MetalRates
              rates={data?.metalRates}
              loading={loading}
              delay={360}
              className="order-4 xl:order-4 xl:col-span-5"
            />
            <TopProducts
              products={data?.topProducts}
              range={range}
              loading={loading}
              delay={400}
              className="order-5 xl:order-5 xl:col-span-5"
            />
            <RecentActivity
              recent={data?.recent}
              loading={loading}
              delay={440}
              className="order-6 xl:order-6 xl:col-span-7"
            />
          </div>
        </>
      )}
    </div>
  );
}
