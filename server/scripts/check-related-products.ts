import { isNotNull } from "drizzle-orm";
import { products } from "../../shared/schema.js";
import { db } from "../db.js";

async function checkData() {
  const result = await db
    .select({
      id: products.id,
      name: products.name,
      relatedProductIds: products.relatedProductIds,
    })
    .from(products)
    .where(isNotNull(products.relatedProductIds));

  console.log(`Found ${result.length} products with relatedProductIds`);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

checkData().catch(console.error);
