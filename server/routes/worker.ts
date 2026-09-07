import {
  type InquiryEmailJobData,
  inquiryEmailJobSchema,
  type MediaProcessingJobData,
  mediaProcessingJobSchema,
} from "@run-remix/shared";
import express from "express";
import { ResultAsync } from "neverthrow";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { generateResponsiveVariants, isImageFile, processImage } from "../lib/image-processor.js";
import { emailService } from "../lib/integrations/email-service.js";
import { getGLTFProcessor, isGLTFFile } from "../lib/integrations/gltf-processor.js";
import { logger } from "../lib/monitoring/logger.js";
import { appStorageService } from "../lib/storage/app-service.js";
import { verifyCloudTaskToken } from "../lib/verify-cloud-task-token.js";
import { mediaService } from "../services/media/media.service.js";
import { workerTaskDuration } from "../services/system/job-metrics.service.js";
import { concurrencyLimiter } from "../services/worker/concurrency-limiter.js";
import {
  deadLetterQueueService,
  UnrecoverableWorkerError,
} from "../services/worker/dead-letter-queue.js";
import { generateOrganizedStoragePath, getVideoMetadata } from "./media/utils.js";

const router = express.Router();

/**
 * Extracts and parses the Cloud Tasks retry count from request headers or body.
 */
function getRetryCount(req: express.Request): number {
  const headerVal =
    req.headers["x-cloudtasks-taskretrycount"] ?? req.header("X-CloudTasks-TaskRetryCount");
  if (typeof headerVal === "string") {
    const parsed = Number.parseInt(headerVal, 10);
    if (!Number.isNaN(parsed)) return parsed;
  } else if (typeof headerVal === "number") {
    return headerVal;
  }
  if (typeof req.body === "object" && req.body !== null && "retryCount" in req.body) {
    const b = req.body as { retryCount?: unknown };
    if (typeof b.retryCount === "number") return b.retryCount;
  }
  return 0;
}

/**
 * Emits structured Pino metrics for worker queuing, active concurrency, and DLQ size.
 */
function logWorkerMetrics(message: string, extra: Record<string, unknown> = {}): void {
  logger.info(message, {
    ...extra,
    worker_tasks_queued: concurrencyLimiter.queuedCount,
    worker_concurrency_active: concurrencyLimiter.activeCount,
    worker_dlq_count: deadLetterQueueService.getDlqCount(),
  });
}

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
  } else {
    // In dev / test, if WORKER_SECRET is configured, validate authorization
    const secret = process.env.WORKER_SECRET;
    const authHeader = req.header("Authorization");
    if (secret && authHeader && authHeader !== `Bearer ${secret}`) {
      logger.warn(`[Worker] Invalid dev worker token: ${req.path}`);
      res.status(403).json({ error: "Unauthorized" });
      return;
    }
  }
  next();
};

/**
 * Worker route to handle async email sending from Cloud Tasks
 * POST /api/worker/send-email
 */
