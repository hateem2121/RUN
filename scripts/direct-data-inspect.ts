// @ts-nocheck
// Direct inspection of Key-Value Store data
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function inspectRawData() {
	for (let i = 1; i <= 3; i++) {
		try {
			const raw = await db.get(`categories:${i}`);
		} catch (e) {}
	}
	for (let i = 1; i <= 3; i++) {
		try {
			const raw = await db.get(`products:${i}`);
		} catch (e) {}
	}
	try {
		const catBatch = await db.get("categories");
		if (Array.isArray(catBatch) && catBatch.length > 0) {
		}
	} catch (e) {}

	try {
		const prodBatch = await db.get("products");
		if (Array.isArray(prodBatch) && prodBatch.length > 0) {
		}
	} catch (e) {}
}

inspectRawData().catch(() => {});
