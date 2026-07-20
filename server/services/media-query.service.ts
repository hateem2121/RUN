import type { MediaAsset } from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { correctMimeType } from "../lib/utilities/core-utils.js";
import { mediaRepository } from "./repositories/index.js";

/**
 * Service for querying and managing existing media assets.
 * Enforces Result-based patterns and circuit breaker protection.
 */
class MediaQueryService {
  /**
   * Retrieves assets with pagination and filtering
   */
  async getAssets(
    limit = 20,
    offset = 0,
    filters: {
      type?: string | undefined;
      search?: string | undefined;
      folderId?: number | undefined;
    } = {},
  ): Promise<Result<{ assets: MediaAsset[]; total: number }, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<{ assets: MediaAsset[]; total: number }, AppError>> => {
        const result = await withCircuit(
          "get-media-assets",
          () => mediaRepository.getMediaAssetsWithCount(limit, offset, filters),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(result);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Failed to fetch media assets", error as Error);
        return err(new InternalError("Failed to fetch media assets", { error }));
      }),
    );
  }

  /**
   * Retrieves a single asset by ID
   */
  async getAssetById(id: number): Promise<Result<MediaAsset, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<MediaAsset, AppError>> => {
        const asset = await withCircuit(
          `get-media-asset-${id}`,
          () => mediaRepository.getMediaAsset(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!asset) {
          return err(new NotFoundError(`Media asset ${id} not found`));
        }

        return ok(asset);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Failed to fetch media asset", { id }, error as Error);
        return err(new InternalError(`Failed to fetch media asset ${id}`, { error }));
      }),
    );
  }

  /**
   * Retrieves ALL media assets by iterating through all pages (encapsulated batch loop)
   */
  async getAllAssets(): Promise<Result<MediaAsset[], AppError>> {
    const allAssets: MediaAsset[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    return new ResultAsync(
      (async (): Promise<Result<MediaAsset[], AppError>> => {
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
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Failed to fetch all media assets", error as Error);
        return err(new InternalError("Failed to fetch all media assets", { error }));
      }),
    );
  }

  /**
   * Retrieves total count of assets matching filters
   */
  async getMediaCount(
    filters: { type?: string | undefined; folderId?: number | undefined } = {},
  ): Promise<Result<number, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<number, AppError>> => {
        const count = await withCircuit(
          "get-media-count",
          () => mediaRepository.getMediaAssetsCount(filters),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(count);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Failed to fetch media count", error as Error);
        return err(new InternalError("Failed to fetch media count", { error }));
      }),
    );
  }

  /**
   * Updates an existing media asset
   */
  async updateAsset(id: number, data: Partial<MediaAsset>): Promise<Result<MediaAsset, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<MediaAsset, AppError>> => {
        const updated = await withCircuit(
          `update-media-asset-${id}`,
          () => mediaRepository.updateMediaAsset(id, data),
          DB_CIRCUIT_OPTIONS,
        );

        if (!updated) {
          return err(new NotFoundError(`Media asset ${id} not found`));
        }

        return ok(updated);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Failed to update media asset", { id }, error as Error);
        return err(new InternalError(`Failed to update media asset ${id}`, { error }));
      }),
    );
  }

  /**
   * Deletes a media asset (soft delete)
   */
  async deleteAsset(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const success = await withCircuit(
          `delete-media-asset-${id}`,
          () => mediaRepository.deleteMediaAsset(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!success) {
          return err(new NotFoundError(`Media asset ${id} not found`));
        }

        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (success.isErr()) return err(success.error as any);
        return ok(success.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Failed to delete media asset", { id }, error as Error);
        return err(new InternalError(`Failed to delete media asset ${id}`, { error }));
      }),
    );
  }

  /**
   * Searches for assets by filename or tags
   */
  async searchAssets(
    query: string,
    limit = 20,
    filters: { type?: string | undefined; folderId?: number | undefined } = {},
  ): Promise<Result<MediaAsset[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<MediaAsset[], AppError>> => {
        const assets = await withCircuit(
          "search-media-assets",
          () => mediaRepository.getMediaAssets(limit, 0, { ...filters, search: query }),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(assets);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Search failed", { query }, error as Error);
        return err(new InternalError("Search failed", { error }));
      }),
    );
  }

  /**
   * Retrieves specific assets by their IDs
   */
  async getMediaAssetsByIds(ids: string[]): Promise<Result<MediaAsset[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<MediaAsset[], AppError>> => {
        const assets = await withCircuit(
          "get-media-assets-by-ids",
          () => mediaRepository.getMediaAssetsByIds(ids),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(assets);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[MediaQueryService] Batch fetch failed", { ids }, error as Error);
        return err(new InternalError("Batch fetch failed", { error }));
      }),
    );
  }

  /**
   * Retrieves system-wide media analytics
   */
  async getAnalytics(): Promise<
    Result<{ total: number; byType: Record<string, number> }, AppError>
  > {
    return new ResultAsync(
      (async (): Promise<Result<{ total: number; byType: Record<string, number> }, AppError>> => {
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
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Analytics failed", { error }));
      }),
    );
  }

  /**
   * Returns cache health and stats
   */
  async getCacheStats(): Promise<Result<Record<string, unknown>, AppError>> {
    const { unifiedCache } = await import("../lib/cache/unified-cache.js");
    return new ResultAsync(
      (async (): Promise<Result<Record<string, unknown>, AppError>> => {
        const stats = await unifiedCache.getHealthStatus();
        return ok(stats);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Failed to fetch cache stats", { error }));
      }),
    );
  }

  /**
   * Performs a health scan of the media database
   */
  async getHealthScan(): Promise<Result<{ status: string; issues: unknown[] }, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<{ status: string; issues: unknown[] }, AppError>> => {
        const allAssetsResult = await this.getAllAssets();
        if (allAssetsResult.isErr()) return err(allAssetsResult.error);

        const issues: unknown[] = [];
        const { appStorageService } = await import("../lib/storage/app-service.js");

        // Check first 50 assets to keep scan time reasonable for now
        const assetsToCheck = allAssetsResult.value.slice(0, 50);

        for (const asset of assetsToCheck) {
          if (asset.storagePath) {
            const exists = await appStorageService.assetExists(asset.storagePath);
            if (!exists) {
              issues.push({ id: asset.id, issue: "missing_file", path: asset.storagePath });
            }
          }
        }

        return ok({
          status: issues.length > 0 ? "needs_attention" : "healthy",
          issues,
        });
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Health scan failed", { error }));
      }),
    );
  }

  /**
   * Repairs database integrity (maintenance)
   */
  async repairDatabaseIntegrity(): Promise<Result<{ repaired: number }, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<{ repaired: number }, AppError>> => {
        const scanResult = await this.getHealthScan();
        if (scanResult.isErr()) return err(scanResult.error);

        let repaired = 0;
        for (const issue of scanResult.value.issues as { id: number; issue: string }[]) {
          if (issue.issue === "missing_file") {
            // Deactivate records with missing files
            await mediaRepository.updateMediaAsset(issue.id, { isActive: false });
            repaired++;
          }
        }
        return ok({ repaired });
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Repair failed", { error }));
      }),
    );
  }

  /**
   * Repairs MIME types for consistency
   */
  async repairMimeTypes(): Promise<Result<{ repaired: number }, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<{ repaired: number }, AppError>> => {
        const assets = await mediaRepository.getMediaAssets(1000, 0);
        let repaired = 0;

        for (const asset of assets) {
          if (
            asset.filename &&
            (asset.mimeType === "application/octet-stream" || !asset.mimeType)
          ) {
            const correctedMime = correctMimeType(
              asset.filename,
              asset.mimeType || "application/octet-stream",
            );
            if (correctedMime !== asset.mimeType) {
              await mediaRepository.updateMediaAsset(asset.id, { mimeType: correctedMime });
              repaired++;
            }
          }
        }
        return ok({ repaired });
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("MIME repair failed", { error }));
      }),
    );
  }

  /**
   * Clears cache for a specific asset
   */
  async clearCache(id: number): Promise<Result<boolean, AppError>> {
    const { unifiedCache } = await import("../lib/cache/unified-cache.js");
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const assetResult = await this.getAssetById(id);
        if (assetResult.isErr()) return err(assetResult.error);

        const asset = assetResult.value;
        if (asset.storagePath) {
          await unifiedCache.delete(`media:content:${asset.storagePath}`);
        }
        return ok(true);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        return err(new InternalError("Cache clear failed", { error }));
      }),
    );
  }
}

export const mediaQueryService = new MediaQueryService();
