import {
  type InquiryEmailJobData,
  inquiryEmailJobSchema,
  type MediaProcessingJobData,
  mediaProcessingJobSchema,
} from "@run-remix/shared";
import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { generateResponsiveVariants, isImageFile, processImage } from "../image-processor.js";
import { emailService } from "../lib/integrations/email-service.js";
import { getGLTFProcessor, isGLTFFile } from "../lib/integrations/gltf-processor.js";
import { logger } from "../lib/monitoring/logger.js";
import { appStorageService } from "../lib/storage/app-service.js";
import { verifyCloudTaskToken } from "../lib/verify-cloud-task-token.js";
import { workerTaskDuration } from "../services/job-metrics.service.js";
import { mediaService } from "../services/media.service.js";
import { generateOrganizedStoragePath, getVideoMetadata } from "./media/utils.js";

const router = express.Router();

const verifyWorkerAuth = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const isAuthorized = await verifyCloudTaskToken(req);
    if (!isAuthorized) {
      logger.warn(`[Worker] Unauthorized access attempt to worker path: ${req.path}`);
      res.status(403).json({ error: "Unauthorized" });
      return;
    }
  }
  next();
};

// Worker route to handle async email sending from Cloud Tasks
router.post(
  "/send-email",
  verifyWorkerAuth,
  validateRequest({ body: inquiryEmailJobSchema }),
  async (req, res) => {
    const startTime = performance.now();
    const payload = req.body as InquiryEmailJobData;

    logger.info(`[Worker] Processing email task for inquiry #${payload.id}`);

    // Send emails synchronously here (since we are already in a background worker)
    const [adminResult, customerResult] = await Promise.all([
      emailService.sendAdminNotification(payload),
      emailService.sendCustomerConfirmation(payload),
    ]);

    let hasError = false;

    if (adminResult.isOk()) {
      logger.info(`[Worker] Admin notification sent for inquiry #${payload.id}`);
    } else {
      logger.error(
        `[Worker] Failed to send admin notification for inquiry #${payload.id}:`,
        adminResult.error,
      );
      hasError = true;
    }

    if (customerResult.isOk()) {
      logger.info(`[Worker] Customer confirmation sent to ${payload.email}`);
    } else {
      logger.error(
        `[Worker] Failed to send customer confirmation to ${payload.email}:`,
        customerResult.error,
      );
      hasError = true;
    }

    if (hasError) {
      workerTaskDuration.observe(
        { operation: "send-email", status: "error" },
        (performance.now() - startTime) / 1000,
      );
      // Return 500 to trigger Cloud Tasks retry
      return res.status(500).json({ error: "One or more email operations failed" });
    }

    workerTaskDuration.observe(
      { operation: "send-email", status: "success" },
      (performance.now() - startTime) / 1000,
    );
    // Return success to Cloud Tasks to acknowledge completion
    return res.status(200).json({ success: true });
  },
);

/**
 * Media Processing Worker
 * POST /api/worker/process-media
 *
 * Handles async media processing tasks queued by the media-queue module.
 */
