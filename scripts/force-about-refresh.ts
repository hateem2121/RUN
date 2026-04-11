import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { PageContentRepository } from "../server/lib/db/repositories/page-content-repository.js";
import { aboutHero } from "../shared/schemas/index.js";

async function forceRefresh() {
  const repo = new PageContentRepository();
  const heroes = await db.select().from(aboutHero);

  if (heroes.length > 0) {
    console.log(`Found ${heroes.length} heroes. Forcing update on first one to clear cache...`);
    const firstHero = heroes[0];
    await repo.updateAboutHero({
      isActive: true,
      updatedAt: new Date(),
    });
    console.log("✅ Update triggered, cache should be invalidated.");
  } else {
    console.log("❌ No heroes found to update.");
  }
  process.exit(0);
}

forceRefresh();
