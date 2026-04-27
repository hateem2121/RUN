import { db } from "../server/db.js";
import { aboutHero, aboutSections, aboutTimelineEntries } from "../shared/schemas/index.js";

async function checkData() {
  try {
    const heroRows = await db.select().from(aboutHero);
    const sectionRows = await db.select().from(aboutSections);
    const timelineRows = await db.select().from(aboutTimelineEntries);

    console.log("--- About Page Data Check ---");
    console.log(`About Hero: ${heroRows.length} rows`);
    if (heroRows.length > 0) {
      for (const r of heroRows) {
        console.log(`  Hero ID: ${r.id}, Title: ${r.title}, IsActive: ${r.isActive}`);
      }
    }

    console.log(`About Sections: ${sectionRows.length} rows`);
    console.log(`About Timeline: ${timelineRows.length} rows`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Data check failed:", error);
    process.exit(1);
  }
}

checkData();
