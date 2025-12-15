/**
 * MANUFACTURING CACHE INVALIDATION SERVICE
 * 
 * Centralized cache invalidation logic for manufacturing mutations
 * Ensures all relevant caches are invalidated when manufacturing data changes
 */

import { getQueryClient } from "@/lib/queryClient";

/**
 * Manufacturing cache keys
 */
export const MANUFACTURING_CACHE_KEYS = {
  hero: "/api/manufacturing-hero",
  processes: "/api/manufacturing-processes",
  capabilities: "/api/manufacturing-capabilities",
  qualities: "/api/manufacturing-qualities",
  batch: "/api/manufacturing-batch",
} as const;

export type ManufacturingEntity = keyof typeof MANUFACTURING_CACHE_KEYS;

/**
 * Invalidates all manufacturing-related caches
 * Use this when you need to ensure all manufacturing data is refreshed
 */
export function invalidateAllManufacturingCaches() {
  return Promise.all([
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.hero] }),
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.processes] }),
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.capabilities] }),
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.qualities] }),
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.batch] }),
  ]);
}

/**
 * Invalidates specific manufacturing entity cache + batch cache
 * Use this after mutations to ensure both the entity and batch are refreshed
 * 
 * @param entity - The manufacturing entity that was mutated
 * @example
 * // After creating a process
 * invalidateManufacturingCache('processes');
 */
export function invalidateManufacturingCache(entity: ManufacturingEntity) {
  return Promise.all([
    // Invalidate the specific entity cache
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS[entity]] }),
    // Always invalidate the batch cache since it includes all entities
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.batch] }),
  ]);
}

/**
 * Invalidates multiple specific manufacturing entity caches + batch cache
 * Use this when a mutation affects multiple entities
 * 
 * @param entities - Array of manufacturing entities that were mutated
 * @example
 * // After a bulk operation affecting processes and capabilities
 * invalidateManufacturingCaches(['processes', 'capabilities']);
 */
export function invalidateManufacturingCaches(entities: ManufacturingEntity[]) {
  const uniqueEntities = [...new Set(entities)];
  
  return Promise.all([
    // Invalidate each specific entity cache
    ...uniqueEntities.map(entity =>
      getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS[entity]] })
    ),
    // Always invalidate the batch cache
    getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.batch] }),
  ]);
}

/**
 * Invalidates only the batch cache
 * Use this sparingly - prefer invalidateManufacturingCache for most cases
 */
export function invalidateManufacturingBatchCache() {
  return getQueryClient().invalidateQueries({ queryKey: [MANUFACTURING_CACHE_KEYS.batch] });
}
