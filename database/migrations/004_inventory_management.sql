-- Variant-level inventory, reorder points, audit history, and order reservations.
ALTER TABLE product_variants
  ADD COLUMN reorder_point INT UNSIGNED NOT NULL DEFAULT 3 AFTER stock_quantity,
  ADD KEY ix_variants_inventory (availability, stock_quantity, reorder_point);

CREATE TABLE inventory_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  variant_id BIGINT UNSIGNED NULL,
  product_name_snapshot VARCHAR(180) NOT NULL,
  sku_snapshot VARCHAR(80) NOT NULL,
  movement_type ENUM('opening', 'receipt', 'adjustment', 'return', 'reserve', 'release', 'fulfill') NOT NULL,
  on_hand_change INT NOT NULL DEFAULT 0,
  reserved_change INT NOT NULL DEFAULT 0,
  on_hand_after INT UNSIGNED NOT NULL,
  reserved_after INT UNSIGNED NOT NULL DEFAULT 0,
  reason VARCHAR(120) NOT NULL,
  note VARCHAR(500) NULL,
  order_id BIGINT UNSIGNED NULL,
  performed_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_inventory_movements_variant_created (variant_id, created_at),
  KEY ix_inventory_movements_created (created_at),
  KEY ix_inventory_movements_order (order_id),
  CONSTRAINT fk_inventory_movements_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  CONSTRAINT fk_inventory_movements_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_inventory_movements_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  quantity INT UNSIGNED NOT NULL,
  status ENUM('reserved', 'released', 'fulfilled') NOT NULL DEFAULT 'reserved',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_inventory_reservations_order_status (order_id, status),
  KEY ix_inventory_reservations_variant_status (variant_id, status),
  KEY ix_inventory_reservations_item_status (order_item_id, status),
  CONSTRAINT fk_inventory_reservations_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_reservations_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_reservations_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Record the existing stock as the opening balance so future changes are auditable.
INSERT INTO inventory_movements
  (variant_id, product_name_snapshot, sku_snapshot, movement_type, on_hand_change, on_hand_after, reason)
SELECT v.id, p.name, v.sku, 'opening', v.stock_quantity, v.stock_quantity, 'Opening balance from product records'
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE v.stock_quantity > 0;
