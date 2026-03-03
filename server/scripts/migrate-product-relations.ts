import { isNotNull } from "drizzle-orm";
import { productRelations, products } from "../../shared/index.js";
import { db } from "../db.js";

async function migrate() {
  console.log("Starting migration of relatedProductIds to product_relations table...");

  // 1. Fetch products with legacy relatedProductIds
  // Use raw SQL for the where clause since we want to check JSONB nullity/length
  const productsWithRelations = await db
    .select({
      id: products.id,
      name: products.name,
      relatedProductIds: products.relatedProductIds,
    })
    .from(products)
    .where(isNotNull(products.relatedProductIds));

  console.log(`Found ${productsWithRelations.length} products with potential relations.`);

  let migratedCount = 0;
  let errors = 0;

  for (const product of productsWithRelations) {
    const relatedIds = product.relatedProductIds;
    if (!relatedIds || !Array.isArray(relatedIds) || relatedIds.length === 0) {
      continue;
    }

    console.log(
      `Migrating ${relatedIds.length} relations for product ${product.id} (${product.name})...`,
    );

    try {
      // Create relations with sort order based on array index
      const values = relatedIds.map((relatedId, index) => ({
        productId: product.id,
        relatedProductId: relatedId,
        sortOrder: index,
      }));

      await db.insert(productRelations).values(values).onConflictDoNothing();
      migratedCount += values.length;
    } catch (error) {
      console.error(`Error migrating product ${product.id}:`, error);
      errors++;
    }
  }

  console.log("Migration complete.");
  console.log(`Total relations created: ${migratedCount}`);
  console.log(`Errors: ${errors}`);

  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
