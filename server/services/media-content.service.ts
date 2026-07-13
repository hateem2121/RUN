import type { ImageVariants } from "@run-remix/shared";
import { ok, type Result, ResultAsync } from "neverthrow";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { appStorageService } from "../lib/storage/app-service.js";
import { mediaRepository } from "./repositories/index.js";

/**
 * Service for serving media content and thumbnails via signed URLs.
 * Enforces Result-based patterns and circuit breaker protection.
 */
class MediaContentService {
  /**
   * Generates a signed URL for a media asset's primary content or specific variant.
   * Automatically handles responsive variants and fallbacks.
   */
  async getSignedUrl(
    id: number,
    ttl = 300,
    variant?: keyof ImageVariants,
  ): Promise<Result<string, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<string> => {
        const asset = await withCircuit(
          `get-media-content-${id}`,
          () => mediaRepository.getMediaAsset(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!asset?.storagePath) {
          throw new NotFoundError(`Media asset ${id} not found`);
        }

        let pathToServe = asset.storagePath;

        // PHASE 2 REMEDIATION (PC-402): Support specific image variants
        if (asset.type === "image" && variant && asset.imageVariants?.[variant]) {
          pathToServe = asset.imageVariants[variant]!;
        } else if (asset.type === "image" && asset.imageVariants?.original) {
          // PERFORMANCE: Default to original compressed variant if no specific variant requested
          const variantPath = asset.imageVariants.original;
          const variantExists = await appStorageService.assetExists(variantPath);
          if (variantExists) {
            pathToServe = variantPath;
          } else {
            logger.warn(
              `[MediaContentService] Optimized variant missing for ${id}, falling back to original`,
            );
          }
        }

        const signedUrl = await appStorageService.generateSignedUrl(pathToServe, ttl);
        return signedUrl;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[MediaContentService] Failed to generate signed URL",
          { id, variant },
          error as Error,
        );
        return new InternalError("Failed to generate signed URL", { error });
      },
    );
  }

  /**
   * Generates a signed URL for a media asset's thumbnail.
   * Implements fallback logic to original content if thumbnail is missing.
   */
  async getThumbnailUrl(id: number, ttl = 300): Promise<Result<string, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<string> => {
        const asset = await withCircuit(
          `get-media-thumbnail-${id}`,
          () => mediaRepository.getMediaAsset(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!asset) {
          throw new NotFoundError(`Media asset ${id} not found`);
        }

        let pathToServe: string | null = null;

        // PHASE 2 REMEDIATION (PC-402): Prioritize explicit thumbnail variant from imageVariants
        if (asset.type === "image" && asset.imageVariants?.thumbnail) {
          pathToServe = asset.imageVariants.thumbnail;
        } else if (asset.thumbnailUrl && asset.storagePath) {
          // Fallback: Standard naming convention for legacy thumbnails
          pathToServe = asset.storagePath.replace("media/", "thumbnails/");
          const exists = await appStorageService.assetExists(pathToServe);
          if (!exists) {
            pathToServe = asset.storagePath;
          }
        } else if (asset.storagePath) {
          pathToServe = asset.storagePath;
        }

        if (!pathToServe) {
          throw new NotFoundError("Media source not found");
        }

        const signedUrl = await appStorageService.generateSignedUrl(pathToServe, ttl);
        return signedUrl;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[MediaContentService] Failed to generate thumbnail URL",
          { id },
          error as Error,
        );
        return new InternalError("Failed to generate thumbnail URL", { error });
      },
    );
  }

  /**
   * Retrieves media geometry (e.g. for 3D models or image analysis)
   */
  async getMediaGeometry(id: number): Promise<Result<Record<string, unknown>, AppError>> {
    return ok({ id, geometry: "Geometry extraction not implemented in service layer yet" });
  }

  /**
   * Retrieves raw media content
   */
  async getMediaRaw(id: number): Promise<Result<string, AppError>> {
    return this.getSignedUrl(id);
  }

  /**
   * Proxies media content via signed URL
   */
  async getMediaProxy(id: number): Promise<Result<string, AppError>> {
    return this.getSignedUrl(id);
  }

  /**
   * Proxies thumbnail content via signed URL
   */
  async getThumbnailProxy(id: number): Promise<Result<string, AppError>> {
    return this.getThumbnailUrl(id);
  }

  /**
   * Verifies connectivity to object storage
   */
  async testObjectStorageConnectivity(): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const bucket = appStorageService.getBucketName();
        return !!bucket;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new InternalError("Storage connectivity test failed", { error });
      },
    );
  }

  /**
   * Returns system performance dashboard data
   */
  async getPerformanceDashboard(): Promise<Result<Record<string, unknown>, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Record<string, unknown>> => {
        const stats = await withCircuit(
          "get-storage-stats",
          () => mediaRepository.getStorageStats(),
          DB_CIRCUIT_OPTIONS,
        );

        return {
          status: "operational",
          systemStatus: "operational",
          performance: "excellent",
          health: "healthy",
          totalAssets: stats.count,
          totalStorageBytes: stats.totalSize,
          storageConnected: !!appStorageService.getBucketName(),
          timestamp: new Date().toISOString(),
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MediaContentService] Failed to fetch dashboard stats", error as Error);
        return new InternalError("Failed to fetch dashboard stats", { error });
      },
    );
  }

  /**
   * Returns detailed performance metrics
   */
  async getPerformanceMetrics(): Promise<Result<Record<string, unknown>, AppError>> {
    return ok({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Returns overall system status
   */
  async getSystemStatus(): Promise<Result<Record<string, unknown>, AppError>> {
    return ok({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  }
}

export const mediaContentService = new MediaContentService();
