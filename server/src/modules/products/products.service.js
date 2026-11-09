import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../../config/database.js';
import { env } from '../../config/env.js';

const uploadDirectory = env.uploadsDirectory
  ? path.resolve(env.uploadsDirectory, 'products')
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/products');
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MIME_EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const VALID_STATUS = new Set(['draft', 'published', 'archived']);
const VALID_MODE = new Set(['ready_made', 'custom_made', 'both']);
const VALID_METAL = new Set(['gold', 'silver', 'other']);
const VALID_AVAILABILITY = new Set(['available', 'unavailable', 'made_to_order']);

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function cleanText(value, max, label, { required = false } = {}) {
  const result = String(value ?? '').trim();
  if (required && !result) fail(`${label} is required.`);
  if (result.length > max) fail(`${label} must be ${max} characters or fewer.`);
  return result || null;
}

function slugify(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 190) || `product-${randomUUID().slice(0, 8)}`;
}

function jsonValue(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

function parseVariant(input, index) {
  const variant = {
    id: input.id ? String(input.id) : null,
    sku: cleanText(input.sku, 80, `Variant ${index + 1} SKU`, { required: true }),
    optionLabel: cleanText(input.optionLabel, 120, `Variant ${index + 1} label`) || 'Default',
    weightGrams: input.weightGrams === '' || input.weightGrams === null || input.weightGrams === undefined ? null : Number(input.weightGrams),
    pricingMode: input.pricingMode === 'metal_weight' ? 'metal_weight' : input.pricingMode === 'fixed' ? 'fixed' : null,
    fixedPrice: input.fixedPrice === '' || input.fixedPrice === null || input.fixedPrice === undefined ? null : Number(input.fixedPrice),
    makingChargeType: input.makingChargeType === 'per_gram' ? 'per_gram' : 'fixed',
    makingCharge: Number(input.makingCharge ?? 0),
    stockQuantity: Number(input.stockQuantity ?? 0),
    availability: input.availability || (input.isAvailable === false ? 'unavailable' : 'available'),
    optionValues: Array.isArray(input.optionValues) ? input.optionValues : [],
  };
  if (!variant.pricingMode) fail(`Choose a pricing method for variant ${index + 1}.`);
  if (variant.weightGrams !== null && (!Number.isFinite(variant.weightGrams) || variant.weightGrams < 0)) fail(`Variant ${index + 1} weight must be zero or more.`);
  if (!Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0) fail(`Variant ${index + 1} quantity must be a whole number of zero or more.`);
  if (!Number.isFinite(variant.makingCharge) || variant.makingCharge < 0) fail(`Variant ${index + 1} making charge must be zero or more.`);
  if (!VALID_AVAILABILITY.has(variant.availability)) fail(`Choose a valid availability for variant ${index + 1}.`);
  if (variant.pricingMode === 'fixed' && variant.fixedPrice !== null && (!Number.isFinite(variant.fixedPrice) || variant.fixedPrice <= 0)) fail(`Enter a fixed price above zero for variant ${index + 1}.`);
  if (variant.pricingMode === 'metal_weight' && variant.weightGrams !== null && (!Number.isFinite(variant.weightGrams) || variant.weightGrams <= 0)) fail(`Enter a weight above zero for metal-priced variant ${index + 1}.`);
  return variant;
}

function parseImages(input) {
  if (!Array.isArray(input)) fail('Add at least one product photo.');
  const images = input.map((image, index) => ({
    id: image.id ? String(image.id) : null,
    url: cleanText(image.url, 1000, `Photo ${index + 1} URL`),
    dataUrl: typeof image.dataUrl === 'string' ? image.dataUrl : null,
    altText: cleanText(image.altText, 200, `Photo ${index + 1} alt text`),
    sortOrder: index,
  }));
  for (const image of images) {
    if (image.dataUrl) {
      const match = image.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match) fail('Photos must be JPEG, PNG, or WebP images.');
      const mime = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) fail('Each product photo must be 4 MB or smaller.');
      if ((mime === 'image/jpeg' && !(buffer[0] === 0xff && buffer[1] === 0xd8))
        || (mime === 'image/png' && buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
        || (mime === 'image/webp' && (buffer.subarray(0, 4).toString() !== 'RIFF' || buffer.subarray(8, 12).toString() !== 'WEBP'))) {
        fail('A photo file could not be verified as a valid image.');
      }
      image.buffer = buffer;
      image.extension = MIME_EXTENSIONS[mime];
    } else if (!image.url) {
      fail('Each product photo needs an image file or URL.');
    }
  }
  return images;
}

