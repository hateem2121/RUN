import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function checkStatus() {
  try {
    const slug = "team-training-set";
    console.log(`Checking status for: ${slug}`);

    const result = await db.execute(sql`
      SELECT id, name, "is_active", "deleted_at", "url_path"
      FROM products 
      WHERE slug = ${slug}
    `);

    if (result.rows.length === 0) {
      console.log("Product not found in DB!");
    } else {
      console.log(result.rows[0]);
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkStatus();
