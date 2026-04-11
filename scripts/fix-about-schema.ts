import { sql } from "drizzle-orm";
import { db } from "../server/db.js";
import { logger } from "../server/lib/monitoring/logger.js";

async function fixSchema() {
  logger.info("🛠️ Fixing About Map Locations schema...");
  try {
    await db.execute(
      sql`ALTER TABLE about_map_locations ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`,
    );
    logger.info("✅ Column sort_order added successfully!");

    // Check if anything else is missing while we are at it
    // Based on the failing query, location_type and type might have issues if they were renamed

    process.exit(0);
  } catch (error) {
    logger.error("❌ Schema fix failed:", error);
    process.exit(1);
  }
}

fixSchema();
