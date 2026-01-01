/**
 * Add certification_ids column to homepage_sustainability table
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function addCertificationIdsColumn() {
  try {
    await sql`
      ALTER TABLE homepage_sustainability 
      ADD COLUMN IF NOT EXISTS certification_ids jsonb DEFAULT '[]'::jsonb
    `;
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

addCertificationIdsColumn();
