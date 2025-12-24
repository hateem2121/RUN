#!/usr/bin/env tsx

/**
 * Clear accessories cache to show newly added data
 */

import { UnifiedCache } from "../server/lib/unified-cache.js";

const cache = UnifiedCache.getInstance();

async function clearAccessoriesCache() {
	try {
		// Clear all accessories-related cache keys
		await cache.clearPattern("accessories:");
		await cache.clearPattern("accessory:");
	} catch (error) {
		throw error;
	} finally {
		process.exit(0);
	}
}

try {
	await clearAccessoriesCache();
} catch (error) {
	process.exit(1);
}
