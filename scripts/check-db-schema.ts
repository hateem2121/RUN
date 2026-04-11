import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function checkColumns() {
  const tables = [
    "about_hero",
    "about_timeline_entries",
    "about_map_locations",
    "about_sections",
    "about_statistics",
    "about_team_messages",
  ];

  for (const table of tables) {
    console.log(`--- Table: ${table} ---`);
    try {
      const result = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `);
      console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
      console.log(`Error checking table ${table}:`, e.message);
    }
  }
  process.exit(0);
}

checkColumns();