async function persistImages(images) {
  await mkdir(uploadDirectory, { recursive: true });
  for (const image of images) {
    if (!image.buffer) continue;
    const filename = `${randomUUID()}.${image.extension}`;
    await writeFile(path.join(uploadDirectory, filename), image.buffer, { flag: 'wx' });
    image.url = `/uploads/products/${filename}`;
    delete image.buffer;
    delete image.extension;
    delete image.dataUrl;
  }
}

async function ensureCategory(connection, categoryName) {
  const name = cleanText(categoryName, 120, 'Category', { required: true });
  const [found] = await connection.execute('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1', [name]);
  if (found[0]) return found[0].id;
  const baseSlug = slugify(name).slice(0, 145);
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const [sameSlug] = await connection.execute('SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug]);
    if (!sameSlug[0]) break;
    slug = `${baseSlug}-${suffix++}`;
  }
  const [result] = await connection.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
  return result.insertId;
}

async function latestRate(connection, metal, purity) {
  if (!['gold', 'silver'].includes(metal) || !purity) return null;
  const [rows] = await connection.execute(
    `SELECT rate_per_gram_pkr AS rate, effective_at AS updatedAt FROM metal_rates
     WHERE metal_type = ? AND purity = ? AND effective_at <= NOW()
     ORDER BY effective_at DESC, id DESC LIMIT 1`, [metal, purity],
  );
  return rows[0] ? { rate: Number(rows[0].rate), updatedAt: rows[0].updatedAt } : null;
}

async function validatePublish(connection, product, variants, images) {
  const errors = [];
  if (!product.name) errors.push('Product name is required.');
  if (!product.categoryName) errors.push('Choose a category.');
  if (!product.description) errors.push('Product description is required.');
  if (!images.length) errors.push('Add at least one product photo.');
  if (['gold', 'silver'].includes(product.metalType) && !product.purity) errors.push('Purity is required for gold and silver products.');
  if (!variants.length) errors.push('Add at least one variant.');
  for (const [index, variant] of variants.entries()) {
    if (!variant.sku) errors.push(`Variant ${index + 1} needs a SKU.`);
    if (!Number.isFinite(variant.weightGrams) || variant.weightGrams <= 0) errors.push(`Variant ${index + 1} needs a weight above zero.`);
    if (variant.pricingMode === 'fixed' && (!Number.isFinite(variant.fixedPrice) || variant.fixedPrice <= 0)) errors.push(`Variant ${index + 1} needs a fixed price above zero.`);
    if (variant.pricingMode === 'metal_weight' && (!Number.isFinite(variant.weightGrams) || variant.weightGrams <= 0)) errors.push(`Variant ${index + 1} needs a weight above zero.`);
    if (variant.pricingMode !== 'metal_weight') continue;
    if (!['gold', 'silver'].includes(product.metalType) || !product.purity) {
      errors.push(`Variant ${index + 1} uses metal pricing but the product metal or purity is missing.`);
    } else if (!await latestRate(connection, product.metalType, product.purity)) {
      errors.push(`A current ${product.purity} ${product.metalType} rate is required before publishing variant ${index + 1}.`);
    }
  }
  if (errors.length) {
    const error = new Error('This product needs attention before it can be published.');
    error.status = 400;
    error.details = errors;
    throw error;
  }
}

