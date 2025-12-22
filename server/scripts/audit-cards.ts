import { desc } from "drizzle-orm";
import { homepageProcessCards } from "../../shared/schema.js";
import { db } from "../db.js";

async function main() {
  console.log("🔍 Auditing Homepage Process Cards...");

  try {
    // 1. Check most recent insertions
    const recentCards = await db
      .select()
      .from(homepageProcessCards)
      .orderBy(desc(homepageProcessCards.createdAt));

    console.log(`\nFound ${recentCards.length} matching cards.`);

    if (recentCards.length > 0) {
      console.table(
        recentCards.map((c) => ({
          id: c.id,
          title: c.title,
          isActive: c.isActive,
          createdAt: c.createdAt?.toISOString(),
        })),
      );
    } else {
      console.log("No recent cards found.");
    }
  } catch (error) {
    console.error("Audit Query Failed:", error);
  }

  console.log("--- AUDIT END ---");
  process.exit(0);
}

main();
