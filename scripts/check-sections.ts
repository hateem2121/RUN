import { db } from "../server/db.js";
import { homepageSections } from "../shared/schema.js";

async function checkSections() {
  console.log("Checking homepage sections...");

  const sections = await db.select().from(homepageSections);
  console.log(`Found ${sections.length} sections`);

  sections.forEach((s: typeof homepageSections.$inferSelect) => {
    console.log(`- ${s.name}: ${s.isActive ? "Active" : "Inactive"}`);
  });
  process.exit(0);
}

checkSections().catch(console.error);