function parseProduct(input) {
  const status = input.status || 'draft';
  const product = {
    name: cleanText(input.name, 180, 'Product name', { required: true }),
    slug: slugify(cleanText(input.slug, 200, 'SEO URL') || input.name),
    categoryName: cleanText(input.categoryName, 120, 'Category', { required: status === 'published' }),
    description: cleanText(input.description, 10000, 'Description', { required: status === 'published' }),
    productMode: input.productMode || 'ready_made',
    metalType: input.metalType || 'other',
    purity: cleanText(input.purity, 40, 'Purity'),
    status,
    brand: cleanText(input.brand, 120, 'Brand'),
    collectionName: cleanText(input.collectionName, 120, 'Collection'),
    stoneMaterials: cleanText(input.stoneMaterials, 3000, 'Stone and material details'),
    finishColor: cleanText(input.finishColor, 120, 'Finish or color'),
    careInstructions: cleanText(input.careInstructions, 3000, 'Care instructions'),
    tags: Array.isArray(input.tags) ? [...new Set(input.tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 30) : [],
    isFeatured: Boolean(input.isFeatured),
    seoTitle: cleanText(input.seoTitle, 70, 'SEO title'),
    seoDescription: cleanText(input.seoDescription, 180, 'SEO description'),
  };
  if (!VALID_STATUS.has(product.status)) fail('Choose a valid product status.');
  if (!VALID_MODE.has(product.productMode)) fail('Choose a valid product type.');
  if (!VALID_METAL.has(product.metalType)) fail('Choose a valid metal.');
  if (product.status === 'published' && product.seoTitle && product.seoTitle.length > 60) fail('SEO title should be 60 characters or fewer.');
  if (product.status === 'published' && product.seoDescription && product.seoDescription.length > 160) fail('SEO description should be 160 characters or fewer.');
  return product;
}

async function saveVariant(connection, productId, variant, metalType, purity) {
  const available = variant.availability !== 'unavailable';
  const [rate] = variant.pricingMode === 'metal_weight' ? [await latestRate(connection, metalType, purity)] : [null];
  if (variant.id) {
    const [result] = await connection.execute(
      `UPDATE product_variants SET sku = ?, option_label = ?, weight_grams = ?, pricing_mode = ?,
       fixed_price_pkr = ?, making_charge_type = ?, making_charge_pkr = ?,
       is_available = ?, availability = ?, option_values = ? WHERE id = ? AND product_id = ?`,
      [variant.sku, variant.optionLabel, variant.weightGrams, variant.pricingMode, variant.fixedPrice,
        variant.makingChargeType, variant.makingCharge, available ? 1 : 0,
        variant.availability, JSON.stringify(variant.optionValues), variant.id, productId],
    );
    if (!result.affectedRows) fail('A variant no longer belongs to this product. Please reload and try again.', 409);
  } else {
    await connection.execute(
      `INSERT INTO product_variants
       (product_id, sku, option_label, weight_grams, pricing_mode, fixed_price_pkr, making_charge_type,
        making_charge_pkr, is_available, availability, option_values)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, variant.sku, variant.optionLabel, variant.weightGrams, variant.pricingMode,
        variant.fixedPrice, variant.makingChargeType, variant.makingCharge,
        available ? 1 : 0, variant.availability, JSON.stringify(variant.optionValues)],
    );
  }
  const metalValue = rate && variant.weightGrams ? rate.rate * variant.weightGrams : null;
  const makingCharge = variant.makingChargeType === 'per_gram' ? variant.makingCharge * (variant.weightGrams || 0) : variant.makingCharge;
  return { id: variant.id, ratePerGram: rate?.rate ?? null, metalValue, makingCharge, calculatedPrice: variant.pricingMode === 'fixed' ? variant.fixedPrice : metalValue === null ? null : metalValue + makingCharge };
}

async function saveImages(connection, productId, images) {
  await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
  for (const image of images) {
    await connection.execute(
      'INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?)',
      [productId, image.url, image.altText, image.sortOrder],
    );
  }
}

export async function listProductCategories() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, COUNT(p.id) AS productCount FROM categories c
     LEFT JOIN products p ON p.category_id = c.id WHERE c.is_active = 1
     GROUP BY c.id ORDER BY c.sort_order, c.name`,
  );
  return rows;
}

export async function listPublishedCategories() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.slug, COUNT(p.id) AS productCount
     FROM categories c JOIN products p ON p.category_id = c.id
     WHERE c.is_active = 1 AND p.status = 'published'
     GROUP BY c.id ORDER BY c.sort_order, c.name`,
  );
  return rows.map((row) => ({ ...row, id: String(row.id), productCount: Number(row.productCount) }));
}

export async function listProducts({ search = '', status = '', page = 1, pageSize = 20 } = {}) {
  const clauses = [];
  const values = [];
  if (status && VALID_STATUS.has(status)) { clauses.push('p.status = ?'); values.push(status); }
  if (search) {
    clauses.push('(p.name LIKE ? OR p.slug LIKE ? OR EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.sku LIKE ?))');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [[countRows], [rows]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM products p ${where}`, values),
    pool.execute(
      `SELECT p.id, p.name, p.slug, p.status, p.is_featured AS isFeatured, p.metal_type AS metalType,
       p.purity, c.name AS category, p.updated_at AS updatedAt,
       (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image,
       (SELECT MIN(v.fixed_price_pkr) FROM product_variants v WHERE v.product_id = p.id AND v.pricing_mode = 'fixed') AS fixedPrice,
       (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS variantCount,
       (SELECT COALESCE(SUM(v.stock_quantity), 0) FROM product_variants v WHERE v.product_id = p.id) AS stock
       FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}
       ORDER BY p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, (page - 1) * pageSize],
    ),
  ]);
  return { items: rows.map((row) => ({ ...row, id: String(row.id), isFeatured: Boolean(row.isFeatured), fixedPrice: row.fixedPrice === null ? null : Number(row.fixedPrice), variantCount: Number(row.variantCount), stock: Number(row.stock) })), total: Number(countRows[0].total), page, pageSize };
}

export async function getProduct(id) {
  const [[rows], [images], [variants]] = await Promise.all([
    pool.execute(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ? LIMIT 1`, [id],
    ),
    pool.execute('SELECT id, image_url AS url, alt_text AS altText, sort_order AS sortOrder FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [id]),
    pool.execute('SELECT id, sku, option_label AS optionLabel, weight_grams AS weightGrams, pricing_mode AS pricingMode, fixed_price_pkr AS fixedPrice, making_charge_type AS makingChargeType, making_charge_pkr AS makingCharge, stock_quantity AS stockQuantity, availability, option_values AS optionValues FROM product_variants WHERE product_id = ? ORDER BY id', [id]),
  ]);
  if (!rows[0]) fail('Product not found.', 404);
  return {
    ...rows[0], id: String(rows[0].id), categoryName: rows[0].category_name || '', productMode: rows[0].product_mode,
    metalType: rows[0].metal_type, isFeatured: Boolean(rows[0].is_featured), tags: jsonValue(rows[0].tags, []),
    images: images.map((image) => ({ ...image, id: String(image.id), sortOrder: Number(image.sortOrder) })),
    variants: variants.map((variant) => ({ ...variant, id: String(variant.id), weightGrams: variant.weightGrams === null ? '' : Number(variant.weightGrams), fixedPrice: variant.fixedPrice === null ? '' : Number(variant.fixedPrice), makingCharge: Number(variant.makingCharge), stockQuantity: Number(variant.stockQuantity), optionValues: jsonValue(variant.optionValues, []) })),
  };
}

