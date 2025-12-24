import { desc } from 'drizzle-orm';
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function checkCertifications() {
  try {
    console.log('📜 Checking certification status...\n');
    
    const recentFabrics = await db.select().from(fabrics).orderBy(desc(fabrics.id)).limit(8);
    const orderedFabrics = recentFabrics.reverse();
    
    orderedFabrics.forEach(f => {
      if (f.name.includes('CACHE_CLEAR')) return;
      
      console.log(`\n${f.name}:`);
      console.log(`  certificationIds: ${(f.properties as any)?.certificationIds ? JSON.stringify((f.properties as any).certificationIds) : 'NULL'}`);
      console.log(`  certificationTags: ${(f.properties as any)?.certificationTags ? JSON.stringify((f.properties as any).certificationTags) : 'NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCertifications();
