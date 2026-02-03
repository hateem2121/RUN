import { desc } from "drizzle-orm";
import { homepageProcessCards } from "../../shared/schema.js";
import { db } from "../db.js";

async function main() {
  try {
    // 1. Check most recent insertions
    const recentCards = await db
      .select()
      .from(homepageProcessCards)
      .orderBy(desc(homepageProcessCards.createdAt));

    if (recentCards.length > 0) {
    } else {
    }
  } catch (_error) {}
  process.exit(0);
}

main();