export async function getPublishedProductBySlug(slug) {
  const [[rows], [images], [variants]] = await Promise.all([
    pool.execute(
      `SELECT p.id, p.name, p.slug, p.description, p.product_mode AS productMode, p.metal_type AS metalType,
       p.purity, p.brand, p.collection_name AS collectionName, p.stone_materials AS stoneMaterials,
       p.finish_color AS finishColor, p.care_instructions AS careInstructions, p.tags,
       p.seo_title AS seoTitle, p.seo_description AS seoDescription, p.is_featured AS isFeatured,
       c.name AS category FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.status = 'published' LIMIT 1`, [slug],
    ),
    pool.execute(
      `SELECT image_url AS url, alt_text AS altText, sort_order AS sortOrder FROM product_images pi
       JOIN products p ON p.id = pi.product_id WHERE p.slug = ? AND p.status = 'published' ORDER BY pi.sort_order, pi.id`, [slug],
    ),
    pool.execute(
      `SELECT v.id, v.sku, v.option_label AS optionLabel, v.weight_grams AS weightGrams,
       v.pricing_mode AS pricingMode, v.fixed_price_pkr AS fixedPrice, v.making_charge_type AS makingChargeType,
       v.making_charge_pkr AS makingCharge, v.stock_quantity AS stockQuantity, v.availability,
       (SELECT COALESCE(SUM(ir.quantity), 0) FROM inventory_reservations ir WHERE ir.variant_id = v.id AND ir.status = 'reserved') AS reservedQuantity
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE p.slug = ? AND p.status = 'published' ORDER BY v.id`, [slug],
    ),
  ]);
  if (!rows[0]) fail('Product not found.', 404);
  const product = rows[0];
  const tags = jsonValue(product.tags, []);
  const resultVariants = [];
  for (const variant of variants) {
    const weight = variant.weightGrams === null ? null : Number(variant.weightGrams);
    const making = Number(variant.makingCharge);
    let price = variant.fixedPrice === null ? null : Number(variant.fixedPrice);
    let ratePerGram = null;
    let rateAvailable = true;
    if (variant.pricingMode === 'metal_weight') {
      const rate = await latestRate(pool, product.metalType, product.purity);
      if (!rate || !weight) rateAvailable = false;
      else {
        ratePerGram = rate.rate;
        const metalValue = rate.rate * weight;
        const makingCharge = variant.makingChargeType === 'per_gram' ? making * weight : making;
        price = Math.round((metalValue + makingCharge) * 100) / 100;
      }
    }
    const stockQuantity = Number(variant.stockQuantity);
    const reservedQuantity = Number(variant.reservedQuantity || 0);
    resultVariants.push({ ...variant, weightGrams: weight, fixedPrice: price, ratePerGram, rateAvailable, makingCharge: making, stockQuantity, reservedQuantity, availableQuantity: variant.availability === 'available' ? Math.max(0, stockQuantity - reservedQuantity) : 0 });
  }
  return {
    id: String(product.id), ...product, tags, isFeatured: Boolean(product.isFeatured),
    images: images.map((image) => ({ ...image, sortOrder: Number(image.sortOrder) })), variants: resultVariants,
  };
}

