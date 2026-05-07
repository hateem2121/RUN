CREATE INDEX "accessories_name_trgm_idx" ON "accessories" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "accessories_description_trgm_idx" ON "accessories" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "accessories_sku_trgm_idx" ON "accessories" USING gin ("sku" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "fabrics_name_trgm_idx" ON "fabrics" USING gin ("name" gin_trgm_ops);