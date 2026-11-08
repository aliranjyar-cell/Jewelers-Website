# Jewelry storefront

React single-page storefront and admin application with a Node.js API and MySQL database.

## Current setup

- `client/`: React, Vite, Tailwind CSS, and client-side routes
- `server/`: Express API and MySQL connection pool
- `database/schema.sql`: initial database schema
- `docs/architecture.md`: architecture and implementation sequence

## Local development

1. Install Node.js 22.12+ (the current environment has Node.js 24).
2. Start Apache/MySQL in XAMPP and create a database named `jewelry_store` using `utf8mb4`.
3. Import `database/schema.sql` through phpMyAdmin or the MySQL client, then apply migrations `001_admin_auth.sql`, `002_admin_dashboard_indexes.sql`, and `003_product_management.sql` in order.
4. Copy `server/.env.example` to `server/.env`, set the local database credentials, and set `AUTH_ENCRYPTION_KEY` to a private Base64-encoded 32-byte key (generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`).
5. Install workspace dependencies with `npm install` from the project root.
6. Run both applications with `npm run dev` from the root.

The API health route is `http://127.0.0.1:4000/api/health`. The Vite server proxies `/api` requests to the API during local development.

Create the first administrator from an interactive terminal with `npm run admin:create -w server`. The command requires a valid password and authenticator code before it creates the account. Admin sign-in is at `/admin/login`; after authentication it opens a protected placeholder page for the future admin panel.

Do not use the XAMPP root account or local settings for a public production deployment. Production credentials, hosting, HTTPS, backups, trusted proxy configuration, and database access controls must be configured separately before launch. In production, `CLIENT_ORIGIN` must exactly match the HTTPS browser origin. Set `TRUST_PROXY_HOPS` only to the number of trusted reverse proxies in front of the API.
