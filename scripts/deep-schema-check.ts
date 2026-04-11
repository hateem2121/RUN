import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function deepSchemaCheck() {
  console.log("Checking about_map_locations raw schema...");
  try {
    const result = await db.execute(sql`SELECT * FROM about_map_locations LIMIT 1`);
    console.log("Columns found in SELECT * :");
    console.log(Object.keys(result.rows[0] || {}).join(", "));
  } catch (e) {
    console.log("RAW SELECT * FAILED:", e.message);
  }
  process.exit(0);
}

deepSchemaCheck();
