/**
 * Add certification_ids column to homepage_sustainability table
 */

import { sql } from "drizzle-orm";
import { db } from "../server/db.js";
import { logger } from "../server/lib/smart-logger.js";

async function addCertificationIdsColumn() {
  try {
    logger.info("Adding certification_ids column to homepage_sustainability table...");

    await db.execute(sql`
      ALTER TABLE homepage_sustainability 
      ADD COLUMN IF NOT EXISTS certification_ids jsonb DEFAULT '[]'::jsonb
    `);

    logger.info("✅ Successfully added certification_ids column");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Failed to add certification_ids column:", error);
    process.exit(1);
  }
}

addCertificationIdsColumn();
