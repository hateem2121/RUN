// import { fabrics } from '../shared/schema.js';
import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

// Certification mapping based on tags
const fabricCertifications: Record<string, number[]> = {
	"RunTech™ Aero-Mesh 145": [25, 27], // OEKO-TEX, GRS
	"Sculpt-Core™ 260": [25, 30], // OEKO-TEX, RCS
	"Heritage French Terry 350": [23, 28], // GOTS, OCS 100
	"Storm-Shield™ 3L Softshell": [27], // GRS
	"Zen-Luxe™ Performance Jersey": [25], // OEKO-TEX
	"Thermo-Skin™ Pro": [25], // OEKO-TEX
	"Eco-Flex™ Scuba 3.0": [25], // OEKO-TEX
	"Velocity™ Diamond Ripstop": [27], // GRS
};

async function mapCertifications() {
	try {
		for (const [fabricName, certIds] of Object.entries(fabricCertifications)) {
			await db.execute(
				sql`UPDATE fabrics 
            SET properties = COALESCE(properties, '{}'::jsonb) || jsonb_build_object('certificationIds', ${JSON.stringify(
							certIds,
						)}::jsonb)
            WHERE name = ${fabricName}`,
			);
		}
		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

mapCertifications();
