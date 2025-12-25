import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function aggressiveAudit() {
  try {
    const allFabrics = await db.select().from(fabrics);

    allFabrics.forEach((fabric) => {
      const properties = fabric.properties as any;
      if (!properties || !properties.compositions) return;

      properties.compositions.forEach((comp: any) => {
        const fibers = comp.fibers;

        // Print ANY multi-fiber composition to see the split
        if (fibers.length > 1) {
          const _fiberStrings = fibers.map((f: any) => `${f.name}: ${f.percentage}`).join(", ");
        }

        fibers.forEach((f: any) => {
          const p = parseFloat(f.percentage);

          if (Number.isNaN(p)) {
          }

          if (p === 0) {
          }
        });
      });
    });
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

aggressiveAudit();
