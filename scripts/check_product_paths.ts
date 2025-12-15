import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function checkPaths() {
  try {
    console.log("🔍 Checking product paths in database (Raw SQL)...");

    // Execute raw SQL to bypass Drizzle schema validation issues in this script context
    const result = await db.execute(sql`
      SELECT id, name, slug, category_id, "url_path" 
      FROM products 
      LIMIT 10
    `);

    // Fetch categories to map names if needed, or just look at url_path
    const categories = await db.execute(sql`SELECT id, name, slug FROM categories`);
    const catMap = new Map(categories.rows.map((c: any) => [c.id, c]));

    console.log(`Found ${result.rows.length} products (sample).`);

    result.rows.forEach((p: any) => {
      const cat = catMap.get(p.category_id);
      const catSlug = cat ? cat.slug : "unknown";
      console.log(`\nProduct: ${p.name} (ID: ${p.id})`);
      console.log(`- Slug: ${p.slug}`);
      console.log(`- Category: ${catSlug}`);
      const dbUrlPath = p.url_path || "NULL";
      console.log(`- DB URL Path: ${dbUrlPath}`);
      console.log(`- Expected Frontend URL: /categories/${catSlug}/${p.slug}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error checking paths:", error);
    process.exit(1);
  }
}

checkPaths();
