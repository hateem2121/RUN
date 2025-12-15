
```
import { db } from "./server/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function runMigration() {
  try {
   // Read the SQL file
  const migrationSql = fs.readFileSync('/Users/hateemjamshaid/.gemini/antigravity/brain/a1bfa9e8-1601-46b2-a474-0043d15ea637/migration_add_technology_fields.sql', 'utf-8');

  console.log('Applying migration...');
  
  // Split by semicolon to handle multiple statements
  const statements = migrationSql.split(';').filter(stmt => stmt.trim().length > 0);
  
  console.log(`Found ${statements.length} statements to execute.`);
    
    for (const stmt of statements) {
      console.log("Executing:", stmt.trim());
      await db.execute(sql.raw(stmt));
    }
    
    console.log("All migration statements executed successfully.");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}
runMigration();
