# Admin dashboard

## Where the files go (client/src/features/admin/)

```
AdminDashboardPage.jsx            ← replaces your existing file
dashboard/
├── constants.js                  ranges, thresholds, admin route paths, status labels
├── components/
│   ├── ui.jsx                    Card, Badge, Segmented, Delta, EmptyState, …
│   ├── DashboardHeader.jsx       title, date range, refresh + last-updated
│   ├── SummaryCards.jsx          revenue (paid vs pending), orders, AOV, customers
│   ├── SalesChart.jsx            SVG area chart + revenue/orders + chart/table views
│   ├── AttentionList.jsx         orders & custom requests waiting on the seller
│   ├── StockAlerts.jsx           out of stock, low stock, drafts, missing info
│   ├── MetalRates.jsx            published rates + stale/missing alerts
│   ├── TopProducts.jsx           best sellers by units or revenue
│   └── RecentActivity.jsx        recent orders / custom-request timeline
├── hooks/    useDashboardData.js, useNow.js, useElementWidth.js
├── services/ dashboardApi.js     fetch + response normalisation
├── utils/    format.js           PKR, dates (Asia/Karachi), % change, ages
└── mocks/    dashboardMock.js    DEV-ONLY preview data (see below)
```

No new packages are needed (charts are plain SVG). `lucide-react` and `react-router` are already installed.

## API contract

`GET /api/admin/dashboard?range=today|7d|30d|90d` (session cookie, `credentials: "include"`).
Every field is optional — missing parts render as empty states. Full shape is documented at the top of
`services/dashboardApi.js`. Important rules for the backend:

- `series[].revenue` and `summary.revenue.paid` must count **paid orders only**.
- `summary.revenue.pending` = value of placed-but-unpaid orders (shown separately).
- `previousSeries` must have the same length as `series` (the matching previous period).
- Respond `401` when the session has expired — the page redirects to `/admin/login`.
- `attention.counts` / `stock.counts` should be real totals even when `items` is truncated.

Set `VITE_API_URL` in `client/.env` if the API is on a different origin than the Vite dev server.

## Previewing the layout without a backend

Create `client/.env.local`:

```
VITE_DASHBOARD_MOCK=true
```

Restart `npm run dev`. This only works in development; production builds strip the mock
completely, so real shops never see invented numbers. Delete the line to use the real API.

## Routes

Links point at the paths in `constants.js → adminPaths` (`/admin/orders/:id`,
`/admin/custom-requests/:id`, `/admin/products/:id/edit`, `/admin/metal-rates`).
Change them there if your routes differ.
