import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function checkSingleFibers() {
  try {
    const allFabrics = await db.select().from(fabrics);

    allFabrics.forEach((fabric) => {
      const properties = fabric.properties as any;
      if (!properties || !properties.compositions) return;

      properties.compositions.forEach((comp: any) => {
        const fibers = comp.fibers;

        // Check if it's a single fiber composition
        if (fibers.length === 1) {
          const f = fibers[0];
          if (parseFloat(f.percentage) === 100) {
            // This is valid, but maybe the user thinks it's an issue?
            // Or maybe there's a hidden second fiber that is null?
            // console.log(`ℹ️ [SINGLE] ${fabric.name} | ${comp.name}: 100% ${f.name}`);
          } else {
          }
        }

        // Check if there are any fibers with 0% that I missed?
        // My previous script checked for parseFloat === 0.
        // Let's check for "0" string explicitly or null.
        fibers.forEach((f: any) => {
          if (f.percentage === "0" || f.percentage === 0 || f.percentage === "0%") {
          }
        });
      });
    });
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

checkSingleFibers();
