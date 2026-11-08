-- Supports the admin dashboard's date-range reports and recent activity lists.

ALTER TABLE orders
  ADD KEY ix_orders_created_at (created_at),
  ADD KEY ix_orders_updated_at (updated_at);

ALTER TABLE users
  ADD KEY ix_users_role_created_at (role, created_at);

ALTER TABLE custom_order_requests
  ADD KEY ix_custom_requests_status_created_at (status, created_at),
  ADD KEY ix_custom_requests_updated_at (updated_at);
