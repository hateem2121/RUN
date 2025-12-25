import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function auditCompositions() {
  try {
    const allFabrics = await db.select().from(fabrics);
    let issuesFound = 0;

    allFabrics.forEach((fabric) => {
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
          issuesFound++;
        }

        // Check for sum != 100% (allow small float error)
        if (Math.abs(total - 100) > 1) {
          issuesFound++;
        }
      });
    });

    if (issuesFound === 0) {
    } else {
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

auditCompositions();
