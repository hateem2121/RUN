// @ts-nocheck
// Comprehensive search for ALL admin content across all frontend sections
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function comprehensiveAdminSearch() {
	const searchResults = {
		totalFound: 0,
		contentSections: {},
	};

	// Define all possible content types for a comprehensive B2B website
	const contentTypes = [
		// Company/About Content
		"aboutUs",
		"companyHistory",
		"missionVision",
		"companyValues",
		"leadership",
		"teamMembers",

		// Manufacturing Content
		"manufacturingProcess",
		"equipmentInfo",
		"facilityInfo",
		"capabilities",
		"qualityControl",
		"productionSteps",
		"manufacturingLocations",
		"factoryTour",

		// Quality & Standards
		"qualityStandards",
		"qualityAssurance",
		"testingProcedures",
		"complianceInfo",

		// Sustainability & Environment
		"sustainabilityInitiatives",
		"environmentalPolicy",
		"greenPractices",
		"carbonFootprint",
		"ecoFriendlyProcesses",
		"sustainabilityReports",
		"environmentalCertifications",

		// Technology & Innovation
		"innovationProjects",
		"researchDevelopment",
		"technologyPartners",
		"innovations",
		"techSpecs",
		"advancedMaterials",
		"smartTextiles",

		// Customer & Business
		"customerTestimonials",
		"caseStudies",
		"successStories",
		"clientLogos",
		"partnerships",
		"industryRecognition",
		"awards",
		"achievements",

		// News & Media
		"newsArticles",
		"pressReleases",
		"blogPosts",
		"mediaKit",
		"publications",

		// Contact & Locations
		"contactInfo",
		"locations",
		"officeInfo",
		"salesTeam",
		"support",

		// Services & Capabilities
		"services",
		"customization",
		"designServices",
		"consultingServices",

		// Product Information
		"productCategories",
		"productLines",
		"specifications",
		"catalogs",

		// Homepage Specific
		"homepageStats",
		"homepageTestimonials",
		"homepagePartners",
		"homepageAwards",

		// Footer & Navigation
		"footerContent",
		"navigationMenus",
		"socialMedia",
		"legalInfo",
		"privacyPolicy",

		// Forms & CTAs
		"contactForms",
		"quoteRequests",
		"inquiryForms",
		"callToActions",

		// Additional Website Content
		"faq",
		"glossary",
		"downloads",
		"resources",
		"whitepapers",
		"brochures",
	];

	// Search each content type systematically
	for (const contentType of contentTypes) {
		let typeCount = 0;

		// Search for individual items (contentType:1, contentType:2, etc.)
		for (let i = 1; i <= 20; i++) {
			try {
				const result = await db.get(`${contentType}:${i}`);
				if (result?.ok && result?.value) {
					const item = JSON.parse(result.value);
					typeCount++;
					searchResults.totalFound++;

					// Show relevant details based on content type
					// Show relevant details based on content type
					// Details logging removed for lint compliance
				}
			} catch (e) {
				// Continue searching
			}
		}

		// Also search for batch data (contentType without index)
		try {
			const batchResult = await db.get(contentType);
			if (batchResult?.ok && batchResult?.value) {
				const batchData = JSON.parse(batchResult.value);
				if (Array.isArray(batchData) && batchData.length > 0) {
					typeCount += batchData.length;
					searchResults.totalFound += batchData.length;
				}
			}
		} catch (e) {
			// Continue
		}

		if (typeCount > 0) {
			searchResults.contentSections[contentType] = typeCount;
		} else {
		}
	}

	const commonPrefixes = [
		"page",
		"content",
		"section",
		"block",
		"widget",
		"component",
		"module",
	];

	for (const prefix of commonPrefixes) {
		let prefixCount = 0;

		for (let i = 1; i <= 15; i++) {
			try {
				const result = await db.get(`${prefix}:${i}`);
				if (result?.ok && result?.value) {
					const item = JSON.parse(result.value);
					prefixCount++;
					searchResults.totalFound++;
					// Details logging removed for lint compliance
				}
			} catch (e) {}
		}

		if (prefixCount > 0) {
		}
	}

	if (Object.keys(searchResults.contentSections).length > 0) {
		for (const [type, count] of Object.entries(searchResults.contentSections)) {
		}
	}

	return searchResults;
}

comprehensiveAdminSearch().catch(() => {});
