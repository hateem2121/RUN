import fs from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function main() {
  try {
    const migrationPath =
      "/Users/hateemjamshaid/.gemini/antigravity/brain/a1bfa9e8-1601-46b2-a474-0043d15ea637/migration_add_roadmap_media.sql";
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    const statements = migrationSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
  } catch (_error) {
    process.exit(1);
  }

  process.exit(0);
}

main();
