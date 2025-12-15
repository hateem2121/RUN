
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function auditCompositions() {
  try {
    console.log('🕵️ Auditing fabric compositions...\n');

    const allFabrics = await db.select().from(fabrics);
    let issuesFound = 0;

    allFabrics.forEach(fabric => {
      const properties = fabric.properties as any;
      if (!properties || !properties.compositions) return;

      properties.compositions.forEach((comp: any) => {
        let total = 0;
        let hasZero = false;

        comp.fibers.forEach((f: any) => {
          const p = parseFloat(f.percentage);
          total += p;
          if (p === 0) hasZero = true;
        });

        // Check for 0% entries
        if (hasZero) {
          console.log(`❌ [ZERO PERCENT] Fabric: "${fabric.name}" | Comp: "${comp.name}" has a 0% fiber.`);
          issuesFound++;
        }

        // Check for sum != 100% (allow small float error)
        if (Math.abs(total - 100) > 1) {
           console.log(`⚠️ [BAD SUM] Fabric: "${fabric.name}" | Comp: "${comp.name}" sums to ${total}% (expected 100%)`);
           issuesFound++;
        }
      });
    });

    if (issuesFound === 0) {
      console.log('✅ No issues found! All compositions sum to 100% and have no 0% entries.');
    } else {
      console.log(`\nFound ${issuesFound} issues.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error auditing fabrics:', error);
    process.exit(1);
  }
}

auditCompositions();
