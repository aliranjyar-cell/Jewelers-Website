import express, { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { createProduct, getCategories, getPricePreview, getProductById, getProducts, updateProduct } from './products.controller.js';

export const productRoutes = Router();
productRoutes.use(requireAuth, requireAdmin);
productRoutes.use(express.json({ limit: '16mb' }));
productRoutes.get('/categories', getCategories);
productRoutes.get('/', getProducts);
productRoutes.post('/', createProduct);
productRoutes.post('/pricing-preview', getPricePreview);
productRoutes.get('/:productId', getProductById);
productRoutes.put('/:productId', updateProduct);
