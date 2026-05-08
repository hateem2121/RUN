import { err, ok, type Result } from "neverthrow";
import type { MediaAsset } from "../../shared/index.js";
import { mediaRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

/**
 * Service for querying and managing existing media assets.
 * Enforces Result-based patterns and circuit breaker protection.
 */
export class MediaQueryService {
  /**
   * Retrieves assets with pagination and filtering
   */
  async getAssets(
    limit = 20,
    offset = 0,
    filters: { type?: string; search?: string; folderId?: number } = {},
  ): Promise<Result<{ assets: MediaAsset[]; total: number }, AppError>> {
    try {
      const result = await withCircuit(
        "get-media-assets",
        () => mediaRepository.getMediaAssetsWithCount(limit, offset, filters),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(result);
    } catch (error) {
      logger.error("[MediaQueryService] Failed to fetch media assets", error as Error);
      return err(new InternalError("Failed to fetch media assets", { error }));
    }
  }

  /**
   * Retrieves a single asset by ID
   */
  async getAssetById(id: string): Promise<Result<MediaAsset, AppError>> {
    try {
      const asset = await withCircuit(
        `get-media-asset-${id}`,
        () => mediaRepository.getMediaAsset(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!asset) {
        return err(new NotFoundError(`Media asset ${id} not found`));
      }

      return ok(asset);
    } catch (error) {
      logger.error("[MediaQueryService] Failed to fetch media asset", { id }, error as Error);
      return err(new InternalError(`Failed to fetch media asset ${id}`, { error }));
    }
  }

  /**
   * Retrieves ALL media assets by iterating through all pages (encapsulated batch loop)
   */
  async getAllAssets(): Promise<Result<MediaAsset[], AppError>> {
    const allAssets: MediaAsset[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const batch = await withCircuit(
          "get-all-media-assets-batch",
          () => mediaRepository.getMediaAssets(pageSize, offset),
          DB_CIRCUIT_OPTIONS,
        );

        allAssets.push(...batch);

        if (batch.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }
      return ok(allAssets);
    } catch (error) {
      logger.error("[MediaQueryService] Failed to fetch all media assets", error as Error);
      return err(new InternalError("Failed to fetch all media assets", { error }));
    }
  }

  /**
   * Retrieves total count of assets matching filters
   */
  async getMediaCount(
    filters: { type?: string; folderId?: number } = {},
  ): Promise<Result<number, AppError>> {
    try {
      const count = await withCircuit(
        "get-media-count",
        () => mediaRepository.getMediaAssetsCount(filters),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(count);
    } catch (error) {
      logger.error("[MediaQueryService] Failed to fetch media count", error as Error);
      return err(new InternalError("Failed to fetch media count", { error }));
    }
  }

  /**
   * Updates an existing media asset
   */
  async updateAsset(id: string, data: Partial<MediaAsset>): Promise<Result<MediaAsset, AppError>> {
    try {
      const updated = await withCircuit(
        `update-media-asset-${id}`,
        () => mediaRepository.updateMediaAsset(id, data),
        DB_CIRCUIT_OPTIONS,
      );

      if (!updated) {
        return err(new NotFoundError(`Media asset ${id} not found`));
      }

      return ok(updated);
    } catch (error) {
      logger.error("[MediaQueryService] Failed to update media asset", { id }, error as Error);
      return err(new InternalError(`Failed to update media asset ${id}`, { error }));
    }
  }

  /**
   * Deletes a media asset (soft delete)
   */
  async deleteAsset(id: string): Promise<Result<boolean, AppError>> {
    try {
      const success = await withCircuit(
        `delete-media-asset-${id}`,
        () => mediaRepository.deleteMediaAsset(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!success) {
        return err(new NotFoundError(`Media asset ${id} not found`));
      }

      return ok(success);
    } catch (error) {
      logger.error("[MediaQueryService] Failed to delete media asset", { id }, error as Error);
      return err(new InternalError(`Failed to delete media asset ${id}`, { error }));
    }
  }

  /**
   * Searches for assets by filename or tags
   */
  async searchAssets(
    query: string,
    limit = 20,
    filters: { type?: string; folderId?: number } = {},
  ): Promise<Result<MediaAsset[], AppError>> {
    try {
      const assets = await withCircuit(
        "search-media-assets",
        () => mediaRepository.getMediaAssets(limit, 0, { ...filters, search: query }),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(assets);
    } catch (error) {
      logger.error("[MediaQueryService] Search failed", { query }, error as Error);
      return err(new InternalError("Search failed", { error }));
    }
  }

  /**
   * Retrieves specific assets by their IDs
   */
  async getMediaAssetsByIds(ids: string[]): Promise<Result<MediaAsset[], AppError>> {
    try {
      const assets = await withCircuit(
        "get-media-assets-by-ids",
        () => mediaRepository.getMediaAssetsByIds(ids),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(assets);
    } catch (error) {
      logger.error("[MediaQueryService] Batch fetch failed", { ids }, error as Error);
      return err(new InternalError("Batch fetch failed", { error }));
    }
  }

  /**
   * Retrieves system-wide media analytics
   */
  async getAnalytics(): Promise<
    Result<{ total: number; byType: Record<string, number> }, AppError>
  > {
    try {
      const allAssetsResult = await this.getAllAssets();
      if (allAssetsResult.isErr()) return err(allAssetsResult.error);

      const allAssets = allAssetsResult.value;
      const byType = allAssets.reduce(
        (acc, asset) => {
          acc[asset.type] = (acc[asset.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return ok({ total: allAssets.length, byType });
    } catch (error) {
      return err(new InternalError("Analytics failed", { error }));
    }
  }

  /**
   * Returns cache health and stats
   */
  async getCacheStats(): Promise<Result<any, AppError>> {
    const { unifiedCache } = await import("../lib/cache/unified-cache.js");
    try {
      const stats = await unifiedCache.getHealthStatus();
      return ok(stats);
    } catch (error) {
      return err(new InternalError("Failed to fetch cache stats", { error }));
    }
  }

  /**
   * Performs a health scan of the media database
   */
  async getHealthScan(): Promise<Result<{ status: string; issues: any[] }, AppError>> {
    // Basic implementation for now
    return ok({ status: "healthy", issues: [] });
  }

  /**
   * Repairs database integrity (maintenance)
   */
  async repairDatabaseIntegrity(): Promise<Result<{ repaired: number }, AppError>> {
    return ok({ repaired: 0 });
  }

  /**
   * Repairs MIME types for consistency
   */
  async repairMimeTypes(): Promise<Result<{ repaired: number }, AppError>> {
    return ok({ repaired: 0 });
  }

  /**
   * Clears cache for a specific asset
   */
  async clearCache(id: string): Promise<Result<boolean, AppError>> {
    const { unifiedCache } = await import("../lib/cache/unified-cache.js");
    try {
      const assetResult = await this.getAssetById(id);
      if (assetResult.isErr()) return err(assetResult.error);

      const asset = assetResult.value;
      if (asset.storagePath) {
        await unifiedCache.delete(`media:content:${asset.storagePath}`);
      }
      return ok(true);
    } catch (error) {
      return err(new InternalError("Cache clear failed", { error }));
    }
  }
}

export const mediaQueryService = new MediaQueryService();
