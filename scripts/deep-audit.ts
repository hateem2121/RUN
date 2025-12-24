import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function deepAudit() {
	try {
		const allFabrics = await db.select().from(fabrics);

		allFabrics.forEach((fabric) => {
			const properties = fabric.properties as any;
			if (!properties || !properties.compositions) return;

			properties.compositions.forEach((comp: any) => {
				const fibers = comp.fibers;
				const fiberStrings = fibers
					.map((f: any) => `${f.name}: ${f.percentage}%`)
					.join(", ");

				// Check for suspicious patterns
				const hasZero = fibers.some((f: any) => parseFloat(f.percentage) === 0);
				const has100And0 =
					fibers.length === 2 &&
					fibers.some((f: any) => parseFloat(f.percentage) === 100) &&
					fibers.some((f: any) => parseFloat(f.percentage) === 0);

				if (hasZero || has100And0) {
				} else {
					// Uncomment to see everything
					// console.log(`✅ ${fabric.name} | ${comp.name}: [${fiberStrings}]`);
				}
			});
		});
		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

deepAudit();
