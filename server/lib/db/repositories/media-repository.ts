/**
 * MEDIA REPOSITORY
 * Handles media assets and folder operations with caching and performance monitoring
 *
 * ⚠️ MANDATORY CACHE KEY STANDARD: All paginated media queries MUST use the pattern:
 * - Cache Key: `media:paginated:${limit}:${offset}`
 * - Invalidation: Clear ALL keys matching `media:paginated:` prefix
 *
 * This aligns with frontend MediaQueryKeys.paginated() to ensure perfect cache synchronization.
 * NO ad-hoc cache keys allowed - prevents phantom/stale records and sync bugs.
 */

import type {
  Folder,
  InsertFolder,
  InsertMediaAsset,
  MediaAsset,
  MediaAssetSummary,
} from "@run-remix/shared";
import { folders, mediaAssets } from "@run-remix/shared";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../../../db.js";
import { emitCacheInvalidation } from "../../cache/cache-events.js";
import { UnifiedCache } from "../../cache/unified-cache.js";
import { CacheInvalidationError, MediaNotFoundError } from "../../errors/media-errors.js";
import { logger } from "../../monitoring/logger.js";
import { dbCircuitBreaker } from "../db-circuit-breaker.js";
import { queryPerformanceMonitor } from "../query-performance.js";

const unifiedCache = UnifiedCache.getInstance();
// PHASE 1 OPTIMIZATION: Use optimized media TTL from cache presets (6 hours)
// Media assets rarely change once uploaded - safe to cache longer
const MEDIA_CACHE_TTL = UnifiedCache.TTL_PRESETS.MEDIA; // 6 hours

// Column selections for media queries (optimized to reduce over-fetching)
// Used by grid/list views - includes display + filter/metadata fields

// Full columns for individual asset fetch (excludes dead columns: downloadCount, lastAccessedAt)
const MEDIA_DETAIL_COLUMNS = {
  id: mediaAssets.id,
  filename: mediaAssets.filename,
  originalName: mediaAssets.originalName,
  fileSize: mediaAssets.fileSize,
  size: mediaAssets.size,
  mimeType: mediaAssets.mimeType,
  type: mediaAssets.type,
  url: mediaAssets.url,
  thumbnailUrl: mediaAssets.thumbnailUrl,
  thumbnailFilename: mediaAssets.thumbnailFilename,
  thumbnailStoragePath: mediaAssets.thumbnailStoragePath,
  imageVariants: mediaAssets.imageVariants,
  storagePath: mediaAssets.storagePath,
  bucketName: mediaAssets.bucketName,
  folderId: mediaAssets.folderId,
  tags: mediaAssets.tags,
  altText: mediaAssets.altText,
  caption: mediaAssets.caption,
  metadata: mediaAssets.metadata,
  isActive: mediaAssets.isActive,
  deletedAt: mediaAssets.deletedAt,
  createdAt: mediaAssets.createdAt,
  updatedAt: mediaAssets.updatedAt,
  uploadedAt: mediaAssets.uploadedAt,
};

/**
 * PERFORMANCE FIX: Normalize filters for consistent cache keys
 * Sorts object keys alphabetically before serialization to prevent cache misses from key order differences
 */
