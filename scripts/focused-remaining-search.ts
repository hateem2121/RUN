// Focused search for remaining admin content
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function findRemainingContent() {
	const allContent = [];

	// Focus on content types likely to have data based on the website structure
	const priorityContentTypes = [
		"aboutUs",
		"companyHistory",
		"teamMembers",
		"leadership",
		"manufacturingProcess",
		"qualityStandards",
		"equipmentInfo",
		"customerTestimonials",
		"caseStudies",
		"newsArticles",
		"blogPosts",
		"innovations",
		"researchDevelopment",
		"awards",
		"achievements",
		"contactInfo",
		"locations",
		"services",
		"capabilities",
		"faq",
		"downloads",
		"resources",
		"socialMedia",
	];

	for (const contentType of priorityContentTypes) {
		let count = 0;

		for (let i = 1; i <= 15; i++) {
			try {
				const result = await db.get(`${contentType}:${i}`);
				if (result?.ok && result?.value) {
					const item = JSON.parse(result.value);
					count++;
					allContent.push({ type: contentType, item });
					if (item.description) {
					}
					if (item.content) {
					}
					if (item.position || item.role) {
					}
					if (item.date) {
					}
					if (item.category) {
					}
				}
			} catch (e) {}
		}

		if (count > 0) {
		}
	}
	const patterns = [
		"company",
		"team",
		"news",
		"blog",
		"case",
		"story",
		"award",
		"innovation",
		"research",
	];

	for (const pattern of patterns) {
		let patternCount = 0;
		for (let i = 1; i <= 10; i++) {
			try {
				const result = await db.get(`${pattern}:${i}`);
				if (result?.ok && result?.value) {
					const item = JSON.parse(result.value);
					patternCount++;
					allContent.push({ type: pattern, item });
				}
			} catch (e) {}
		}
		if (patternCount > 0) {
		}
	}
	return allContent;
}

findRemainingContent().catch(console.error);
