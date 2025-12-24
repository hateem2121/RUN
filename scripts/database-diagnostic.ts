// @ts-nocheck
import { storage } from "../server/storage.js";

async function performDatabaseDiagnostic() {
	const entities = [
		{ name: "Categories", method: "getCategories" },
		{ name: "Fibers", method: "getFibers" },
		{ name: "Fabrics", method: "getFabrics" },
		{ name: "Products", method: "getProducts" },
		{ name: "Certificates", method: "getCertificates" },
		{ name: "Size Charts", method: "getSizeCharts" },
		{ name: "Accessories", method: "getAccessories" },
		{ name: "Media Assets", method: "getMediaAssets" },
		{ name: "Navigation Items", method: "getNavigationItems" },
		{ name: "Footer Sections", method: "getFooterSections" },
		{ name: "Footer Links", method: "getFooterLinks" },
		{ name: "Homepage Hero", method: "getHomepageHero" },
		{ name: "Homepage Slogans", method: "getHomepageSlogans" },
		{ name: "Homepage Process Cards", method: "getHomepageProcessCards" },
		{ name: "Homepage Sections", method: "getHomepageSections" },
	];

	let totalIssues = 0;
	let workingEndpoints = 0;

	for (const entity of entities) {
		try {
			const data = await (storage as any)[entity.method]();

			if (Array.isArray(data)) {
				if (data.length > 0) {
					workingEndpoints++;
				} else {
					totalIssues++;
				}
			} else if (data && typeof data === "object") {
				workingEndpoints++;
			} else {
				totalIssues++;
			}
		} catch (error) {
			totalIssues++;
		}
	}

	if (totalIssues > 0) {
	}
}

// Run the diagnostic
performDatabaseDiagnostic().catch(() => {});
