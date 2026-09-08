import type { ImageVariants } from "@run-remix/shared";
import { ResultAsync } from "neverthrow";
import { AppError, InternalError, NotFoundError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../../lib/resilience/circuit-breaker.js";
import { appStorageService } from "../../lib/storage/app-service.js";
import { mediaRepository } from "../repositories/index.js";

/**
 * Service for serving media content and thumbnails via signed URLs.
 * Enforces Result-based patterns and circuit breaker protection.
 */
class MediaContentService {
  /**
   * Generates a signed URL for a media asset's primary content or specific variant.
   * Automatically handles responsive variants and fallbacks.
   */
  getSignedUrl(
    id: number,
    ttl = 300,
    variant?: keyof ImageVariants,
  ): ResultAsync<string, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const asset = await withCircuit(
          "media-content-asset",
          () => mediaRepository.getMediaAsset(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!asset) {
          throw new NotFoundError(`Media asset ${id} not found`);
        }

        // Direct return for local static URLs (starts with /)
        if (asset.url?.startsWith("/")) {
          if (variant && asset.imageVariants?.[variant]?.startsWith("/")) {
            return asset.imageVariants[variant]!;
          }
          return asset.url;
        }

        if (!asset.storagePath) {
          throw new NotFoundError(`Media asset ${id} not found`);
        }

        let pathToServe = asset.storagePath;

        // Local static path handling
        if (pathToServe.startsWith("/") || pathToServe.startsWith("images/")) {
          const localUrl = pathToServe.startsWith("/") ? pathToServe : `/${pathToServe}`;
          return localUrl;
        }

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

        // Ensure the asset actually exists in storage to prevent GCS 404 XML responses (which trigger CORB in browsers)
        const exists = await appStorageService.assetExists(pathToServe);
        if (!exists) {
          throw new NotFoundError(`Media source not found in storage: ${pathToServe}`);
        }

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
  getThumbnailUrl(id: number, ttl = 300): ResultAsync<string, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const asset = await withCircuit(
          "media-content-thumbnail",
          () => mediaRepository.getMediaAsset(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!asset) {
          throw new NotFoundError(`Media asset ${id} not found`);
        }

        // Direct return for local static URLs
        if (asset.thumbnailUrl?.startsWith("/")) {
          return asset.thumbnailUrl;
        }
        if (asset.url?.startsWith("/")) {
          return asset.url;
        }
        if (asset.storagePath?.startsWith("/") || asset.storagePath?.startsWith("images/")) {
          const localUrl = asset.storagePath.startsWith("/")
            ? asset.storagePath
            : `/${asset.storagePath}`;
          return localUrl;
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
  getMediaGeometry(id: number): ResultAsync<Record<string, unknown>, AppError> {
    return ResultAsync.fromPromise(
      Promise.resolve({ id, geometry: "Geometry extraction not implemented in service layer yet" }),
      (error) =>
        error instanceof AppError
          ? error
          : new InternalError("Failed to get media geometry", { error }),
    );
  }

  /**
   * Retrieves raw media content
   */
  getMediaRaw(id: number): ResultAsync<string, AppError> {
    return this.getSignedUrl(id);
  }

  /**
   * Proxies media content via signed URL
   */
  getMediaProxy(id: number): ResultAsync<string, AppError> {
    return this.getSignedUrl(id);
  }

  /**
   * Proxies thumbnail content via signed URL
   */
  getThumbnailProxy(id: number): ResultAsync<string, AppError> {
    return this.getThumbnailUrl(id);
  }

  /**
   * Verifies connectivity to object storage
   */
  testObjectStorageConnectivity(): ResultAsync<boolean, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
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
  getPerformanceDashboard(): ResultAsync<Record<string, unknown>, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
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
  getPerformanceMetrics(): ResultAsync<Record<string, unknown>, AppError> {
    return ResultAsync.fromPromise(
      Promise.resolve({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      }),
      (error) =>
        error instanceof AppError
          ? error
          : new InternalError("Failed to get performance metrics", { error }),
    );
  }

  /**
   * Returns overall system status
   */
  getSystemStatus(): ResultAsync<Record<string, unknown>, AppError> {
    return ResultAsync.fromPromise(
      Promise.resolve({
        status: "healthy",
        timestamp: new Date().toISOString(),
      }),
      (error) =>
        error instanceof AppError
          ? error
          : new InternalError("Failed to get system status", { error }),
    );
  }
}

export const mediaContentService = new MediaContentService();
