import { aboutSections, aboutTeamMessages } from "../../shared/schema/content/about.js";
import { db } from "../db.js";

async function checkAboutData() {
  try {
    const _teamMessages = await db.select().from(aboutTeamMessages);

    const _sections = await db.select().from(aboutSections);
  } catch (_error) {}
  process.exit(0);
}

checkAboutData();
