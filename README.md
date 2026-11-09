# Jewelry storefront

React single-page storefront and admin application with a Node.js API and MySQL database.

## Current setup

- `client/`: React, Vite, Tailwind CSS, and client-side routes
- `server/`: Express API and MySQL connection pool
- `database/schema.sql`: initial database schema
- `docs/architecture.md`: architecture and implementation sequence

## Local development

1. Install an Active or Maintenance LTS release of Node.js. Node.js 24 LTS is the preferred baseline for a new production install.
2. Start Apache/MySQL in XAMPP and create a database named `jewelry_store` using `utf8mb4`.
3. Import `database/schema.sql` through phpMyAdmin, then apply every SQL file in `database/migrations` in ascending numeric prefix order. Apply both files with the `002` prefix.
4. Copy `server/.env.example` to `server/.env`, set the local database credentials, and set `AUTH_ENCRYPTION_KEY` to a private Base64-encoded 32-byte key (generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`).
5. Install workspace dependencies with `npm install` from the project root.
6. Run both applications with `npm run dev` from the root.

The API health route is `http://127.0.0.1:4000/api/health`. The Vite server proxies `/api` and `/uploads` requests to the API during local development. Run `npm run build` to create the production SPA; the Node server serves `client/dist` and provides client-side route fallback when that build exists.

Create the first administrator from an interactive terminal with `npm run admin:create -w server`. The command requires a valid password and authenticator code before it creates the account. Admin sign-in is at `/admin/login`.

Do not use the XAMPP root account or local settings for a public production deployment. Production credentials, hosting, HTTPS, backups, trusted proxy configuration, and database access controls must be configured separately before launch. In production, `CLIENT_ORIGIN` must exactly match the HTTPS browser origin. Set `TRUST_PROXY_HOPS` only to the number of trusted reverse proxies in front of the API. See [docs/hosting.md](docs/hosting.md) for the deployment checklist and [Campaigns](#advertising-campaigns) for the advertising migration.

## Advertising campaigns

After applying `database/migrations/008_campaigns.sql` and `009_campaign_hero_style.sql`, an administrator can create hero, announcement, and homepage feature campaigns from `/admin/campaigns`. Hero campaigns support alignment and text color. Upload artwork in the admin panel; use persistent media storage for hosted environments. Drafts and scheduled campaigns do not appear publicly until their active period.
