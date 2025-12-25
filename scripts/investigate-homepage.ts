import { db } from "../server/db.js";
import { homepageHero, homepageProcessCards, homepageSections } from "../shared/schema.js";

// import { eq } from "drizzle-orm";

async function investigate() {
  // 1. Check Hero
  const hero = await db.select().from(homepageHero).limit(1);
  if (hero[0]) {
  }

  // 2. Check Sections
  const sections = await db.select().from(homepageSections).orderBy(homepageSections.sortOrder);
  sections.forEach((_s) => {});

  // 3. Check Process Cards
  const cards = await db.select().from(homepageProcessCards);
  cards.forEach((_c) => {});
  process.exit(0);
}

investigate().catch(console.error);