router.post(
  "/send-email",
  verifyWorkerAuth,
  validateRequest({ body: inquiryEmailJobSchema }),
  async (req, res) => {
    const startTime = performance.now();
    const payload = req.body as InquiryEmailJobData;
    const taskName = req.header("X-CloudTasks-TaskName") || `send-email-${payload.id}`;
    const retryCount = getRetryCount(req);

    // If retry count exceeds threshold, dead-letter immediately to break retry loop
    if (retryCount > 5) {
      const reason = `Max retry limit exceeded (${retryCount} > 5)`;
      await deadLetterQueueService.record({
        taskName,
        endpoint: "/send-email",
        payload,
        headers: req.headers as Record<string, unknown>,
        retryCount,
        reason,
      });
      logWorkerMetrics("[Worker:Email] Email task dead-lettered before execution", {
        inquiryId: payload.id,
        retryCount,
      });
      return res.status(200).json({ status: "dead_lettered", reason });
    }

    try {
      return await concurrencyLimiter.execute(taskName, async () => {
        logWorkerMetrics(`[Worker] Processing email task for inquiry #${payload.id}`, {
          inquiryId: payload.id,
          taskName,
          retryCount,
        });

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
          const reason = "One or more email operations failed";

          if (retryCount > 5) {
            await deadLetterQueueService.record({
              taskName,
              endpoint: "/send-email",
              payload,
              headers: req.headers as Record<string, unknown>,
              retryCount,
              reason,
            });
            logWorkerMetrics("[Worker:Email] Email task dead-lettered after failure", {
              inquiryId: payload.id,
              retryCount,
            });
            return res.status(200).json({ status: "dead_lettered", reason });
          }

          // Return 500 to trigger Cloud Tasks retry
          return res.status(500).json({ error: reason });
        }

        workerTaskDuration.observe(
          { operation: "send-email", status: "success" },
          (performance.now() - startTime) / 1000,
        );
        logWorkerMetrics(`[Worker:Email] Email task succeeded for inquiry #${payload.id}`, {
          inquiryId: payload.id,
        });
        // Return success to Cloud Tasks to acknowledge completion
        return res.status(200).json({ success: true });
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const isUnrecoverable =
        err instanceof UnrecoverableWorkerError ||
        Boolean((err as { isUnrecoverable?: boolean }).isUnrecoverable);

      workerTaskDuration.observe(
        { operation: "send-email", status: "error" },
        (performance.now() - startTime) / 1000,
      );

      if (retryCount > 5 || isUnrecoverable) {
        await deadLetterQueueService.record({
          taskName,
          endpoint: "/send-email",
          payload,
          headers: req.headers as Record<string, unknown>,
          retryCount,
          reason: err.message,
          error: err.stack ?? err.message,
        });
        logWorkerMetrics("[Worker:Email] Task dead-lettered on unhandled error", {
          inquiryId: payload.id,
          retryCount,
          reason: err.message,
        });
        return res.status(200).json({ status: "dead_lettered", reason: err.message });
      }

      return res.status(500).json({ error: "Email processing failed", message: err.message });
    }
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
    const taskName = req.header("X-CloudTasks-TaskName") || "process-media";
    const payload = req.body as MediaProcessingJobData;
    const retryCount = getRetryCount(req);

    if (retryCount > 5) {
      const reason = `Max retry limit exceeded (${retryCount} > 5)`;
      await deadLetterQueueService.record({
        taskName,
        endpoint: "/process-media",
        payload,
        headers: req.headers as Record<string, unknown>,
        retryCount,
        reason,
      });
      logWorkerMetrics("[Worker:Media] Media task dead-lettered before execution", {
        mediaId: payload.mediaId,
        retryCount,
      });
      return res.status(200).json({ status: "dead_lettered", reason });
    }

    try {
      return await concurrencyLimiter.execute(taskName, async () => {
        logWorkerMetrics("[Worker:Media] Processing task", {
          mediaId: payload.mediaId,
          operation: payload.operation,
          taskName,
          retryCount,
        });

        const result = await ResultAsync.fromPromise(
          (async () => {
            // 1. Fetch asset metadata from database
            const numericId = Number.parseInt(payload.mediaId, 10);
            const assetResult = await mediaService.getAssetById(numericId);

            if (assetResult.isErr()) {
              logger.warn("[Worker:Media] Asset not found, skipping", {
                mediaId: payload.mediaId,
              });
              return {
                handled: true,
                status: 200,
                data: { success: true, message: "Asset not found" },
              };
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
                    imageVariants:
                      (variants as Parameters<
                        typeof mediaService.updateAsset
                      >[1]["imageVariants"]) ?? null,
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
                    metadataUpdate = { gltf: { valid: true } };
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
                logger.info("[Worker:Media] Operation not implemented", {
                  operation: payload.operation,
                });
            }

            // Final cleanup: remove isProcessing flag if all processing is likely done
            if (payload.operation === "optimize" || payload.operation === "metadata") {
              const currentAssetResult = await mediaService.getAssetById(numericId);
              if (currentAssetResult.isOk()) {
                const currentMeta =
                  (currentAssetResult.value.metadata as Record<string, unknown>) || {};
                await mediaService.updateAsset(numericId, {
                  metadata: {
                    ...currentMeta,
                    isProcessing: false,
                    processedAt: new Date().toISOString(),
                  },
                });
              }
            }

            return { handled: true, status: 200, data: { success: true } };
          })(),
          (error) => error as Error,
        );

        return result.match(
          (handledResponse) => {
            const duration = performance.now() - startTime;
            workerTaskDuration.observe(
              { operation: payload.operation, status: "success" },
              duration / 1000,
            );

            logWorkerMetrics("[Worker:Media] Task completed", {
              mediaId: payload.mediaId,
              operation: payload.operation,
              durationMs: Math.round(duration),
            });

            if (handledResponse?.handled) {
              return res.status(handledResponse.status).json(handledResponse.data);
            }

            return res.status(200).json({
              success: true,
              durationMs: Math.round(duration),
            });
          },
          async (error) => {
            const duration = (performance.now() - startTime) / 1000;
            workerTaskDuration.observe({ operation: payload.operation, status: "error" }, duration);

            logger.error(
              "[Worker:Media] Processing failed",
              {
                mediaId: payload.mediaId,
                operation: payload.operation,
              },
              error,
            );

            // Clear isProcessing on failure to avoid permanently locked assets
            const numericId = Number.parseInt(payload.mediaId, 10);
            if (!Number.isNaN(numericId)) {
              try {
                const currentAssetResult = await mediaService.getAssetById(numericId);
                if (currentAssetResult.isOk()) {
                  const currentMeta =
                    (currentAssetResult.value.metadata as Record<string, unknown>) || {};
                  await mediaService.updateAsset(numericId, {
                    metadata: {
                      ...currentMeta,
                      isProcessing: false,
                      processingError: error instanceof Error ? error.message : String(error),
                      failedAt: new Date().toISOString(),
                    },
                  });
                }
              } catch {
                // Ignore secondary failure during error state recording
              }
            }

            const isUnrecoverable =
              error instanceof UnrecoverableWorkerError ||
              Boolean((error as { isUnrecoverable?: boolean }).isUnrecoverable);

            if (retryCount > 5 || isUnrecoverable) {
              await deadLetterQueueService.record({
                taskName,
                endpoint: "/process-media",
                payload,
                headers: req.headers as Record<string, unknown>,
                retryCount,
                reason: error.message,
                error: error.stack ?? error.message,
              });
              logWorkerMetrics("[Worker:Media] Task dead-lettered on error", {
                mediaId: payload.mediaId,
                retryCount,
                reason: error.message,
              });
              return res.status(200).json({ status: "dead_lettered", reason: error.message });
            }

            // Return 500 to trigger retry
            return res.status(500).json({
              error: "Processing failed",
              message: error instanceof Error ? error.message : String(error),
            });
          },
        );
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const isUnrecoverable =
        err instanceof UnrecoverableWorkerError ||
        Boolean((err as { isUnrecoverable?: boolean }).isUnrecoverable);

      if (retryCount > 5 || isUnrecoverable) {
        await deadLetterQueueService.record({
          taskName,
          endpoint: "/process-media",
          payload,
          headers: req.headers as Record<string, unknown>,
          retryCount,
          reason: err.message,
          error: err.stack ?? err.message,
        });
        return res.status(200).json({ status: "dead_lettered", reason: err.message });
      }

      return res.status(500).json({ error: "Processing failed", message: err.message });
    }
  },
);

/**
 * Derivatives Generation Worker
 * POST /api/worker/generate-derivatives
 *
 * Handles async derivative generation tasks with bounded concurrency.
 */
router.post(
  "/generate-derivatives",
  verifyWorkerAuth,
  validateRequest({
    body: z.object({
      mediaId: z.union([z.string(), z.number()]),
      options: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  async (req, res) => {
    const startTime = performance.now();
    const mediaIdStr = String(req.body.mediaId);
    const numericId = Number.parseInt(mediaIdStr, 10);
    const taskName = req.header("X-CloudTasks-TaskName") || `generate-derivatives-${mediaIdStr}`;
    const retryCount = getRetryCount(req);

    if (retryCount > 5) {
      const reason = `Max retry limit exceeded (${retryCount} > 5)`;
      await deadLetterQueueService.record({
        taskName,
        endpoint: "/generate-derivatives",
        payload: req.body,
        headers: req.headers as Record<string, unknown>,
        retryCount,
        reason,
      });
      logWorkerMetrics("[Worker:Derivatives] Task dead-lettered before execution", {
        mediaId: mediaIdStr,
        retryCount,
      });
      return res.status(200).json({ status: "dead_lettered", reason });
    }

    try {
      return await concurrencyLimiter.execute(taskName, async () => {
        logWorkerMetrics("[Worker:Derivatives] Processing derivatives task", {
          mediaId: mediaIdStr,
          taskName,
          retryCount,
        });

        if (Number.isNaN(numericId)) {
          throw new UnrecoverableWorkerError(`Invalid numeric mediaId: ${mediaIdStr}`);
        }

        const assetResult = await mediaService.getAssetById(numericId);
        if (assetResult.isErr()) {
          logWorkerMetrics("[Worker:Derivatives] Asset not found, skipping", {
            mediaId: mediaIdStr,
          });
          return res.status(200).json({ success: true, message: "Asset not found" });
        }

        const asset = assetResult.value;
        const buffer = await appStorageService.downloadAsset(asset.storagePath);

        let variants: unknown = null;
        if (isImageFile(asset.mimeType)) {
          variants = await generateResponsiveVariants(buffer, asset.filename);
          const metadata = (asset.metadata as Record<string, unknown>) || {};
          await mediaService.updateAsset(numericId, {
            metadata: {
              ...metadata,
              variantsGenerated: true,
              variantsGeneratedAt: new Date().toISOString(),
            },
            imageVariants: (variants as import("@run-remix/shared").ImageVariants) || null,
          });
        }

        const duration = performance.now() - startTime;
        workerTaskDuration.observe(
          { operation: "generate-derivatives", status: "success" },
          duration / 1000,
        );

        logWorkerMetrics("[Worker:Derivatives] Derivatives generated successfully", {
          mediaId: mediaIdStr,
          durationMs: Math.round(duration),
        });

        return res.status(200).json({
          success: true,
          mediaId: numericId,
          variants,
          durationMs: Math.round(duration),
        });
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const isUnrecoverable =
        err instanceof UnrecoverableWorkerError ||
        Boolean((err as { isUnrecoverable?: boolean }).isUnrecoverable);

      workerTaskDuration.observe(
        { operation: "generate-derivatives", status: "error" },
        (performance.now() - startTime) / 1000,
      );

      if (retryCount > 5 || isUnrecoverable) {
        await deadLetterQueueService.record({
          taskName,
          endpoint: "/generate-derivatives",
          payload: req.body,
          headers: req.headers as Record<string, unknown>,
          retryCount,
          reason: err.message,
          error: err.stack ?? err.message,
        });
        logWorkerMetrics("[Worker:Derivatives] Task dead-lettered on error", {
          mediaId: mediaIdStr,
          retryCount,
          reason: err.message,
        });
        return res.status(200).json({ status: "dead_lettered", reason: err.message });
      }

      logWorkerMetrics("[Worker:Derivatives] Task failed", {
        mediaId: mediaIdStr,
        error: err.message,
      });
      return res.status(500).json({
        error: "Derivative generation failed",
        message: err.message,
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
    const taskName = req.header("X-CloudTasks-TaskName") || `invalidate-cache-${target}`;
    const retryCount = getRetryCount(req);

    if (retryCount > 5) {
      const reason = `Max retry limit exceeded (${retryCount} > 5)`;
      await deadLetterQueueService.record({
        taskName,
        endpoint: "/invalidate-cache",
        payload: req.body,
        headers: req.headers as Record<string, unknown>,
        retryCount,
        reason,
      });
      logWorkerMetrics("[Worker:Cache] Task dead-lettered before execution", {
        target,
        retryCount,
      });
      return res.status(200).json({ status: "dead_lettered", reason });
    }

    try {
      return await concurrencyLimiter.execute(taskName, async () => {
        logWorkerMetrics(
          `[Worker:Cache] Processing cache invalidation task for target: ${target}`,
          {
            target,
            id,
          },
        );

        const result = await ResultAsync.fromPromise(
          (async () => {
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
          })(),
          (error) => error as Error,
        );

        return result.match(
          () => {
            const duration = performance.now() - startTime;
            workerTaskDuration.observe(
              { operation: "invalidate-cache", status: "success" },
              duration / 1000,
            );

            logWorkerMetrics(`[Worker:Cache] Cache invalidation completed for ${target}`, {
              target,
              durationMs: Math.round(duration),
            });
            return res.status(200).json({ success: true });
          },
          async (error) => {
            const duration = (performance.now() - startTime) / 1000;
            workerTaskDuration.observe(
              { operation: "invalidate-cache", status: "error" },
              duration,
            );

            const isUnrecoverable =
              error instanceof UnrecoverableWorkerError ||
              Boolean((error as { isUnrecoverable?: boolean }).isUnrecoverable);

            if (retryCount > 5 || isUnrecoverable) {
              await deadLetterQueueService.record({
                taskName,
                endpoint: "/invalidate-cache",
                payload: req.body,
                headers: req.headers as Record<string, unknown>,
                retryCount,
                reason: error.message,
                error: error.stack ?? error.message,
              });
              logWorkerMetrics(`[Worker:Cache] Cache invalidation dead-lettered for ${target}`, {
                target,
                retryCount,
                error: error.message,
              });
              return res.status(200).json({ status: "dead_lettered", reason: error.message });
            }

            logger.error(`[Worker:Cache] Cache invalidation failed for ${target}`, error);
            return res.status(500).json({
              error: "Cache invalidation failed",
              message: error instanceof Error ? error.message : String(error),
            });
          },
        );
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const isUnrecoverable =
        err instanceof UnrecoverableWorkerError ||
        Boolean((err as { isUnrecoverable?: boolean }).isUnrecoverable);

      if (retryCount > 5 || isUnrecoverable) {
        await deadLetterQueueService.record({
          taskName,
          endpoint: "/invalidate-cache",
          payload: req.body,
          headers: req.headers as Record<string, unknown>,
          retryCount,
          reason: err.message,
          error: err.stack ?? err.message,
        });
        return res.status(200).json({ status: "dead_lettered", reason: err.message });
      }

      return res.status(500).json({
        error: "Cache invalidation failed",
        message: err.message,
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
    workers: ["email", "media-processor", "generate-derivatives"],
    metrics: {
      worker_tasks_queued: concurrencyLimiter.queuedCount,
      worker_concurrency_active: concurrencyLimiter.activeCount,
      worker_dlq_count: deadLetterQueueService.getDlqCount(),
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
