import { sql } from "drizzle-orm";
import { db } from "../db.js";

async function addColumn() {
  try {
    console.log("Adding 'email_index' column to 'inquiries' table...");
    await db.execute(sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS email_index VARCHAR(255);`);
    console.log("✅ Successfully added 'email_index' column.");
  } catch (err) {
    console.error("❌ Failed to add column:", err);
  } finally {
    process.exit(0);
  }
}

addColumn();
