import { Router } from 'express';
import { getProductSitemap, getPublishedCategories, getPublishedProduct, getPublishedProducts } from './products.controller.js';

export const publicProductRoutes = Router();
publicProductRoutes.get('/sitemap.xml', getProductSitemap);
publicProductRoutes.get('/categories', getPublishedCategories);
publicProductRoutes.get('/', getPublishedProducts);
publicProductRoutes.get('/:slug', getPublishedProduct);
