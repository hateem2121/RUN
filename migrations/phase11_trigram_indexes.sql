-- Enable pg_trgm extension for trigram-based search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Products Table Indexes
-- Optimized for case-insensitive partial searches on name, sku, and description
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_sku_trgm_idx ON products USING GIN (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_description_trgm_idx ON products USING GIN (description gin_trgm_ops);

-- Media Assets Table Indexes
-- Optimized for searching assets by filename or original name
CREATE INDEX IF NOT EXISTS media_filename_trgm_idx ON media_assets USING GIN (filename gin_trgm_ops);
CREATE INDEX IF NOT EXISTS media_original_name_trgm_idx ON media_assets USING GIN (original_name gin_trgm_ops);
