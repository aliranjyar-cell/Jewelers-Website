# Initial architecture

## Product direction

- Single-page customer storefront built with React. Use client-side routing and load page data through an API so navigation feels quick without requiring a full page reload.
- Admin area is part of the same React application, protected by server-side authorization.
- Node.js API is the only path from the browser to MySQL. Never connect the browser directly to the database.
- MySQL is the local development database through XAMPP. Production hosting and database are a later launch decision.

## Proposed repository layout

```text
client/                 React SPA (storefront and admin)
  src/
    app/                routes, application providers
    components/         shared UI
    features/           catalog, cart, checkout, account, admin
    lib/                API client and shared helpers
    styles/
server/                 Node.js API
  src/
    config/             environment and database setup
    middleware/         authentication, authorization, validation, errors
    modules/             feature routes, controllers, services, repositories
    shared/             common utilities
database/
  schema.sql            initial MySQL schema
  migrations/           ordered schema changes after the initial schema
docs/                   product and technical decisions
```

## Key data decisions

- A catalog product may be ready-made, custom-made, or offered in both forms.
- A sellable variant (for example, ring size) carries its own SKU, stock and metal weight.
- A variant uses either a fixed price or metal-weight pricing. Metal-weight pricing is calculated from the admin-published rate for the metal and purity, multiplied by weight, plus the making charge. The making charge can be a fixed amount or an amount per gram.
- The API calculates prices. The browser may display an estimate, but submitted prices are never trusted.
- Each order item stores a snapshot of the chosen product details and price calculation. Later catalog or rate changes must not rewrite past orders.
- Custom orders begin as a request for seller review. The seller approves the specification and quoted price before it becomes a confirmed order.
- Keep payment provider references and statuses only; do not store card or wallet credentials.

## Performance and security direction

- Keep storefront routes and admin routes as feature bundles so the SPA can load the admin code only when needed.
- Paginate catalog and admin lists at the API. Resize and serve product images in suitable formats and sizes.
- Use database indexes for common lookups, parameterized queries, validated request bodies, secure password hashing, and role checks on every protected API operation.
- Store secrets in environment configuration, not source control. Use HTTPS and production backups before launch.

## First build sequence

1. Review the initial schema against product and checkout rules.
2. Scaffold client and server, environment configuration, and a database connection.
3. Implement authentication and admin authorization.
4. Implement admin catalog, variants, stock, and metal-rate management.
5. Implement storefront catalog and product details.
6. Implement cart, checkout, order snapshots, and custom-order requests.
7. Add payment and delivery integrations after provider and operational decisions are confirmed.
