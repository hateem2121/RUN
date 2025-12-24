import { db } from "../server/db.js";
import { homepageSections } from "../shared/schema.js";

async function checkSections() {
	const sections = await db.select().from(homepageSections);

	sections.forEach((s: typeof homepageSections.$inferSelect) => {});
	process.exit(0);
}

checkSections().catch(console.error);
