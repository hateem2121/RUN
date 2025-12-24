// PostgreSQL Storage Diagnostics
// Direct access to PostgreSQL data using actual available methods

import type { Express } from "express";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";

export function registerKVDiagnosticsRoutes(app: Express): void {
	const storage = getStorage();

	// Direct PostgreSQL Storage inspection
	app.get("/api/kv-direct/inspect-all", async (_req, res) => {
		try {
			logger.debug("[PostgreSQL Direct] 🔍 Inspecting all PostgreSQL data...");

			// Get all data types using actual available methods - OPTIMIZED: Parallel queries with Promise.all
			const [
				categories,
				products,
				fabrics,
				fibers,
				certificates,
				accessories,
				sizeCharts,
				mediaAssets,
				homepageHero,
				homepageSections,
				homepageProcessCards,

				navigationItems,
				contactPageConfiguration,
			] = await Promise.all([
				storage.getCategories(),
				storage.getProducts(),
				storage.getFabrics(),
				storage.getFibers(),
				storage.getCertificates(),
				storage.getAccessories(),
				storage.getSizeCharts(),
				storage.getMediaAssets(),
				storage.getHomepageHero(),
				storage.getHomepageSections(),
				storage.getHomepageProcessCards(),

				storage.getNavigationItems(),
				storage.getContactPageConfiguration(),
			]);

			const results = {
				categories,
				products,
				fabrics,
				fibers,
				certificates,
				accessories,
				sizeCharts,
				mediaAssets,
				homepageHero,
				homepageSections,
				homepageProcessCards,

				navigationItems,
				contactPageConfiguration,
			};

			// Count non-empty data
			const summary = Object.entries(results).reduce(
				(acc, [key, data]) => {
					const count = Array.isArray(data) ? data.length : data ? 1 : 0;
					acc[key] = count;
					return acc;
				},
				{} as Record<string, number>,
			);

			const totalItems = Object.values(summary).reduce(
				(sum, count) => sum + count,
				0,
			);

			res.json({
				success: true,
				message: `Found ${totalItems} total items in PostgreSQL storage`,
				summary,
				results,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			logger.error(
				"[PostgreSQL Direct] ❌ Failed to inspect PostgreSQL storage:",
				{ error },
			);
			res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	});

	// Test specific entity types
	app.get("/api/kv-direct/test/:type", async (req, res) => {
		try {
			const type = req.params.type;

			const methodMap: Record<string, () => Promise<any>> = {
				categories: () => storage.getCategories(),
				products: () => storage.getProducts(),
				fabrics: () => storage.getFabrics(),
				fibers: () => storage.getFibers(),
				certificates: () => storage.getCertificates(),
				accessories: () => storage.getAccessories(),
				sizeCharts: () => storage.getSizeCharts(),
				mediaAssets: () => storage.getMediaAssets(),
				homepageHero: () => storage.getHomepageHero(),
				homepageSections: () => storage.getHomepageSections(),
				homepageProcessCards: () => storage.getHomepageProcessCards(),

				navigationItems: () => storage.getNavigationItems(),
				contactPageConfiguration: () => storage.getContactPageConfiguration(),
			};

			const method = methodMap[type];
			if (!method) {
				return res.status(400).json({
					error: `Unknown type: ${type}. Available types: ${Object.keys(methodMap).join(", ")}`,
				});
			}

			const data = await method();

			return res.json({
				success: true,
				type,
				count: Array.isArray(data) ? data.length : data ? 1 : 0,
				data,
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	});

	logger.debug(
		"[PostgreSQL Diagnostics] ✅ PostgreSQL diagnostic routes registered",
	);
}
