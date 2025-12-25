import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function checkStatus() {
  try {
    const slug = "team-training-set";

    const result = await db.execute(sql`
      SELECT id, name, "is_active", "deleted_at", "url_path"
      FROM products 
      WHERE slug = ${slug}
    `);

    if (result.rows.length === 0) {
    } else {
    }
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkStatus();
