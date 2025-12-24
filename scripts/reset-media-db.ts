import { db } from "../server/db.js";
import { mediaAssets, products } from "../shared/schema.js";

async function resetMediaDB() {
	try {
		await db.update(products).set({ primaryImageId: null });
		await db.delete(mediaAssets);

		// 3. Verify
		const count = await db.query.mediaAssets.findMany();
		if (count.length === 0) {
		} else {
			process.exit(1);
		}
	} catch (error) {
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

resetMediaDB();
