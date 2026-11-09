CREATE TABLE custom_order_request_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(40) NOT NULL,
  from_value VARCHAR(40) NULL,
  to_value VARCHAR(40) NULL,
  quote_pkr DECIMAL(12,2) NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_custom_request_events_request_created (request_id, created_at),
  KEY ix_custom_request_events_actor (actor_id),
  CONSTRAINT fk_custom_request_events_request FOREIGN KEY (request_id) REFERENCES custom_order_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_custom_request_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