function normalizeFilters(filters?: {
  type?: string | undefined;
  search?: string | undefined;
  folderId?: number;
}): string {
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

export class MediaRepository {
  // =============================================================================
  // MEDIA ASSET METHODS
  // =============================================================================

  async getMediaAsset(id: number): Promise<MediaAsset | undefined> {
    // PERFORMANCE: Cache individual media assets for 1 hour (static content)
    // This prevents N+1 queries in footer/certificate loading
    const cacheKey = `media:asset:${id}`;
    try {
      const cached = await unifiedCache.get<MediaAsset>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug(`[MediaRepo] Failed to get media asset ${id} from cache:`, error);
    }

    const [asset] = await dbCircuitBreaker.execute(
      async () =>
        await db
          .select(MEDIA_DETAIL_COLUMNS)
          .from(mediaAssets)
          .where(
            and(
              eq(mediaAssets.id, id),
              isNull(mediaAssets.deletedAt),
              eq(mediaAssets.isActive, true),
            ),
          ),
      "getMediaAsset",
    );

    if (asset) {
      try {
        await unifiedCache.set(cacheKey, asset, 60 * 60 * 1000, "data"); // 1 hour
      } catch (error) {
        logger.debug(`[MediaRepo] Failed to cache media asset ${id}:`, error);
      }
    }

    return asset;
  }

  async getMediaAssets(
    limit: number = 100,
    offset: number = 0,
    filters?: { type?: string | undefined; search?: string | undefined; folderId?: number },
  ): Promise<MediaAssetSummary[]> {
    const perfTracker = queryPerformanceMonitor.startQuery("getMediaAssets");

    // PERFORMANCE FIX: Use efficient Drizzle select() with database-level filtering
    // Indexes: media_hot_query_idx (deletedAt, isActive, createdAt), media_type_active_idx (type, isActive)
    // PERFORMANCE FIX: Normalized filters for consistent cache keys
    const cacheKey = `media:paginated:${limit}:${offset}:${normalizeFilters(filters)}`;
    logger.debug(`[MediaRepo] Attempting cache get with key: ${cacheKey}`);

    const cached = await unifiedCache.get<MediaAssetSummary[]>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      logger.info(
        `[MediaRepo] ✅ Cache HIT for getMediaAssets(${limit}, ${offset}, filters: ${normalizeFilters(filters)})`,
      );
      return cached;
    }

    logger.debug(`[MediaRepo] Cache MISS for key: ${cacheKey} - executing database query`);

    const result = await dbCircuitBreaker.execute(async () => {
      const conditions = [isNull(mediaAssets.deletedAt), eq(mediaAssets.isActive, true)];

      // Add database-level filters for optimal index usage
      if (filters?.type) {
        conditions.push(eq(mediaAssets.type, filters.type));
      }
      if (filters?.folderId !== undefined) {
        conditions.push(eq(mediaAssets.folderId, filters.folderId));
      }

      // PERFORMANCE: Database-level ILIKE search on indexed columns (filename, originalName, altText)
      // Leverages PostgreSQL's case-insensitive pattern matching with index support
      if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(mediaAssets.filename, searchPattern),
            ilike(mediaAssets.originalName, searchPattern),
            ilike(mediaAssets.altText, searchPattern),
          )!,
        );
      }

      // PHASE 5: PERFORMANCE OPTIMIZATION - Select only necessary columns (reduces transfer size by ~36%)
      // Uses MEDIA_DETAIL_COLUMNS (16 fields) instead of full schema (25 fields)
      // Excludes: thumbnailFilename, imageVariants, storagePath, bucketName, deletedAt, updatedAt, uploadedAt (9 fields)
      return await db
        .select(MEDIA_DETAIL_COLUMNS)
        .from(mediaAssets)
        .where(and(...conditions))
        .orderBy(desc(mediaAssets.createdAt))
        .limit(limit)
        .offset(offset);
    }, "getMediaAssets");

    // Cache for 8 minutes
    await unifiedCache.set(cacheKey, result, MEDIA_CACHE_TTL);
    logger.info(
      `[MediaRepo] ✅ Cached getMediaAssets result with key: ${cacheKey} (TTL: ${MEDIA_CACHE_TTL}ms, ${result.length} items)`,
    );

    logger.debug(
      `[MediaRepo] getMediaAssets(${limit}, ${offset}) returned ${result.length} items. First 3 IDs: ${result
        .slice(0, 3)
        .map((r) => r.id)
        .join(", ")}`,
    );

    perfTracker.setCacheHit(false).complete();
    return result as unknown as MediaAssetSummary[];
  }

  async createMediaAsset(mediaAsset: InsertMediaAsset): Promise<MediaAsset> {
    const [created] = await db.insert(mediaAssets).values(mediaAsset).returning();

    this.invalidateMediaCacheSelectively("create", created!.id).catch((error) =>
      logger.debug("Smart cache invalidation failed (non-critical):", error),
    );

    return created!;
  }

  async updateMediaAsset(
    id: number,
    mediaAsset: Partial<InsertMediaAsset>,
  ): Promise<MediaAsset | undefined> {
    const [updated] = await db
      .update(mediaAssets)
      .set({ ...mediaAsset, updatedAt: sql`NOW()` })
      .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
      .returning();

    if (updated) {
      this.invalidateMediaCacheSelectively("update", updated.id).catch((error) =>
        logger.debug("Smart cache invalidation failed (non-critical):", error),
      );
    }

    return updated;
  }

  async deleteMediaAsset(id: number): Promise<boolean> {
    // CACHE-FIRST DELETE PATTERN (neon-http doesn't support transactions)
    // Pattern: Invalidate cache BEFORE DB delete to prevent stale cache responses
    // This ensures frontend never fetches stale data, even if DB delete fails

    // Step 1: BLOCKING cache invalidation (must succeed before DB operation)
    try {
      await this.invalidateMediaCacheSelectively("delete", id);
      logger.info(
        `[MediaRepository] ✅ Cache invalidated for asset ${id}, proceeding with DB delete`,
      );
    } catch (cacheError) {
      // Cache invalidation failed - throw error to prevent DB delete
      logger.error(
        `[MediaRepository] ❌ Cache invalidation failed for asset ${id}, aborting delete:`,
        cacheError,
      );
      throw new CacheInvalidationError(
        "delete",
        cacheError instanceof Error ? cacheError : undefined,
      );
    }

    // Step 2: Clean up product references inline (remove deleted media from imageIds/certificateIds arrays)
    try {
      // Clean up products.imageIds arrays - remove deleted media ID
      await db.execute(sql`
        UPDATE products 
        SET image_ids = (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(COALESCE(image_ids, '[]'::jsonb)) elem
          WHERE (elem::text)::int != ${id}
        ),
        updated_at = NOW()
        WHERE image_ids @> ${JSON.stringify([id])}::jsonb
          AND deleted_at IS NULL
      `);

      // Clean up products.certificateIds arrays - remove deleted media ID
      await db.execute(sql`
        UPDATE products 
        SET certificate_ids = (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(COALESCE(certificate_ids, '[]'::jsonb)) elem
          WHERE (elem::text)::int != ${id}
        ),
        updated_at = NOW()
        WHERE certificate_ids @> ${JSON.stringify([id])}::jsonb
          AND deleted_at IS NULL
      `);

      logger.info(`[MediaRepository] ✅ Cleaned up product array references for media ${id}`);
    } catch (cleanupError) {
      logger.warn(
        `[MediaRepository] ⚠️ Product reference cleanup failed for media ${id} (non-critical):`,
        cleanupError,
      );
    }

    // Step 3: Soft delete in database (cache already cleared, references cleaned)
    const result = await db
      .update(mediaAssets)
      .set({
        deletedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
      .returning();

    // If asset not found or already deleted, throw typed error
    if (!result.length) {
      logger.warn(`[MediaRepository] ⚠️ Asset ${id} not found for deletion (cache already cleared)`);
      throw new MediaNotFoundError(id);
    }

    logger.info(`[MediaRepository] ✅ Cache-first delete succeeded for asset ${id}`);
    return true;
  }

  async getMediaAssetsCount(filters?: {
    type?: string | undefined;
    search?: string | undefined;
    folderId?: number | undefined;
  }): Promise<number> {
    const conditions = [isNull(mediaAssets.deletedAt), eq(mediaAssets.isActive, true)];

    if (filters?.type) {
      conditions.push(eq(mediaAssets.type, filters.type));
    }
    if (filters?.folderId !== undefined) {
      conditions.push(eq(mediaAssets.folderId, filters.folderId));
    }

    // CRITICAL: Apply search filter at SQL level (same as getMediaAssets)
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(mediaAssets.filename, searchPattern),
          ilike(mediaAssets.originalName, searchPattern),
          ilike(mediaAssets.altText, searchPattern),
        )!,
      );
    }

    // Use efficient DB COUNT with all filters applied
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaAssets)
      .where(and(...conditions));

    return Number(result[0]?.count || 0);
  }

  /**
   * NEON SERVERLESS OPTIMIZATION: Batch query helper
   * Executes count + select queries in parallel to minimize NEON active compute time
   * Cache TTL aligned with NEON's 5-minute auto-suspend behavior
   *
   * NOTE: neon-http driver is stateless and doesn't support transactions.
   * Using Promise.all for parallel execution instead of db.transaction().
   */
  async getMediaAssetsWithCount(
    limit: number = 100,
    offset: number = 0,
    filters?: { type?: string | undefined; search?: string | undefined; folderId?: number },
  ): Promise<{ assets: MediaAssetSummary[]; total: number }> {
    const perfTracker = queryPerformanceMonitor.startQuery("getMediaAssetsWithCount");
    // PERFORMANCE FIX: Normalized filters for consistent cache keys
    const cacheKey = `media:batch:${limit}:${offset}:${normalizeFilters(filters)}`;

    // Check cache first
    const cached = await unifiedCache.get<{
      assets: MediaAssetSummary[];
      total: number;
    }>(cacheKey);
    if (cached) {
      perfTracker.setCacheHit(true).complete();
      logger.debug(`[MediaRepo] Cache HIT for getMediaAssetsWithCount(${limit}, ${offset})`);
      return cached;
    }

    // NEON OPTIMIZATION: Execute both queries in parallel (no transaction support in neon-http)
    // Minimizes active time and reduces billable compute
    const result = await dbCircuitBreaker.execute(async () => {
      const conditions = [isNull(mediaAssets.deletedAt), eq(mediaAssets.isActive, true)];

      // Add filters
      if (filters?.type) {
        conditions.push(eq(mediaAssets.type, filters.type));
      }
      if (filters?.folderId !== undefined) {
        conditions.push(eq(mediaAssets.folderId, filters.folderId));
      }
      if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(mediaAssets.filename, searchPattern),
            ilike(mediaAssets.originalName, searchPattern),
            ilike(mediaAssets.altText, searchPattern),
          )!,
        );
      }

      // Execute both queries in parallel (stateless HTTP driver)
      const [assets, countResult] = await Promise.all([
        db
          .select(MEDIA_DETAIL_COLUMNS)
          .from(mediaAssets)
          .where(and(...conditions))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(mediaAssets.createdAt)),

        db
          .select({ count: sql<number>`count(*)` })
          .from(mediaAssets)
          .where(and(...conditions)),
      ]);

      return {
        assets,
        total: Number(countResult[0]?.count || 0),
      };
    }, "getMediaAssetsWithCount");

    // Cache for 10 min (NEON auto-suspends after 5 min idle)
    // Keep TTL above suspend threshold to avoid cold starts
    const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
    await unifiedCache.set(cacheKey, result, CACHE_TTL_MS);

    logger.debug(
      `[MediaRepo] getMediaAssetsWithCount(${limit}, ${offset}) returned ${result.assets.length} assets, total: ${result.total}`,
    );

    perfTracker.setCacheHit(false).complete();
    return result as unknown as { assets: MediaAssetSummary[]; total: number };
  }

  async getMediaAssetsByFolder(folderId: number | null): Promise<MediaAssetSummary[]> {
    const folderCondition = folderId
      ? eq(mediaAssets.folderId, folderId)
      : isNull(mediaAssets.folderId);
    const result = await db
      .select(MEDIA_DETAIL_COLUMNS)
      .from(mediaAssets)
      .where(and(folderCondition, isNull(mediaAssets.deletedAt), eq(mediaAssets.isActive, true)))
      .orderBy(desc(mediaAssets.createdAt));

    return result as unknown as MediaAssetSummary[];
  }

  async moveMediaAsset(id: number, targetFolderId: number | null): Promise<MediaAsset | undefined> {
    const [moved] = await db
      .update(mediaAssets)
      .set({ folderId: targetFolderId, updatedAt: sql`NOW()` })
      .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
      .returning();
    return moved;
  }

  async updateMediaAssetsFolder(ids: number[], folderId: number | null): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const result = await db
      .update(mediaAssets)
      .set({ folderId, updatedAt: sql`NOW()` })
      .where(and(sql`${mediaAssets.id} = ANY(${ids})`, isNull(mediaAssets.deletedAt)));

    this.invalidateMediaCacheSelectively("update", ids[0]!).catch((error) =>
      logger.debug("Batch cache invalidation failed (non-critical):", error),
    );

    return result.rowCount ?? 0;
  }

  async updateMediaAssetsTags(updates: Array<{ id: number; tags: string[] }>): Promise<number> {
    if (updates.length === 0) {
      return 0;
    }

    let updatedCount = 0;

    const results = await Promise.allSettled(
      updates.map(({ id, tags }) =>
        db
          .update(mediaAssets)
          .set({ tags, updatedAt: sql`NOW()` })
          .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt))),
      ),
    );

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.rowCount) {
        updatedCount += result.value.rowCount;
      }
    });

    if (updatedCount > 0) {
      this.invalidateMediaCacheSelectively("update", updates[0]!.id).catch((error) =>
        logger.debug("Batch cache invalidation failed (non-critical):", error),
      );
    }

    return updatedCount;
  }

  async getMediaAssetsByIds(ids: string[]): Promise<MediaAsset[]> {
    const perfTracker = queryPerformanceMonitor.startQuery("getMediaAssetsByIds");

    const numericIds = ids.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));

    if (numericIds.length === 0) {
      perfTracker.setCacheHit(false).complete();
      return [];
    }

    const sortedIds = [...numericIds].sort((a, b) => a - b);
    const cacheKey = `media:batch:ids:${sortedIds.join(",")}`;

    try {
      const cached = await unifiedCache.get<MediaAsset[]>(cacheKey, "data");
      if (cached) {
        perfTracker.setCacheHit(true).complete();
        logger.debug(`[MediaRepo] ✅ Cache HIT for getMediaAssetsByIds (${numericIds.length} IDs)`);
        return cached;
      }
    } catch (error) {
      logger.debug(`[MediaRepo] Failed to get batch media assets from cache:`, error);
    }

    const result = await dbCircuitBreaker.execute(
      async () =>
        await db
          .select(MEDIA_DETAIL_COLUMNS)
          .from(mediaAssets)
          .where(
            and(
              inArray(mediaAssets.id, numericIds),
              isNull(mediaAssets.deletedAt),
              eq(mediaAssets.isActive, true),
            ),
          )
          .orderBy(desc(mediaAssets.createdAt)),
      "getMediaAssetsByIds",
    );

    if (result.length > 0) {
      try {
        await unifiedCache.set(cacheKey, result, MEDIA_CACHE_TTL, "data");
        logger.debug(
          `[MediaRepo] ✅ Cached getMediaAssetsByIds result (${result.length} assets, TTL: ${MEDIA_CACHE_TTL}ms)`,
        );
      } catch (error) {
        logger.debug(`[MediaRepo] Failed to cache batch media assets:`, error);
      }
    }

    perfTracker.setCacheHit(false).complete();
    return result as any;
  }

  async getMediaAssetsIncludingDeleted(
    limit: number = 100,
    offset: number = 0,
  ): Promise<MediaAsset[]> {
    return await db
      .select(MEDIA_DETAIL_COLUMNS)
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAssetsNeedingThumbnails(): Promise<MediaAsset[]> {
    logger.info("🔍 Querying assets needing thumbnail generation...");

    return await db
      .select(MEDIA_DETAIL_COLUMNS)
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.type, "image"),
          isNull(mediaAssets.thumbnailFilename),
          sql`${mediaAssets.mimeType} != 'image/svg+xml'`,
        ),
      )
      .orderBy(mediaAssets.id);
  }

  // =============================================================================
  // FOLDER METHODS
  // =============================================================================

  async getFolders(): Promise<Folder[]> {
    return await db
      .select()
      .from(folders)
      .where(isNull(folders.deletedAt))
      .orderBy(asc(folders.name));
  }

  async getFolder(id: number): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)));
    return folder;
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [created] = await db.insert(folders).values(folder).returning();
    return created!;
  }

  async updateFolder(id: number, folder: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [updated] = await db
      .update(folders)
      .set({ ...folder, updatedAt: sql`NOW()` })
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)))
      .returning();
    return updated;
  }

  async deleteFolder(id: number): Promise<boolean> {
    const result = await db
      .update(folders)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(folders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getFoldersByParent(parentId: number | null): Promise<Folder[]> {
    const parentCondition = parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId);
    return await db
      .select()
      .from(folders)
      .where(and(parentCondition, isNull(folders.deletedAt)))
      .orderBy(asc(folders.name));
  }

  async getFolderPath(folderId: number): Promise<string> {
    const folder = await this.getFolder(folderId);
    return folder?.name || "";
  }

  async getFolderChildren(folderId: number): Promise<Folder[]> {
    return await db
      .select()
      .from(folders)
      .where(and(eq(folders.parentId, folderId), isNull(folders.deletedAt)))
      .orderBy(asc(folders.name));
  }

  // =============================================================================
  // CACHE INVALIDATION - PRIVATE
  // =============================================================================

  private async invalidateMediaCacheSelectively(
    operation: "create" | "update" | "delete",
    mediaId: number,
  ): Promise<void> {
    // PERFORMANCE FIX: Selective invalidation - clear affected cache patterns AND individual asset
    // Instead of nuking ALL media cache, only clear paginated/batch queries that would include the changed item
    // PLUS the individual asset cache for update/delete operations

    const selectivePatterns = [
      "media:paginated:", // Clear paginated queries (they might include this asset)
      "media:batch:", // Clear batch queries (getMediaAssetsWithCount)
    ];

    // Selective clear: invalidate list queries
    await Promise.all(selectivePatterns.map((pattern) => unifiedCache.clearPattern(pattern)));

    // CRITICAL: Also clear individual asset cache for update/delete to prevent stale data
    // This fixes the footer N+1 query problem where individual assets are cached
    // MUST use 'data' namespace to match how the cache was set in getMediaAsset()
    if (operation === "update" || operation === "delete") {
      try {
        await unifiedCache.delete(`media:asset:${mediaId}`, "data");
        logger.debug(
          `[MediaRepo] Cleared individual asset cache for media ${mediaId} (data namespace)`,
        );
      } catch (error) {
        logger.debug(`[MediaRepo] Failed to clear asset cache for ${mediaId}:`, error);
      }
    }

    // EVENT-DRIVEN: Emit invalidation event for frontend (lightweight notification)
    await emitCacheInvalidation("media:", operation);

    // Preload cache for create/update operations (non-blocking, best-effort)
    // This populates cache with fresh data immediately after invalidation
    if (operation === "create" || operation === "update") {
      this.preloadFirstPageCache().catch((err) =>
        logger.debug("Preemptive cache warming failed (non-critical):", err),
      );
    }

    logger.info(
      `[MediaRepository] ⚡ Selective cache invalidation completed for ${operation} operation (including asset ${mediaId})`,
    );
  }

  private async preloadFirstPageCache(): Promise<void> {
    try {
      Promise.allSettled([
        this.getMediaAssets().catch((err) => logger.debug("Cache preload failed:", err)),
      ]);
    } catch (_error) {
      // Silent failure for preloading
    }
  }
}

// Singleton instance for direct import usage
export const mediaRepository = new MediaRepository();
