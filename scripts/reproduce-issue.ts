import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { homepageProcessCards } from "../shared/schema.js";

async function reproduce() {
	// 1. Create a card directly in DB to verify persistence works
	const newCard = {
		title: "Test Card " + Date.now(),
		description: "This is a test card created by the reproduction script.",
		step: 1,
		icon: "settings",
		iconType: "text",
		isActive: true,
		position: 0,
	};
	const [created] = await db
		.insert(homepageProcessCards)
		.values(newCard)
		.returning();
	if (!created) {
		process.exit(1);
	}

	const fetched = await db.query.homepageProcessCards.findFirst({
		where: (cards, { eq }) => eq(cards.id, created.id),
	});

	if (!fetched) {
		process.exit(1);
	}

	if (fetched.id !== created.id) {
		process.exit(1);
	}

	// 2. Verify it exists in DB
	const inDb = await db
		.select()
		.from(homepageProcessCards)
		.where(eq(homepageProcessCards.id, created.id));

	if (inDb.length > 0) {
	}
	await db
		.delete(homepageProcessCards)
		.where(eq(homepageProcessCards.id, created.id));

	process.exit(0);
}

reproduce().catch(console.error);
