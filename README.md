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
3. Import `database/schema.sql` through phpMyAdmin or the MySQL client.
4. Copy `server/.env.example` to `server/.env` and set the local database credentials.
5. Install workspace dependencies with `npm install` from the project root.
6. Run both applications with `npm run dev` from the root.

The API health route is `http://127.0.0.1:4000/api/health`. The Vite server proxies `/api` requests to the API during local development.

Do not use the XAMPP root account or local settings for a public production deployment. Production credentials, hosting, HTTPS, backups, and database access controls must be configured separately before launch.
