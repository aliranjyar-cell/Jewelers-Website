ALTER TABLE orders
  ADD COLUMN delivery_fee_confirmed TINYINT(1) NOT NULL DEFAULT 1 AFTER delivery_fee_pkr;

-- Existing orders retain the default because their saved total was already agreed.
-- Storefront orders set this field to 0 until staff confirms delivery pricing.
