import { sql } from "drizzle-orm";
import { db } from "../db.js";

async function diagnose() {
  try {
    console.log("Checking columns for 'inquiries' table...");
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inquiries'
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Diagnosis failed:", err);
  } finally {
    process.exit(0);
  }
}

diagnose();
