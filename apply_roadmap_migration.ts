import { db } from "./server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Applying migration to add media fields to technology_roadmap...");

  try {
    const migrationPath = "/Users/hateemjamshaid/.gemini/antigravity/brain/a1bfa9e8-1601-46b2-a474-0043d15ea637/migration_add_roadmap_media.sql";
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await db.execute(sql.raw(statement));
    }
    
    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Error applying migration:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
