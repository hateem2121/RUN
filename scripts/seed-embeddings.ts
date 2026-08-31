import "dotenv/config";
import { sql } from "drizzle-orm";
import { closeDatabaseConnection, db } from "../server/db.js";
import { generateEmbedding } from "../server/services/system/embedding.service.js";

async function seedEmbeddings() {
  console.log("=== SEEDING PGVECTOR 384D EMBEDDINGS ===");

  // 1. Seed Products
  const productsRes = await db.execute(sql`
    SELECT id, name, description, short_description 
    FROM products 
    WHERE is_active = true;
  `);

  const products = productsRes.rows as unknown as Array<{
    id: number;
    name: string;
    description: string | null;
    short_description: string | null;
  }>;

  console.log(`Generating embeddings for ${products.length} products...`);
  for (const p of products) {
    const textContent = `${p.name} ${p.short_description ?? ""} ${p.description ?? ""}`;
    const embedding = generateEmbedding(textContent);
    const vectorStr = `[${embedding.join(",")}]`;

    await db.execute(sql`
      UPDATE products 
      SET embedding = ${vectorStr}::vector 
      WHERE id = ${p.id};
    `);
    console.log(`  ✓ Product [ID ${p.id}]: "${p.name}" embedding updated`);
  }

  // 2. Seed Fabrics
  const fabricsRes = await db.execute(sql`
    SELECT id, name, description, fabric_type, sport 
    FROM fabrics 
    WHERE is_active = true;
  `);

  const fabrics = fabricsRes.rows as unknown as Array<{
    id: number;
    name: string;
    description: string | null;
    fabric_type: string | null;
    sport: string | null;
  }>;

  console.log(`Generating embeddings for ${fabrics.length} fabrics...`);
  for (const f of fabrics) {
    const textContent = `${f.name} ${f.fabric_type ?? ""} ${f.sport ?? ""} ${f.description ?? ""}`;
    const embedding = generateEmbedding(textContent);
    const vectorStr = `[${embedding.join(",")}]`;

    await db.execute(sql`
      UPDATE fabrics 
      SET embedding = ${vectorStr}::vector 
      WHERE id = ${f.id};
    `);
    console.log(`  ✓ Fabric [ID ${f.id}]: "${f.name}" embedding updated`);
  }

  console.log("=== PGVECTOR EMBEDDINGS SEEDING COMPLETE ===");
  await closeDatabaseConnection();
}

seedEmbeddings().catch((err) => {
  console.error("Error seeding embeddings:", err);
  process.exit(1);
});
