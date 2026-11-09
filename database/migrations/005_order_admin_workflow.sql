-- Admin fulfillment details and a durable staff activity trail for orders.
ALTER TABLE orders
  ADD COLUMN courier_name VARCHAR(120) NULL AFTER customer_note,
  ADD COLUMN tracking_number VARCHAR(160) NULL AFTER courier_name,
  ADD COLUMN internal_note TEXT NULL AFTER tracking_number;

CREATE TABLE order_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(40) NOT NULL,
  from_value VARCHAR(120) NULL,
  to_value VARCHAR(120) NULL,
  note TEXT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_order_events_order_created (order_id, created_at),
  KEY ix_order_events_actor (actor_id),
  CONSTRAINT fk_order_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
