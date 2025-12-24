import { db } from "../server/db.js";
import { homepageProcessCards } from "../shared/schema.js";

async function checkCards() {
	const cards = await db.select().from(homepageProcessCards);
	process.exit(0);
}

checkCards().catch(console.error);