router.post(
  "/process-media",
  verifyWorkerAuth,
  validateRequest({ body: mediaProcessingJobSchema }),
  async (req, res) => {
    const startTime = performance.now();
    const taskName = req.header("X-CloudTasks-TaskName");
    const payload = req.body as MediaProcessingJobData;

    logger.info("[Worker:Media] Processing task", {
      mediaId: payload.mediaId,
      operation: payload.operation,
      taskName,
      retryCount: payload.retryCount || 0,
    });

    try {
      // 1. Fetch asset metadata from database
      const numericId = Number.parseInt(payload.mediaId, 10);
      const assetResult = await mediaService.getAssetById(numericId);

      if (assetResult.isErr()) {
        logger.warn("[Worker:Media] Asset not found, skipping", { mediaId: payload.mediaId });
        return res.status(200).json({ success: true, message: "Asset not found" });
      }

      const asset = assetResult.value;

      // 2. Download original file buffer
      const buffer = await appStorageService.downloadAsset(asset.storagePath);

      // 3. Idempotency Check: Skip if already processed
      const metadata = (asset.metadata as Record<string, unknown>) || {};

      // 4. Process based on operation type
      switch (payload.operation) {
        case "optimize":
          if (metadata.optimized) {
            logger.info("[Worker:Media] Asset already optimized, skipping", {
              mediaId: payload.mediaId,
            });
            break;
          }

          if (isImageFile(asset.mimeType)) {
            logger.info("[Worker:Media] Optimizing image", { mediaId: payload.mediaId });

            // Generate optimized variants (SSOT: image-processor)
            const variants = await generateResponsiveVariants(buffer, asset.filename);

            // Update asset metadata to indicate optimization complete
            await mediaService.updateAsset(numericId, {
              metadata: {
                ...metadata,
                optimized: true,
                optimizedAt: new Date().toISOString(),
              },
              imageVariants: variants,
            });
          }
          break;

        case "metadata": {
          if (metadata.metadataExtracted) {
            logger.info("[Worker:Media] Metadata already extracted, skipping", {
              mediaId: payload.mediaId,
            });
            break;
          }

          logger.info("[Worker:Media] Extracting metadata", { mediaId: payload.mediaId });

          let metadataUpdate: Record<string, unknown> = {};

          if (asset.mimeType.startsWith("video/")) {
            const videoMeta = await getVideoMetadata(buffer);
            metadataUpdate = { video: videoMeta };
          } else if (isGLTFFile(asset.mimeType, asset.filename)) {
            const processor = getGLTFProcessor();
            const validation = await processor.validateForProductionUpload(buffer);
            if (validation.valid) {
              metadataUpdate = { gltf: { valid: true } }; // Or more detailed if needed
            }
          }

          if (Object.keys(metadataUpdate).length > 0) {
            await mediaService.updateAsset(numericId, {
              metadata: {
                ...metadata,
                ...metadataUpdate,
                metadataExtracted: true,
              },
            });
          }
          break;
        }

        case "thumbnail":
          if (asset.thumbnailUrl) {
            logger.info("[Worker:Media] Thumbnail already exists, skipping", {
              mediaId: payload.mediaId,
            });
            break;
          }
          // If it's an image, processImage generates a thumbnail automatically
          if (isImageFile(asset.mimeType)) {
            const thumbResult = await processImage(buffer, asset.filename);

            if (thumbResult.thumbnailFilename) {
              const thumbPath = generateOrganizedStoragePath(
                "thumbnails",
                thumbResult.thumbnailFilename,
              );
              await mediaService.updateAsset(numericId, {
                thumbnailUrl: `/api/media/thumbnail/${numericId}`,
                thumbnailFilename: thumbResult.thumbnailFilename,
                thumbnailStoragePath: thumbPath,
              });
            }
          }
          break;

        default:
          logger.info("[Worker:Media] Operation not implemented", { operation: payload.operation });
      }

      const duration = performance.now() - startTime;
      workerTaskDuration.observe(
        { operation: payload.operation, status: "success" },
        duration / 1000,
      );

      // Final cleanup: remove isProcessing flag if all processing is likely done
      // Note: In a real system, we'd check if ALL expected tasks for this asset are done.
      // For now, we'll just clear it if this was an 'optimize' or 'metadata' task.
      if (payload.operation === "optimize" || payload.operation === "metadata") {
        const currentAssetResult = await mediaService.getAssetById(numericId);
        if (currentAssetResult.isOk()) {
          const currentMeta = (currentAssetResult.value.metadata as Record<string, unknown>) || {};
          await mediaService.updateAsset(numericId, {
            metadata: {
              ...currentMeta,
              isProcessing: false,
              processedAt: new Date().toISOString(),
            },
          });
        }
      }

      logger.info("[Worker:Media] Task completed", {
        mediaId: payload.mediaId,
        operation: payload.operation,
        durationMs: Math.round(duration),
      });

      return res.status(200).json({
        success: true,
        durationMs: Math.round(duration),
      });
    } catch (error) {
      const duration = (performance.now() - startTime) / 1000;
      workerTaskDuration.observe({ operation: payload.operation, status: "error" }, duration);

      logger.error(
        "[Worker:Media] Processing failed",
        {
          mediaId: payload.mediaId,
          operation: payload.operation,
        },
        error as Error,
      );

      // Return 500 to trigger retry
      return res.status(500).json({
        error: "Processing failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
);

/**
 * Cache Invalidation Worker
 * POST /api/worker/invalidate-cache
 *
 * Handles async cache invalidation tasks queued by CMS updates.
 */
router.post(
  "/invalidate-cache",
  verifyWorkerAuth,
  validateRequest({
    body: z.object({
      target: z.enum([
        "homepage",
        "manufacturing",
        "categories",
        "about",
        "sustainability",
        "products",
        "technology",
        "contact",
      ]),
      id: z.number().optional(),
    }),
  }),
  async (req, res) => {
    const startTime = performance.now();
    const { target, id } = req.body;

    logger.info(`[Worker:Cache] Processing cache invalidation task for target: ${target}`);

    try {
      const { CacheOperations } = await import("../lib/cache/cache-strategies.js");

      switch (target) {
        case "homepage":
          await CacheOperations.invalidateHomepage();
          break;
        case "manufacturing":
          await CacheOperations.invalidateManufacturing();
          break;
        case "categories":
          await CacheOperations.invalidateCategories(id);
          break;
        case "products":
          await CacheOperations.invalidateProducts(id);
          break;
        case "about":
          await CacheOperations.invalidateAbout();
          break;
        case "sustainability":
          await CacheOperations.invalidateSustainability();
          break;
        case "technology":
          await CacheOperations.invalidateTechnology();
          break;
        case "contact":
          await CacheOperations.invalidateContact();
          break;
      }

      const duration = performance.now() - startTime;
      workerTaskDuration.observe(
        { operation: "invalidate-cache", status: "success" },
        duration / 1000,
      );

      logger.info(`[Worker:Cache] Cache invalidation completed for ${target}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      const duration = (performance.now() - startTime) / 1000;
      workerTaskDuration.observe({ operation: "invalidate-cache", status: "error" }, duration);

      logger.error(`[Worker:Cache] Cache invalidation failed for ${target}`, error as Error);
      return res.status(500).json({
        error: "Cache invalidation failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
);

/**
 * Worker Health Check
 * GET /api/worker/health
 */
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    workers: ["email", "media-processor"],
    timestamp: new Date().toISOString(),
  });
});

export default router;
