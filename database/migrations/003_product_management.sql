-- Product editorial metadata, lifecycle status, and variant availability.
ALTER TABLE products
  ADD COLUMN status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft' AFTER purity,
  ADD COLUMN brand VARCHAR(120) NULL AFTER status,
  ADD COLUMN collection_name VARCHAR(120) NULL AFTER brand,
  ADD COLUMN stone_materials TEXT NULL AFTER collection_name,
  ADD COLUMN finish_color VARCHAR(120) NULL AFTER stone_materials,
  ADD COLUMN care_instructions TEXT NULL AFTER finish_color,
  ADD COLUMN tags JSON NULL AFTER care_instructions,
  ADD COLUMN seo_title VARCHAR(70) NULL AFTER tags,
  ADD COLUMN seo_description VARCHAR(180) NULL AFTER seo_title,
  ADD KEY ix_products_status_updated (status, updated_at);

UPDATE products SET status = IF(is_published = 1, 'published', 'draft');

ALTER TABLE product_variants
  ADD COLUMN availability ENUM('available', 'unavailable', 'made_to_order') NOT NULL DEFAULT 'available' AFTER making_charge_pkr,
  ADD COLUMN option_values JSON NULL AFTER availability;

UPDATE product_variants SET availability = IF(is_available = 1, 'available', 'unavailable');
