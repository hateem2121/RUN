import { desc } from "drizzle-orm";
import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function analyzeFabrics() {
  try {
    // Fetch the last 8 fabrics (the ones we just added)
    const recentFabrics = await db.select().from(fabrics).orderBy(desc(fabrics.id)).limit(8);

    // Reverse to match insertion order for easier comparison
    const orderedFabrics = recentFabrics.reverse();

    orderedFabrics.forEach((_f) => {});

    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

analyzeFabrics();
