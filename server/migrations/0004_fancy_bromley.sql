CREATE TABLE "product_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"related_product_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_relations_product_id_idx" ON "product_relations" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_relations_related_product_id_idx" ON "product_relations" USING btree ("related_product_id");