/**
 * ACCESSORY REPOSITORY
 * Handles accessory operations with 2-tier caching and performance monitoring
 *
 * ⚠️ MANDATORY CACHE KEY STANDARD: All paginated accessory queries MUST use the pattern:
 * - Cache Key: `accessories:paginated:${limit}:${offset}`
 * - Invalidation: Clear ALL keys matching `accessories:paginated:` prefix
 */

import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import type { Accessory, InsertAccessory } from "../../../../shared/index.js";
import { accessories } from "../../../../shared/index.js";
import { db } from "../../../db.js";
import { emitCacheInvalidation } from "../../cache/cache-events.js";
import { UnifiedCache } from "../../cache/unified-cache.js";
import { logger } from "../../monitoring/logger.js";
import { StorageSingleton } from "../../storage-singleton.js";
import { dbCircuitBreaker } from "../db-circuit-breaker.js";
import { queryPerformanceMonitor } from "../query-performance.js";

const unifiedCache = UnifiedCache.getInstance();
const ACCESSORY_CACHE_TTL = 86400 * 1000; // 24 hours (accessories change infrequently)

/**
 * Normalize filter object for consistent cache keys
 * Sorts object keys alphabetically before serialization to prevent cache misses from key order differences
 */
function normalizeFilters(filters?: { category?: string | undefined; search?: string }): string {
  if (!filters || Object.keys(filters).length === 0) {
    return "{}";
  }

  // Sort keys alphabetically for consistent cache keys
  const sortedKeys = Object.keys(filters).sort();
  const normalized: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const value = filters[key as keyof typeof filters];
    if (value !== undefined && value !== null && value !== "") {
      normalized[key] = value;
    }
  }

  return JSON.stringify(normalized);
}

