
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function deepAudit() {
  try {
    console.log('🔬 Deep Auditing ALL Fabric Compositions...\n');

    const allFabrics = await db.select().from(fabrics);
    
    allFabrics.forEach(fabric => {
      const properties = fabric.properties as any;
      if (!properties || !properties.compositions) return;

      properties.compositions.forEach((comp: any) => {
        const fibers = comp.fibers;
        const fiberStrings = fibers.map((f: any) => `${f.name}: ${f.percentage}%`).join(', ');
        
        // Check for suspicious patterns
        const hasZero = fibers.some((f: any) => parseFloat(f.percentage) === 0);
        const has100And0 = fibers.length === 2 && fibers.some((f: any) => parseFloat(f.percentage) === 100) && fibers.some((f: any) => parseFloat(f.percentage) === 0);
        
        if (hasZero || has100And0) {
           console.log(`❌ [ISSUE] ${fabric.name} | ${comp.name}: [${fiberStrings}]`);
        } else {
           // Uncomment to see everything
           // console.log(`✅ ${fabric.name} | ${comp.name}: [${fiberStrings}]`);
        }
      });
    });

    console.log('\nAudit complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error auditing fabrics:', error);
    process.exit(1);
  }
}

deepAudit();
