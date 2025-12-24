import { db } from "../server/db.js";
import { fibers } from "../shared/schema.js";

async function listFibers() {
	try {
		const allFibers = await db.select().from(fibers);
		allFibers.forEach((f) => {});
		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

listFibers();
