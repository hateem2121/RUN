// Quick sample of user's business data
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function showDataSample() {
	for (let i = 1; i <= 5; i++) {
		try {
			const cat = await db.get(`categories:${i}`);
			if (cat) {
				if (cat.description) {
				}
			}
		} catch (e) {}
	}
	for (let i = 1; i <= 5; i++) {
		try {
			const prod = await db.get(`products:${i}`);
			if (prod) {
				if (prod.sku) {
				}
				if (prod.description) {
				}
			}
		} catch (e) {}
	}
	for (let i = 1; i <= 5; i++) {
		try {
			const fab = await db.get(`fabrics:${i}`);
			if (fab) {
				if (fab.fabricType) {
				}
			}
		} catch (e) {}
	}
}

showDataSample().catch(console.error);
