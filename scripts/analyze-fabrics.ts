
import { desc } from 'drizzle-orm';
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function analyzeFabrics() {
  try {
    console.log('🔍 Analyzing last 8 fabrics in database...\n');
    
    // Fetch the last 8 fabrics (the ones we just added)
    const recentFabrics = await db.select().from(fabrics).orderBy(desc(fabrics.id)).limit(8);
    
    // Reverse to match insertion order for easier comparison
    const orderedFabrics = recentFabrics.reverse();

    orderedFabrics.forEach(f => {
      console.log(`\n--------------------------------------------------`);
      console.log(`ID: ${f.id} | Name: ${f.name}`);
      console.log(`Weight: ${f.weight}`);
      console.log(`Sport: ${f.sport}`);
      console.log(`Segment: ${f.marketSegment}`);
      console.log(`Seasonality: ${f.seasonality}`);
      console.log(`Type: ${f.fabricType}`);
      console.log(`Sust. Score: ${f.sustainabilityScore}`);
      console.log(`Active: ${f.isActive}`);
      console.log(`Properties JSON:`);
      console.log(JSON.stringify(f.properties, null, 2));
      console.log(`--------------------------------------------------`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error analyzing fabrics:', error);
    process.exit(1);
  }
}

analyzeFabrics();
