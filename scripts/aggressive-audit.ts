
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function aggressiveAudit() {
  try {
    console.log('🔥 Aggressive Audit of ALL Fabric Compositions...\n');

    const allFabrics = await db.select().from(fabrics);
    
    allFabrics.forEach(fabric => {
      const properties = fabric.properties as any;
      if (!properties || !properties.compositions) return;

      properties.compositions.forEach((comp: any) => {
        const fibers = comp.fibers;
        
        // Print ANY multi-fiber composition to see the split
        if (fibers.length > 1) {
           const fiberStrings = fibers.map((f: any) => `${f.name}: ${f.percentage}`).join(', ');
           console.log(`[MULTI] ${fabric.name} | ${comp.name}: [${fiberStrings}]`);
        }

        fibers.forEach((f: any) => {
          const p = parseFloat(f.percentage);
          
          if (isNaN(p)) {
             console.log(`❌ [NaN] ${fabric.name} | ${comp.name}: Percentage is "${f.percentage}"`);
          }
          
          if (p === 0) {
             console.log(`❌ [ZERO] ${fabric.name} | ${comp.name}: Percentage is "${f.percentage}"`);
          }
        });
      });
    });

    console.log('\nAudit complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error auditing fabrics:', error);
    process.exit(1);
  }
}

aggressiveAudit();
