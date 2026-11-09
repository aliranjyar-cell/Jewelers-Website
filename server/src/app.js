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

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
app.use('/uploads', express.static(uploadsDirectory, {
  fallthrough: false,
  maxAge: '1d',
  setHeaders(response) {
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));
app.use('/api/admin/products', productRoutes);
app.use(express.json({ limit: '1mb' }));

app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/metal-rates', metalRateRoutes);
app.use('/api/admin/custom-requests', customOrderRoutes);
app.use('/api/products', publicProductRoutes);

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'jewelry-store-api' });
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' });
});

app.use((error, _request, response, _next) => {
  if (error.status >= 500 || !error.status) console.error(error);
  response.setHeader('Cache-Control', 'no-store');
  response.status(error.status || 500).json({
    error: error.status ? error.message : 'Internal server error',
    ...(error.details ? { details: error.details } : {}),
  });
});
