/**
 * Add certification_ids column to homepage_sustainability table
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addCertificationIdsColumn() {
  try {
    console.log('Adding certification_ids column to homepage_sustainability table...');
    
    await sql`
      ALTER TABLE homepage_sustainability 
      ADD COLUMN IF NOT EXISTS certification_ids jsonb DEFAULT '[]'::jsonb
    `;
    
    console.log('✅ Successfully added certification_ids column');
    console.log('Refreshing homepage - please reload http://localhost:5001/');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add certification_ids column:', error);
    process.exit(1);
  }
}

addCertificationIdsColumn();
