
import { desc } from 'drizzle-orm';
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function checkFabrics() {
  try {
    console.log('🔍 Checking fabrics in database...');
    const allFabrics = await db.select().from(fabrics).orderBy(desc(fabrics.id)).limit(10);
    
    console.log(`Found ${allFabrics.length} fabrics (showing last 10):`);
    allFabrics.forEach(f => {
      console.log(`- [${f.id}] ${f.name} (${f.weight})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking fabrics:', error);
    process.exit(1);
  }
}

checkFabrics();
