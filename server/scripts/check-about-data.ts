import { aboutSections, aboutTeamMessages } from "../../shared/schema/content/about.js";
import { db } from "../db.js";

async function checkAboutData() {
  console.log("🔍 Checking About Page data in DB...");

  try {
    const teamMessages = await db.select().from(aboutTeamMessages);
    console.log(`Team Messages Count: ${teamMessages.length}`);
    console.log("Team Messages Data:", JSON.stringify(teamMessages, null, 2));

    const sections = await db.select().from(aboutSections);
    console.log(`Sections Count: ${sections.length}`);
    console.log("Sections Data:", JSON.stringify(sections, null, 2));
  } catch (error) {
    console.error("❌ Check failed:", error);
  }
  process.exit(0);
}

checkAboutData();
