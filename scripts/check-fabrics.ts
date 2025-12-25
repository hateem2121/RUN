import { desc } from "drizzle-orm";
import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function checkFabrics() {
  try {
    const allFabrics = await db.select().from(fabrics).orderBy(desc(fabrics.id)).limit(10);
    allFabrics.forEach((_f) => {});

    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

checkFabrics();
