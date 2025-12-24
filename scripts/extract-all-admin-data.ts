// Extract ALL admin data from all sections
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function extractAllAdminData() {
	let accessoryCount = 0;
	for (let i = 1; i <= 20; i++) {
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
	let sizeChartCount = 0;
	for (let i = 1; i <= 20; i++) {
		try {
			const result = await db.get(`sizeCharts:${i}`);
			if (result?.ok && result?.value) {
				const size = JSON.parse(result.value);
				sizeChartCount++;
				if (size.category) {
				}
				if (size.description) {
				}
			}
		} catch (e) {}
	}

	// Homepage hero
	try {
		const heroResult = await db.get("homepageHero:1");
		if (heroResult?.ok && heroResult?.value) {
			const hero = JSON.parse(heroResult.value);
		}
	} catch (e) {}

	// Homepage sections
	let homepageSectionCount = 0;
	for (let i = 1; i <= 10; i++) {
		try {
			const result = await db.get(`homepageSections:${i}`);
			if (result?.ok && result?.value) {
				const section = JSON.parse(result.value);
				homepageSectionCount++;
				if (section.description) {
				}
			}
		} catch (e) {}
	}

	// Homepage process cards
	let processCardCount = 0;
	for (let i = 1; i <= 10; i++) {
		try {
			const result = await db.get(`homepageProcessCards:${i}`);
			if (result?.ok && result?.value) {
				const card = JSON.parse(result.value);
				processCardCount++;
				if (card.description) {
				}
			}
		} catch (e) {}
	}
	let navCount = 0;
	for (let i = 1; i <= 10; i++) {
		try {
			const result = await db.get(`navigationItems:${i}`);
			if (result?.ok && result?.value) {
				const nav = JSON.parse(result.value);
				navCount++;
				if (nav.description) {
				}
			}
		} catch (e) {}
	}

	// Footer sections
	let footerSectionCount = 0;
	for (let i = 1; i <= 5; i++) {
		try {
			const result = await db.get(`footerSections:${i}`);
			if (result?.ok && result?.value) {
				const section = JSON.parse(result.value);
				footerSectionCount++;
			}
		} catch (e) {}
	}

	// Footer links
	let footerLinkCount = 0;
	for (let i = 1; i <= 20; i++) {
		try {
			const result = await db.get(`footerLinks:${i}`);
			if (result?.ok && result?.value) {
				const link = JSON.parse(result.value);
				footerLinkCount++;
			}
		} catch (e) {}
	}

	const techSections = [
		"technologyHero",
		"technologyInnovations",
		"technologyEquipment",
		"technologyCta",
		"technologyRoadmap",
		"technologyResearch",
	];

	for (const section of techSections) {
		let count = 0;
		for (let i = 1; i <= 10; i++) {
			try {
				const result = await db.get(`${section}:${i}`);
				if (result?.ok && result?.value) {
					const item = JSON.parse(result.value);
					count++;
					if (item.title) {
					}
					if (item.name) {
					}
					if (item.description) {
					}
				}
			} catch (e) {}
		}
	}

	const settingKeys = [
		"navigationGlassmorphismSettings",
		"homepageFeaturedProductsSettings",
		"contactSettings",
		"generalSettings",
	];

	for (const key of settingKeys) {
		try {
			const result = await db.get(`${key}:1`);
			if (result?.ok && result?.value) {
				const setting = JSON.parse(result.value);
			}
		} catch (e) {}
	}
}

extractAllAdminData().catch(console.error);
