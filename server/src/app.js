import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { dashboardRoutes } from './modules/admin-dashboard/dashboard.routes.js';
import { productRoutes } from './modules/products/products.routes.js';
import { publicProductRoutes } from './modules/products/publicProducts.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { orderRoutes } from './modules/orders/orders.routes.js';
import { metalRateRoutes } from './modules/metal-rates/metalRates.routes.js';
import { customOrderRoutes } from './modules/custom-orders/customOrders.routes.js';
import { publicOrderRoutes } from './modules/orders/publicOrders.routes.js';
import { customerAuthRoutes } from './modules/customer-auth/customerAuth.routes.js';
import { publicCustomOrderRoutes } from './modules/custom-orders/publicCustomOrders.routes.js';
import { adminCampaignRoutes, publicCampaignRoutes } from './modules/campaigns/campaigns.routes.js';
import { pool } from './config/database.js';
import { getProductSitemap } from './modules/products/products.controller.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
const uploadsDirectory = env.uploadsDirectory || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
app.use('/uploads', express.static(uploadsDirectory, {
  fallthrough: false,
  maxAge: '1d',
  setHeaders(response) {
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/campaigns', adminCampaignRoutes);
app.use(express.json({ limit: '1mb' }));

app.use('/api/admin/auth', authRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/custom-requests', publicCustomOrderRoutes);
app.use('/api/campaigns', publicCampaignRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/metal-rates', metalRateRoutes);
app.use('/api/admin/custom-requests', customOrderRoutes);
app.use('/api/orders', publicOrderRoutes);
app.use('/api/products', publicProductRoutes);

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', service: 'jewelry-store' });
  } catch (error) {
    next(error);
  }
});

app.get('/sitemap.xml', getProductSitemap);
app.get('/robots.txt', (_request, response) => {
  const origin = new URL(env.clientOrigin).origin;
  response.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' });
});

const clientDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
app.use(express.static(clientDirectory, {
  maxAge: 0,
  setHeaders(response, filePath) {
    if (env.nodeEnv === 'production' && /\.[a-f\d]{8,}\./i.test(filePath)) {
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      response.setHeader('Cache-Control', 'no-cache');
    }
  },
}));
app.use((request, response, next) => {
  if (request.method !== 'GET' || request.path.startsWith('/api/') || request.path.startsWith('/uploads/')) return next();
  response.sendFile(path.join(clientDirectory, 'index.html'), (error) => error && next());
});

app.use((error, _request, response, _next) => {
  if (error.status >= 500 || !error.status) console.error(error);
  response.setHeader('Cache-Control', 'no-store');
  response.status(error.status || 500).json({
    error: error.status ? error.message : 'Internal server error',
    ...(error.details ? { details: error.details } : {}),
  });
});
