ALTER TABLE campaigns
  ADD COLUMN hero_alignment ENUM('left','center','right') NOT NULL DEFAULT 'left' AFTER priority,
  ADD COLUMN hero_text_color CHAR(7) NOT NULL DEFAULT '#F8F2E6' AFTER hero_alignment;