export async function listPublishedProductSlugs() {
  const [rows] = await pool.execute("SELECT slug, updated_at AS updatedAt FROM products WHERE status = 'published' ORDER BY updated_at DESC");
  return rows;
}

export async function listPublishedProducts({ search = '', category = '', page = 1, pageSize = 20 } = {}) {
  const clauses = ["p.status = 'published'"];
  const values = [];
  if (search) {
    clauses.push('(p.name LIKE ? OR p.slug LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    clauses.push('c.slug = ?');
    values.push(category);
  }
  const where = `WHERE ${clauses.join(' AND ')}`;
  const [[countRows], [rows]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`, values),
    pool.execute(
      `SELECT p.id, p.name, p.slug, p.description, p.product_mode AS productMode, p.metal_type AS metalType,
       p.purity, c.name AS category, p.is_featured AS isFeatured, p.updated_at AS updatedAt,
       (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image,
       (SELECT MIN(v.fixed_price_pkr) FROM product_variants v WHERE v.product_id = p.id AND v.pricing_mode = 'fixed') AS minPrice,
       (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS variantCount
       FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}
       ORDER BY p.is_featured DESC, p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, (page - 1) * pageSize],
    ),
  ]);
  return {
    items: rows.map((row) => ({
      ...row,
      id: String(row.id),
      isFeatured: Boolean(row.isFeatured),
      minPrice: row.minPrice === null ? null : Number(row.minPrice),
      variantCount: Number(row.variantCount),
    })),
    total: Number(countRows[0].total),
    page,
    pageSize,
  };
}

