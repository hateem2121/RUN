-- Add foreign key index for size_chart_id to eliminate sequential table scans on products
CREATE INDEX IF NOT EXISTS "products_size_chart_id_idx" ON "products" USING btree ("size_chart_id");
