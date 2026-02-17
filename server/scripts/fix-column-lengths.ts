import { sql } from "drizzle-orm";
import { db } from "../db.js";

async function fixLengths() {
  try {
    console.log("Increasing column lengths for 'inquiries' table...");
    // Name: 100 -> 255
    await db.execute(sql`ALTER TABLE inquiries ALTER COLUMN name TYPE VARCHAR(255);`);
    // Email: 320 -> 500
    await db.execute(sql`ALTER TABLE inquiries ALTER COLUMN email TYPE VARCHAR(500);`);
    // Company: 100 -> 255
    await db.execute(sql`ALTER TABLE inquiries ALTER COLUMN company TYPE VARCHAR(255);`);
    // Phone: 50 -> 255
    await db.execute(sql`ALTER TABLE inquiries ALTER COLUMN phone TYPE VARCHAR(255);`);
    console.log("✅ Successfully increased column lengths.");
  } catch (err) {
    console.error("❌ Failed to increase column lengths:", err);
  } finally {
    process.exit(0);
  }
}

fixLengths();
