import { Router } from 'express';
import { getProductSitemap, getPublishedProduct } from './products.controller.js';

export const publicProductRoutes = Router();
publicProductRoutes.get('/sitemap.xml', getProductSitemap);
publicProductRoutes.get('/:slug', getPublishedProduct);
