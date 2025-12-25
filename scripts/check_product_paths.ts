import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function checkPaths() {
  try {
    // Execute raw SQL to bypass Drizzle schema validation issues in this script context
    const result = await db.execute(sql`
      SELECT id, name, slug, category_id, "url_path" 
      FROM products 
      LIMIT 10
    `);

    // Fetch categories to map names if needed, or just look at url_path
    const categories = await db.execute(sql`SELECT id, name, slug FROM categories`);
    const catMap = new Map(categories.rows.map((c: any) => [c.id, c]));

    result.rows.forEach((p: any) => {
      const cat = catMap.get(p.category_id);
      const catSlug = cat ? cat.slug : "unknown";
      const dbUrlPath = p.url_path || "NULL";
    });

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkPaths();
