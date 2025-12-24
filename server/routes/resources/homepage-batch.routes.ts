/**
 * HOMEPAGE BATCH ROUTES MODULE
 * Page-specific aggregated data endpoint for Homepage
 * Relocated from modules/ to resources/ for consistent architecture (October 15, 2025)
 *
 * HTTP CACHE-BUSTING IMPLEMENTATION (October 15, 2025):
 * Batch endpoint includes Cache-Control headers to prevent 304 Not Modified responses.
 * This ensures admin changes appear immediately in frontend without hard refresh.
 *
 * Modified GET endpoint with cache-busting headers:
 * ✅ GET /api/homepage-batch - Aggregated homepage data (stale-while-revalidate pattern)
 *
 * Cache-busting headers applied:
 * - Cache-Control: no-cache, no-store, must-revalidate
 * - Pragma: no-cache
 * - Expires: 0
 *
 * Note: Headers applied in BOTH stale-return and fresh-return code paths.
 * Server-side caching (UnifiedCache) remains active for performance.
 */

import express from "express";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { twoTierBatchCache } from "../../lib/two-tier-batch-cache.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = express.Router();

/**
 * CHUNK 5: Homepage Batch API - Optimized with two-tier cache + stale-while-revalidate
 * Returns all homepage data in a single request to reduce frontend API calls
 * Uses TwoTierBatchCache (L1: 3min, L2: 30min) for performance
 */
router.get(
	"/homepage-batch",
	asyncHandler(async (req, res) => {
		const startTime = performance.now();

		// Support forced refresh for debugging
		const bypassCache =
			req.query.refresh === "1" || req.headers["cache-control"] === "no-cache";

		if (bypassCache) {
			logger.debug(
				"[Homepage Batch] Force refresh requested - invalidating all caches",
			);
			await twoTierBatchCache.invalidate("homepage:batch");
			await CacheOperations.invalidateHomepage();
		}

		// CHUNK 5: Two-tier cache with benchmarking - fetch function for reuse
		const fetchHomepageData = async () => {
			const timestamp = new Date().toISOString();
			const storage = getStorage();

			// PERFORMANCE: Fetch all data in parallel
			// Process cards excluded - separate lazy-loaded endpoint /api/homepage-process-cards
			const [
				hero,
				slogans,
				sections,
				featuredProductsSettings,
				products,
				categories,
			] = await Promise.all([
				storage.getHomepageHero(),
				storage.getHomepageSlogans(),
				storage.getHomepageSections(),

				storage.getHomepageFeaturedProductsSettings(),
				storage.getProducts(20),
				storage.getCategories(),
			]);

			return {
				hero: { result: hero, timestamp },
				slogans: { result: slogans, timestamp },
				sections: { result: sections, timestamp },

				featuredProductsSettings: {
					result: featuredProductsSettings,
					timestamp,
				},
				products: { result: products, timestamp },
				categories: { result: categories, timestamp },
			};
		};

		// PHASE 2A TASK 7: Get data with SWR-enabled two-tier cache
		const { data: batchData, benchmark } = await twoTierBatchCache.get(
			"homepage:batch",
			fetchHomepageData,
			{
				bypassCache,
			},
		);

		const responseTime = performance.now() - startTime;

		// CHUNK 5: Log performance metrics and benchmark results
		res.setHeader("X-Cache-Hit", benchmark.hit);
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.setHeader("Pragma", "no-cache");
		res.setHeader("Expires", "0");

		if (benchmark.hit !== "MISS") {
			const cacheTime =
				benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
			logger.info(
				`[Homepage Batch] ✅ ${benchmark.hit} HIT (${cacheTime?.toFixed(2)}ms)`,
			);
			logger.debug(
				`[Homepage Batch] Total response time: ${responseTime.toFixed(1)}ms`,
			);
		} else {
			const dbTime = benchmark.dbTime || 0;
			logger.info(`[Homepage Batch] ⬆️ MISS + CACHED (${dbTime.toFixed(2)}ms)`);

			// CHUNK 5: Validate <300ms target for batch queries
			if (dbTime < 300) {
				logger.info(
					`✅ SUCCESS: Homepage batch ${dbTime.toFixed(2)}ms < 300ms target`,
				);
			} else if (dbTime < 500) {
				logger.debug(
					`[Homepage Batch] Response time ${dbTime.toFixed(1)}ms within acceptable range`,
				);
			} else {
				logger.warn(
					`⚠️ WARN: Homepage batch ${dbTime.toFixed(2)}ms exceeds 500ms target`,
				);
			}
		}

		res.json(batchData);
	}),
);

