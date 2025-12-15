import { db } from "../server/db.js";
import { homepageHero, homepageSections, homepageProcessCards } from "../shared/schema.js";
// import { eq } from "drizzle-orm";

async function investigate() {
  console.log("🔍 INVESTIGATION START: Database Content vs Expected API Output\n");

  // 1. Check Hero
  const hero = await db.select().from(homepageHero).limit(1);
  console.log("📊 [DB] Hero Section:", hero[0] ? "Found" : "MISSING");
  if (hero[0]) {
    console.log("   - ID:", hero[0].id);
    console.log("   - Title:", hero[0].title);
    console.log("   - Active:", hero[0].isActive);
    console.log("   - BG Image ID:", hero[0].backgroundImageId);
  }

  // 2. Check Sections
  const sections = await db.select().from(homepageSections).orderBy(homepageSections.sortOrder);
  console.log("\n📊 [DB] Homepage Sections:", sections.length);
  sections.forEach((s) => {
    console.log(`   - [${s.id}] "${s.name}" (Type: ${s.sectionType})`);
    console.log(`     Active: ${s.isActive}, Title: "${s.title}"`);
  });

  // 3. Check Process Cards
  const cards = await db.select().from(homepageProcessCards);
  console.log("\n📊 [DB] Process Cards:", cards.length);
  cards.forEach((c) => {
    console.log(`   - [${c.id}] Step ${c.step}: "${c.title}" (Active: ${c.isActive})`);
  });

  // 4. Simulate Public API Request (Internal Logic)
  // We can't easily curl localhost from here reliably if ports vary, but we can inspect the logic.
  // Instead, let's look at the raw data that *would* be returned.

  console.log("\n🔍 END INVESTIGATION");
  process.exit(0);
}

investigate().catch(console.error);
