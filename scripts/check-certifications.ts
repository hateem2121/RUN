import { desc } from "drizzle-orm";
import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function checkCertifications() {
  try {
    const recentFabrics = await db.select().from(fabrics).orderBy(desc(fabrics.id)).limit(8);
    const orderedFabrics = recentFabrics.reverse();

    orderedFabrics.forEach((_f) => {});

    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

checkCertifications();
