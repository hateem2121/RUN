CREATE INDEX IF NOT EXISTS "accessories_name_trgm_idx" ON "accessories" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accessories_description_trgm_idx" ON "accessories" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accessories_sku_trgm_idx" ON "accessories" USING gin ("sku" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fabrics_name_trgm_idx" ON "fabrics" USING gin ("name" gin_trgm_ops);