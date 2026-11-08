import { getAdminDashboard } from './dashboard.service.js';

export async function getDashboard(request, response, next) {
  try {
    const range = typeof request.query.range === 'string' ? request.query.range : '7d';
    const dashboard = await getAdminDashboard(range);
    response.setHeader('Cache-Control', 'no-store');
    response.json(dashboard);
  } catch (error) {
    next(error);
  }
}
