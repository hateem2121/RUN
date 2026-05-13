CREATE TABLE "cache_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"expiry" timestamp (3) NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	CONSTRAINT "cache_entries_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX "cache_entries_key_idx" ON "cache_entries" USING btree ("key");--> statement-breakpoint
CREATE INDEX "cache_entries_expiry_idx" ON "cache_entries" USING btree ("expiry");--> statement-breakpoint
CREATE INDEX "categories_primary_image_id_idx" ON "categories" USING btree ("primary_image_id");