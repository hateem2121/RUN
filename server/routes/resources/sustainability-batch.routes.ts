/**
 * SUSTAINABILITY BATCH RESOURCE ROUTER
 *
 * Optimized batch endpoint to reduce NEON active time
 * Combines multiple sustainability queries into a single API call
 *
 * Routes:
 * - GET /api/sustainability/batch - Get all sustainability data in parallel
 */

import { type Request, Router } from "express";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { twoTierBatchCache } from "../../lib/two-tier-batch-cache.js";

const router = Router();

/**
 * Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
	return (
		req.headers.referer?.includes("/admin") || req.query.nocache === "true"
	);
}

/**
 * GET /api/sustainability/batch
 * Returns all sustainability data in a single request
 * Reduces NEON connection active time by using Promise.all for parallel fetching
 */
router.get("/", async (req, res) => {
	try {
		// PHASE 2A TASK 7: Two-tier cache with SWR
		const { data: batchData, benchmark } = await twoTierBatchCache.get(
			"sustainability:batch",
			async () => {
				// Fetch all sustainability data in parallel to minimize NEON connection time
				const [hero, metrics, initiatives, goals, certificates] =
					await Promise.all([
						withTimeout(
							getStorage().getUnifiedSustainability(),
							10000,
							"Get unified sustainability",
						),
						withTimeout(
							getStorage().getSustainabilityMetrics(),
							10000,
							"Get sustainability metrics",
						),
						withTimeout(
							getStorage().getSustainabilityInitiatives(),
							10000,
							"Get sustainability initiatives",
						),
						withTimeout(
							getStorage().getSustainabilityGoals(),
							10000,
							"Get sustainability goals",
						),
						withTimeout(
							getStorage().getCertificates(),
							10000,
							"Get certificates",
						),
					]);

				// Construct batch response
				return {
					hero: hero || null,
					metrics: metrics || [],
					initiatives: initiatives || [],
					goals: goals || [],
					certificates: certificates || [],
				};
			},
			{
				bypassCache: shouldBypassCache(req),
				swrConfig: {
					ttl: 60 * 60 * 1000, // 1 hour TTL
					// fresh: 60 * 60 * 1000,  // Fresh for 1 hour
					// stale: 6 * 60 * 60 * 1000, // Serve stale for 6 hours while revalidating
					// expire: 24 * 60 * 60 * 1000 // Hard expiry at 24 hours
				},
			},
		);

		// CHUNK 5: Log performance metrics and benchmark results
		res.setHeader("X-Cache-Hit", benchmark.hit);

		if (benchmark.hit !== "MISS") {
			const cacheTime =
				benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
			logger.info(
				`[SustainabilityBatch] ✅ ${benchmark.hit} HIT (${cacheTime?.toFixed(2)}ms)`,
			);
		} else {
			const dbTime = benchmark.dbTime || 0;
			logger.info(
				`[SustainabilityBatch] ⬆️ MISS + CACHED (${dbTime.toFixed(2)}ms)`,
			);

			// CHUNK 5: Validate <300ms target for batch queries
			if (dbTime < 300) {
				logger.info(
					`✅ SUCCESS: Batch query ${dbTime.toFixed(2)}ms < 300ms target`,
				);
			} else {
				logger.warn(
					`⚠️ WARN: Batch query ${dbTime.toFixed(2)}ms exceeds 300ms target`,
				);
			}
		}

		return res.json(batchData);
	} catch (error) {
		logger.error("[SustainabilityBatch] Error fetching batch data:", error);
		return res.status(500).json({
			success: false,
			error: {
				message:
					error instanceof Error ? error.message : "Failed to fetch batch data",
			},
		});
	}
});

export default router;
