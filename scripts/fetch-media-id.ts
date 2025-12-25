import { desc } from "drizzle-orm";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
  try {
    const result = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.id)).limit(1);
    if (result.length > 0) {
    } else {
    }
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

main();
