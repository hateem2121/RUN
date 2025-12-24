#!/usr/bin/env tsx

import { db } from "../server/db.js";
import { accessories } from "../shared/schema.js";

async function checkAccessories() {
	try {
		const allAccessories = await db.select().from(accessories);

		allAccessories.forEach((acc, index) => {});
	} catch (error) {
		throw error;
	} finally {
		process.exit(0);
	}
}

try {
	await checkAccessories();
} catch (error) {
	process.exit(1);
}