// CHUNK 5: Cache Performance Monitoring
router.get(
	"/performance-monitoring",
	asyncHandler(async (_req, res) => {
		// Get TwoTierBatchCache metrics
		const batchCacheMetrics = twoTierBatchCache.getMetrics();

		const monitoring = {
			timestamp: new Date().toISOString(),
			cacheSystem: "TwoTierBatchCache (Chunk 5)",
			batchCacheMetrics: {
				hitRate: `${batchCacheMetrics.hitRate.toFixed(2)}%`,
				l1HitRate: `${batchCacheMetrics.l1HitRate.toFixed(2)}%`,
				l2HitRate: `${batchCacheMetrics.l2HitRate.toFixed(2)}%`,
				missRate: `${batchCacheMetrics.missRate.toFixed(2)}%`,
				avgL1Time: `${batchCacheMetrics.avgL1Time.toFixed(2)}ms`,
				avgL2Time: `${batchCacheMetrics.avgL2Time.toFixed(2)}ms`,
				avgDbTime: `${batchCacheMetrics.avgDbTime.toFixed(2)}ms`,
				totalRequests: batchCacheMetrics.totalRequests,
			},
			successCriteria: {
				hitRateTarget: ">80%",
				hitRateCurrent: `${batchCacheMetrics.hitRate.toFixed(2)}%`,
				hitRateMet: batchCacheMetrics.hitRate >= 80 ? "✅ YES" : "❌ NO",
				batchQueryTarget: "<300ms",
				batchQueryCurrent: `${batchCacheMetrics.avgDbTime.toFixed(2)}ms`,
				batchQueryMet: batchCacheMetrics.avgDbTime < 300 ? "✅ YES" : "❌ NO",
			},
			systemHealth: {
				databaseDriver: "HTTP-based Neon (no TCP pool exhaustion)",
				cacheArchitecture: "Two-tier: L1(3min in-memory) + L2(30min KV)",
				parallelization: "Promise.all for batch queries",
				benchmarking: "Real-time performance tracking enabled",
			},
		};

		res.json(monitoring);
	}),
);

// CHUNK 5: Separate process cards endpoint with two-tier cache
// Process cards are slower, so we split them for lazy loading
router.get(
	"/homepage-process-cards",
	asyncHandler(async (req, res) => {
		const bypassCache =
			req.query.refresh === "1" || req.headers["cache-control"] === "no-cache";

		// PHASE 2A TASK 7: Two-tier cache with SWR
		const { data, benchmark } = await twoTierBatchCache.get(
			"homepage:process-cards",
			async () => {
				const storage = getStorage();
				const processCards = await storage.getHomepageProcessCards();

				return {
					result: processCards,
					timestamp: new Date().toISOString(),
				};
			},
			{
				bypassCache,
				// swrConfig: {
				//   fresh: 5 * 60 * 1000,  // Fresh for 5 minutes
				//   stale: 30 * 60 * 1000, // Serve stale for 30 minutes while revalidating
				//   expire: 60 * 60 * 1000 // Hard expiry at 1 hour
				// }
			},
		);

		// CHUNK 5: Log performance metrics
		res.setHeader("X-Cache-Hit", benchmark.hit);
		res.setHeader("Cache-Control", "public, max-age=600");

		if (benchmark.hit !== "MISS") {
			const cacheTime =
				benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
			logger.debug(
				`[Process Cards] ✅ ${benchmark.hit} HIT (${cacheTime?.toFixed(2)}ms)`,
			);
		} else {
			logger.debug(
				`[Process Cards] ⬆️ MISS + CACHED (${benchmark.dbTime?.toFixed(2)}ms)`,
			);
		}

		res.json(data);
	}),
);

// Individual homepage endpoints are handled by homepage-management.routes.ts
// This module focuses specifically on the batch API for optimal performance

logger.debug("[Homepage Batch] ✅ Homepage batch routes loaded (resources/)");

export default router;