export async function saveProduct(id, input) {
  const product = parseProduct(input);
  const variants = Array.isArray(input.variants)
    ? input.variants.filter((variant) => input.status !== 'published' && !variant.sku && !variant.fixedPrice && !variant.weightGrams ? false : true).map(parseVariant)
    : [];
  const images = parseImages(input.images);
  await persistImages(images);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const categoryId = product.categoryName ? await ensureCategory(connection, product.categoryName) : null;
    if (product.status === 'published') await validatePublish(connection, product, variants, images);

    const [slugRows] = await connection.execute('SELECT id FROM products WHERE slug = ? AND id <> ? LIMIT 1', [product.slug, id || 0]);
    if (slugRows[0]) fail('That SEO URL is already used by another product. Choose a unique URL.', 409);
    if (new Set(variants.map((variant) => variant.sku.toLowerCase())).size !== variants.length) fail('Each variant must have a unique SKU.');
    for (const variant of variants) {
      const [rows] = await connection.execute(
        'SELECT id FROM product_variants WHERE sku = ? AND (? IS NULL OR product_id <> ?) LIMIT 1',
        [variant.sku, id || null, id || null],
      );
      if (rows[0]) fail('A variant SKU is already used by another product.', 409);
    }

    const columns = [product.name, product.slug, categoryId, product.description, product.productMode, product.metalType,
      product.purity, product.status, product.brand, product.collectionName, product.stoneMaterials, product.finishColor,
      product.careInstructions, JSON.stringify(product.tags), product.seoTitle, product.seoDescription,
      product.status === 'published' ? 1 : 0, product.isFeatured ? 1 : 0];
    let productId = id;
    if (id) {
      const [result] = await connection.execute(
        `UPDATE products SET name=?, slug=?, category_id=?, description=?, product_mode=?, metal_type=?, purity=?, status=?,
         brand=?, collection_name=?, stone_materials=?, finish_color=?, care_instructions=?, tags=?, seo_title=?, seo_description=?,
         is_published=?, is_featured=? WHERE id=?`, [...columns, id],
      );
      if (!result.affectedRows) fail('Product not found.', 404);
    } else {
      const [result] = await connection.execute(
        `INSERT INTO products (name, slug, category_id, description, product_mode, metal_type, purity, status, brand,
         collection_name, stone_materials, finish_color, care_instructions, tags, seo_title, seo_description, is_published, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, columns,
      );
      productId = result.insertId;
    }

    const existingVariantIds = new Set(variants.filter((variant) => variant.id).map((variant) => variant.id));
    if (id) {
      const keepClause = existingVariantIds.size
        ? `AND v.id NOT IN (${[...existingVariantIds].map(() => '?').join(',')})`
        : '';
      const [reservedRows] = await connection.execute(
        `SELECT COUNT(*) AS total FROM inventory_reservations ir
         JOIN product_variants v ON v.id = ir.variant_id
         WHERE v.product_id = ? AND ir.status = 'reserved' ${keepClause}`,
        [id, ...existingVariantIds],
      );
      if (Number(reservedRows[0]?.total || 0) > 0) fail('A variant with an open order reservation cannot be removed. Release or fulfill the reservation first.', 409);
    }
    if (id && existingVariantIds.size) {
      const placeholders = [...existingVariantIds].map(() => '?').join(',');
      await connection.execute(`DELETE FROM product_variants WHERE product_id = ? AND id NOT IN (${placeholders})`, [id, ...existingVariantIds]);
    } else if (id) {
      await connection.execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
    }
    for (const variant of variants) await saveVariant(connection, productId, variant, product.metalType, product.purity);
    await saveImages(connection, productId, images);
    await connection.commit();
    return getProduct(productId);
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      error.status = 409;
      error.message = 'That SKU or SEO URL is already in use.';
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function previewVariantPrice({ metal, purity, weightGrams, makingChargeType = 'fixed', makingCharge = 0 }) {
  const weight = Number(weightGrams);
  const charge = Number(makingCharge);
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(charge) || charge < 0) fail('Enter a valid weight and making charge.');
  const rate = await latestRate(pool, metal, purity);
  if (!rate) return { available: false, warning: `No current ${purity || ''} ${metal || ''} rate is published.`.trim(), ratePerGram: null, metalValue: null, makingCharge: null, calculatedPrice: null };
  const metalValue = Math.round(rate.rate * weight * 100) / 100;
  const making = Math.round((makingChargeType === 'per_gram' ? charge * weight : charge) * 100) / 100;
  return { available: true, ratePerGram: rate.rate, rateUpdatedAt: rate.updatedAt, metalValue, makingCharge: making, calculatedPrice: metalValue + making };
}
