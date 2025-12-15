
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function check() {
  try {
    console.log("Checking manufacturing_hero columns...");
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'manufacturing_hero';
    `);
    console.log("Hero Columns:", result.rows.map(r => r.column_name));

    console.log("\nChecking manufacturing_processes data...");
    const processes = await db.execute(sql`select id, name, icon_name, efficiency from manufacturing_processes limit 5`);
    console.log("Processes:", processes.rows);
    
    process.exit(0);
  } catch (e) {
    console.error("Error checking DB:", e);
    process.exit(1);
  }
}
check();
