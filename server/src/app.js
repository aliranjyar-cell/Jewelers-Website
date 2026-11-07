import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/admin/auth', authRoutes);

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'jewelry-store-api' });
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' });
});

app.use((error, _request, response, _next) => {
  if (error.status >= 500 || !error.status) console.error(error);
  response.setHeader('Cache-Control', 'no-store');
  response.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' });
});
