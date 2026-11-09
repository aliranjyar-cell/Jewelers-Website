# Production hosting checklist

The application can run as a single Node.js service: build the React SPA, let Express serve `client/dist`, and route `/api` requests to the same process. The service listens on `0.0.0.0` and uses the host-provided `PORT` when present.

## Before launch

1. Choose a Node.js Active or Maintenance LTS runtime and a managed MySQL database reachable from the app. XAMPP is for local development; do not expose its development MySQL instance to the public internet.
2. Create a production database and a dedicated least-privilege database user. Import `database/schema.sql`, then apply every SQL migration in numeric order, including both `002` migrations and `008_campaigns.sql`.
3. Configure the service environment: `NODE_ENV=production`, `PORT` as required by the host, `CLIENT_ORIGIN=https://your-domain`, production `DB_*` values, and a private Base64-encoded 32-byte `AUTH_ENCRYPTION_KEY`.
4. Configure HTTPS and the reverse proxy. Set `TRUST_PROXY_HOPS` only to the actual trusted proxy count so secure session cookies and client IP handling work correctly.
5. Set `UPLOADS_DIR` to a persistent mounted volume. Product photos are written to its `products` subfolder and campaign uploads to `campaigns`. Local ephemeral disk is not suitable for customer-facing product imagery.
6. Install dependencies, build the client with `npm run build`, then start the service with `npm start`. Confirm `/api/health`, the storefront, account login, checkout, and `/admin/login` after deployment.
7. Create the first administrator using the one-time setup command described in the root README. Back up the database and persistent upload volume and rehearse restoring both.

## Hosting boundaries

- A hosting provider, domain, payment merchant account, and SMS/OTP provider have not been selected or configured.
- Easypaisa checkout is currently a recorded payment preference/workflow; this does not represent a live Easypaisa gateway integration or automatic payment confirmation.
- Customer account verification by SMS/email is not configured. Confirm business identity, store address, phone, hours, return policy, delivery coverage, and jewelry assurance claims before public launch.
- Configure monitoring, database backups, log retention, rate limits at the edge, and a privacy notice before accepting real orders.

Use an LTS runtime for production rather than a Current or end-of-life release, as recommended by the [Node.js release schedule](https://nodejs.org/en/about/previous-releases).
