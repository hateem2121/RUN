// Extract and display user's business data for confirmation
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function showUserBusinessData() {
	let categoryCount = 0;
	for (let i = 1; i <= 50; i++) {
		try {
			const result = await db.get(`categories:${i}`);
			if (result?.ok && result?.value) {
				const cat = JSON.parse(result.value);
				categoryCount++;
			}
		} catch (e) {}
	}
	let productCount = 0;
	for (let i = 1; i <= 50; i++) {
		try {
			const result = await db.get(`products:${i}`);
			if (result?.ok && result?.value) {
				const prod = JSON.parse(result.value);
				productCount++;
				if (prod.sku) {
				}
				if (prod.description) {
				}
				if (prod.categoryId) {
				}
			}
		} catch (e) {}
	}
	let fabricCount = 0;
	for (let i = 1; i <= 50; i++) {
		try {
			const result = await db.get(`fabrics:${i}`);
			if (result?.ok && result?.value) {
				const fab = JSON.parse(result.value);
				fabricCount++;
				if (fab.fabricType) {
				}
				if (fab.description) {
				}
			}
		} catch (e) {}
	}
	let fiberCount = 0;
	for (let i = 1; i <= 50; i++) {
		try {
			const result = await db.get(`fibers:${i}`);
			if (result?.ok && result?.value) {
				const fiber = JSON.parse(result.value);
				fiberCount++;
				if (fiber.type) {
				}
				if (fiber.sustainabilityScore) {
				}
			}
		} catch (e) {}
	}
	let certCount = 0;
	for (let i = 1; i <= 50; i++) {
		try {
			const result = await db.get(`certificates:${i}`);
			if (result?.ok && result?.value) {
				const cert = JSON.parse(result.value);
				certCount++;
				if (cert.type) {
				}
				if (cert.issuingBody) {
				}
			}
		} catch (e) {}
	}
	let accessoryCount = 0;
	for (let i = 1; i <= 50; i++) {
		try {
			const result = await db.get(`accessories:${i}`);
			if (result?.ok && result?.value) {
				const acc = JSON.parse(result.value);
				accessoryCount++;
				if (acc.type) {
				}
				if (acc.description) {
				}
			}
		} catch (e) {}
	}
}

showUserBusinessData().catch(console.error);
