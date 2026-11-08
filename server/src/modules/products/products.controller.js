import { getProduct, getPublishedProductBySlug, listProductCategories, listProducts, listPublishedProductSlugs, previewVariantPrice, saveProduct } from './products.service.js';

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export const getCategories = asyncHandler(async (_request, response) => {
  response.json({ items: await listProductCategories() });
});

export const getProducts = asyncHandler(async (request, response) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(request.query.page, 10) || 1));
  const pageSize = Math.max(1, Math.min(50, Number.parseInt(request.query.pageSize, 10) || 20));
  const search = String(request.query.search || '').trim().slice(0, 120);
  const status = String(request.query.status || '').trim();
  response.json(await listProducts({ search, status, page, pageSize }));
});

export const getProductById = asyncHandler(async (request, response) => {
  response.json(await getProduct(request.params.productId));
});

export const createProduct = asyncHandler(async (request, response) => {
  const product = await saveProduct(null, request.body);
  response.status(201).json(product);
});

export const updateProduct = asyncHandler(async (request, response) => {
  response.json(await saveProduct(request.params.productId, request.body));
});

export const getPricePreview = asyncHandler(async (request, response) => {
  response.json(await previewVariantPrice(request.body));
});

export const getPublishedProduct = asyncHandler(async (request, response) => {
  response.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  response.json(await getPublishedProductBySlug(request.params.slug));
});

export const getProductSitemap = asyncHandler(async (_request, response) => {
  const origin = new URL(process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173').origin;
  const rows = await listPublishedProductSlugs();
  const urls = rows.map((row) => {
    const updated = new Date(row.updatedAt).toISOString();
    return `<url><loc>${origin}/shop/${encodeURIComponent(row.slug)}</loc><lastmod>${updated}</lastmod></url>`;
  }).join('');
  response.setHeader('Cache-Control', 'public, max-age=300');
  response.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});