class AccessoryRepository {
  /**
   * Get single accessory by ID (with cache)
   */
  async getAccessory(id: number): Promise<Accessory | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAccessory(id);
    }
    const cacheKey = `accessory:${id}`;

    const cached = await unifiedCache.get<Accessory>(cacheKey);
    if (cached) {
      logger.debug(`[AccessoryRepo] Cache HIT for getAccessory(${id})`);
      return cached;
    }

    const [accessory] = await db
      .select()
      .from(accessories)
      .where(
        and(eq(accessories.id, id), isNull(accessories.deletedAt), eq(accessories.isActive, true)),
      );

    if (accessory) {
      await unifiedCache.set(cacheKey, accessory, ACCESSORY_CACHE_TTL);
    }

    return accessory;
  }

  /**
   * Get paginated accessories with filtering and caching
   */
  async getAccessories(
    limit: number = 100,
    offset: number = 0,
    filters?: { category?: string | undefined; search?: string },
  ): Promise<Accessory[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAccessories(limit, offset, filters);
    }
    const perfTracker = queryPerformanceMonitor.startQuery("getAccessories");

    const cacheKey = `accessories:paginated:${limit}:${offset}:${normalizeFilters(filters)}`;

    const cached = await unifiedCache.get<Accessory[]>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      logger.debug(`[AccessoryRepo] Cache HIT for getAccessories(${limit}, ${offset})`);
      return cached;
    }

    const result = await dbCircuitBreaker.execute(async () => {
      const conditions = [isNull(accessories.deletedAt), eq(accessories.isActive, true)];

      // Add category filter
      if (filters?.category) {
        conditions.push(eq(accessories.category, filters.category));
      }

      // Add search filter on name, description, sku
      if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(accessories.name, searchPattern),
            ilike(accessories.description, searchPattern),
            ilike(accessories.sku, searchPattern),
          )!,
        );
      }

      return await db
        .select()
        .from(accessories)
        .where(and(...conditions))
        .orderBy(desc(accessories.createdAt))
        .limit(limit)
        .offset(offset);
    }, "getAccessories");

    // Cache for 24 hours
    await unifiedCache.set(cacheKey, result, ACCESSORY_CACHE_TTL);

    logger.debug(
      `[AccessoryRepo] getAccessories(${limit}, ${offset}) returned ${result.length} items`,
    );

    perfTracker.setCacheHit(false).complete();
    return result;
  }

  /**
   * Get total count of accessories with filters
   */
  async getAccessoriesCount(filters?: {
    category?: string | undefined;
    search?: string;
  }): Promise<number> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAccessoriesCount(filters);
    }
    const conditions = [isNull(accessories.deletedAt), eq(accessories.isActive, true)];

    if (filters?.category) {
      conditions.push(eq(accessories.category, filters.category));
    }

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(accessories.name, searchPattern),
          ilike(accessories.description, searchPattern),
          ilike(accessories.sku, searchPattern),
        )!,
      );
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(accessories)
      .where(and(...conditions));

    return Number(result[0]?.count || 0);
  }

  /**
   * NEON OPTIMIZATION: Batch query - get accessories with count in parallel
   */
  async getAccessoriesWithCount(
    limit: number = 100,
    offset: number = 0,
    filters?: { category?: string | undefined; search?: string },
  ): Promise<{ accessories: Accessory[]; total: number }> {
    const perfTracker = queryPerformanceMonitor.startQuery("getAccessoriesWithCount");
    const cacheKey = `accessories:batch:${limit}:${offset}:${normalizeFilters(filters)}`;

    const cached = await unifiedCache.get<{
      accessories: Accessory[];
      total: number;
    }>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      logger.debug(`[AccessoryRepo] Cache HIT for getAccessoriesWithCount`);
      return cached;
    }

    // Execute both queries in parallel for NEON optimization
    const [accessoriesList, total] = await Promise.all([
      this.getAccessories(limit, offset, filters),
      this.getAccessoriesCount(filters),
    ]);

    const result = { accessories: accessoriesList, total };
    await unifiedCache.set(cacheKey, result, ACCESSORY_CACHE_TTL);

    perfTracker.setCacheHit(false).complete();
    return result;
  }

  /**
   * Create new accessory with cache invalidation
   */
  async createAccessory(accessory: InsertAccessory): Promise<Accessory> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createAccessory(accessory);
    }
    const [created] = await db.insert(accessories).values(accessory).returning();

    // Invalidate all paginated caches
    this.invalidateAccessoryCacheSelectively("create", created!.id).catch((error) =>
      logger.debug("Cache invalidation failed (non-critical):", error),
    );

    return created!;
  }

  /**
   * Update accessory with cache invalidation
   */
  async updateAccessory(
    id: number,
    accessory: Partial<InsertAccessory>,
  ): Promise<Accessory | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateAccessory(id, accessory);
    }
    const [updated] = await db
      .update(accessories)
      .set({ ...accessory, updatedAt: sql`NOW()` })
      .where(and(eq(accessories.id, id), isNull(accessories.deletedAt)))
      .returning();

    if (updated) {
      this.invalidateAccessoryCacheSelectively("update", updated.id).catch((error) =>
        logger.debug("Cache invalidation failed (non-critical):", error),
      );
    }

    return updated;
  }

  /**
   * Soft delete accessory with cache-first pattern
   */
  async deleteAccessory(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteAccessory(id);
    }
    // Cache-first delete: invalidate cache BEFORE DB operation
    try {
      await this.invalidateAccessoryCacheSelectively("delete", id);
      logger.info(`[AccessoryRepository] ✅ Cache invalidated for accessory ${id}`);
    } catch (cacheError) {
      logger.error(
        `[AccessoryRepository] ❌ Cache invalidation failed for accessory ${id}:`,
        cacheError,
      );
      throw new Error("Cache invalidation failed");
    }

    // Soft delete in database
    const result = await db
      .update(accessories)
      .set({
        deletedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(accessories.id, id), isNull(accessories.deletedAt)))
      .returning();

    if (!result.length) {
      logger.warn(`[AccessoryRepository] ⚠️ Accessory ${id} not found for deletion`);
      return false;
    }

    logger.info(`[AccessoryRepository] ✅ Cache-first delete succeeded for accessory ${id}`);
    return true;
  }

  async getAccessoriesIncludingDeleted(): Promise<Accessory[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAccessoriesIncludingDeleted();
    }
    return await db.select().from(accessories).orderBy(desc(accessories.createdAt));
  }

  async restoreAccessory(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().restoreAccessory(id);
    }
    const [updated] = await db
      .update(accessories)
      .set({ deletedAt: null })
      .where(eq(accessories.id, id))
      .returning();
    return !!updated;
  }

  async permanentlyDeleteAccessory(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().permanentlyDeleteAccessory(id);
    }
    const [deleted] = await db.delete(accessories).where(eq(accessories.id, id)).returning();
    return !!deleted;
  }

  /**
   * Smart cache invalidation for accessories
   * Invalidates both individual and paginated caches
   */
  private async invalidateAccessoryCacheSelectively(
    operation: "create" | "update" | "delete",
    accessoryId: number,
  ): Promise<void> {
    // Clear all accessory cache entries matching the actual cache key format
    await Promise.all([
      unifiedCache.clearPattern("accessories:"), // Matches cache keys: 'accessories:paginated:...'
      unifiedCache.clearPattern("accessory:"), // Matches individual accessory cache: 'accessory:${id}'

      // EVENT-DRIVEN: Emit invalidation event for frontend
      emitCacheInvalidation("accessories", operation),
    ]);

    logger.info(
      `[AccessoryRepository] Cache invalidated for ${operation} operation on accessory ${accessoryId}`,
    );
  }
}

// Export singleton instance
export const accessoryRepository = new AccessoryRepository();
