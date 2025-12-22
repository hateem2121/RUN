// @ts-nocheck

import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function fixProductPaths() {
  try {
    console.log("🛠️ Fixing product URL paths...");

    // 1. Get all products and their categories
    const productsResult = await db.execute(sql`
      SELECT p.id, p.name, p.slug, p.category_id, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);

    console.log(`Found ${productsResult.rows.length} products to check.`);

    let updatedCount = 0;
    const errors: any[] = [];

    // 2. Iterate and update
    for (const product of productsResult.rows) {
      if (!product.category_slug) {
        console.warn(
          `⚠️ Product ${product.name} (ID: ${product.id}) has no category context. Skipping.`,
        );
        continue;
      }

      // Construct the functionality correct path
      const expectedPath = `/categories/${product.category_slug}/${product.slug}`;

      console.log(`Processing ${product.name}: ${expectedPath}`);

      try {
        await db.execute(sql`
          UPDATE products 
          SET "url_path" = ${expectedPath}
          WHERE id = ${product.id} AND ("url_path" IS NULL OR "url_path" != ${expectedPath})
        `);
        updatedCount++;
      } catch (err) {
        console.error(`❌ Failed to update product ${product.id}:`, err);
        errors.push({ id: product.id, error: err });
      }
    }

    console.log("--------------------------------------------------");
    console.log(`✅ Migration Complete.`);
    console.log(`   Processed: ${productsResult.rows.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Errors: ${errors.length}`);
    console.log("--------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("FATAL ERROR in migration script:", error);
    process.exit(1);
  }
}

fixProductPaths();
