import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  trustProxy: process.env.TRUST_PROXY_HOPS ? Number(process.env.TRUST_PROXY_HOPS) : false,
  sessionCookieName: process.env.NODE_ENV === 'production' ? '__Host-admin_session' : 'admin_session',
  authEncryptionKey: process.env.AUTH_ENCRYPTION_KEY || '',
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'jewelry_store',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
};
