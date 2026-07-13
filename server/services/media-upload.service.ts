import path from "node:path";
import type { MediaAsset } from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { AppError, BadRequestError, InternalError, NotFoundError } from "../lib/errors.js";
import { isImageFile } from "../lib/image-processor.js";
import { getGLTFProcessor, isGLTFFile } from "../lib/integrations/gltf-processor.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { withTimeout } from "../lib/resilience/request-timeout.js";
import { appStorageService } from "../lib/storage/app-service.js";
import { correctMimeType } from "../lib/utilities/core-utils.js";
import { UPLOAD_CONFIG } from "../lib/utilities/upload-config.js";
import { CHUNK_STORAGE_BASE, CHUNK_STORAGE_IS_PUBLIC } from "../routes/media/chunk-config.js";
import {
  buildInsertMediaAsset,
  detectMediaType,
  generateOrganizedStoragePath,
  slugifyFilename,
} from "../routes/media/utils.js";
import { mediaRepository } from "./repositories/index.js";
import { queueMediaProcessing } from "./tasks/media-queue.service.js";
import { webhookService } from "./webhook-service.js";

/**
 * Upload session management for chunk tracking
 */
interface UploadSession {
  uploadId: string;
  filename: string;
  originalName: string;
  totalSize: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
  receivedChunks: Map<number, boolean>;
  startedAt: Date;
  lastActivityAt: Date;
}

/**
 * Service for handling complex chunked media uploads.
 * Enforces Result-based patterns and circuit breaker protection.
 * Centralizes assembly, GLTF processing, and image optimization.
 */
class MediaUploadService {
  private sessions = new Map<string, UploadSession>();
  private activeOperations = new Set<string>();

  constructor() {
    this.startPeriodicCleanup();
  }

  /**
   * Initializes a new chunked upload session
   */
  async initializeUpload(
    filename: string,
    fileSize: number,
    mimeType: string,
    originalName?: string,
  ): Promise<Result<{ uploadId: string; chunkSize: number; totalChunks: number }, AppError>> {
    // SECURITY [MD-105]: Validate file size against system limits before initializing
    if (fileSize > (UPLOAD_CONFIG.fileSizeLimits?.DEFAULT || 100 * 1024 * 1024)) {
      return err(
        new BadRequestError(
          `File size exceeds limit of ${(UPLOAD_CONFIG.fileSizeLimits?.DEFAULT || 100 * 1024 * 1024) / (1024 * 1024)}MB`,
        ),
      );
    }

    const uploadId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const chunkSize = UPLOAD_CONFIG.chunkSize;
    const totalChunks = Math.ceil(fileSize / chunkSize);

    const session: UploadSession = {
      uploadId,
      filename,
      originalName: originalName || filename,
      totalSize: fileSize,
      mimeType: correctMimeType(mimeType, originalName || filename),
      chunkSize,
      totalChunks,
      receivedChunks: new Map(),
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.sessions.set(uploadId, session);
    this.activeOperations.add(uploadId);

    logger.debug(`[MediaUploadService] Initialized session: ${uploadId} (${totalChunks} chunks)`);
    return ok({ uploadId, chunkSize, totalChunks });
  }

  /**
   * Uploads a single chunk of data
   */
  async uploadChunk(
    uploadId: string,
    chunkNumber: number,
    buffer: Buffer,
  ): Promise<
    Result<
      {
        uploadId: string;
        chunkNumber: number;
        progress: number;
        status: string;
      },
      AppError
    >
  > {
    const session = this.sessions.get(uploadId);
    if (!session) {
      return err(new NotFoundError("Upload session not found or expired"));
    }

    session.lastActivityAt = new Date();

    // SECURITY [MD-119]: Explicitly validate chunk size against session config
    // Prevents memory pressure attacks from oversized chunks
    if (buffer.length > session.chunkSize * 1.05) {
      return err(
        new BadRequestError(
          `Chunk size ${buffer.length} exceeds session limit of ${session.chunkSize}`,
        ),
      );
    }

    const safeUploadId = path.basename(uploadId);
    const chunkKey = `${CHUNK_STORAGE_BASE}/${safeUploadId}/chunk-${chunkNumber}`;

    return ResultAsync.fromPromise(
      (async (): Promise<{
        uploadId: string;
        chunkNumber: number;
        progress: number;
        status: string;
      }> => {
        await withCircuit(
          "upload-chunk",
          () =>
            withTimeout(
              appStorageService.uploadAsset(chunkKey, buffer, {
                isPublic: CHUNK_STORAGE_IS_PUBLIC,
              }),
              30000,
              "Upload chunk to object storage",
            ),
          DB_CIRCUIT_OPTIONS,
        );

        session.receivedChunks.set(chunkNumber, true);
        const progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);
        const isComplete = session.receivedChunks.size === session.totalChunks;

        logger.debug(
          `[MediaUploadService] Chunk ${chunkNumber}/${session.totalChunks} uploaded for ${uploadId} (${progress}%)`,
        );

        return {
          uploadId,
          chunkNumber,
          progress,
          status: isComplete ? "ready_for_finalization" : "uploading",
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[MediaUploadService] Chunk upload failed",
          { uploadId, chunkNumber },
          error as Error,
        );
        return new InternalError("Failed to upload chunk to storage", { error });
      },
    );
  }

  /**
   * Finalizes the upload by assembling chunks, processing GLTF, and creating DB records
   */
  async finalizeUpload(uploadId: string): Promise<Result<MediaAsset, AppError>> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      return err(new NotFoundError("Upload session not found or expired"));
    }

    if (session.receivedChunks.size !== session.totalChunks) {
      return err(
        new BadRequestError(
          `Incomplete upload: ${session.receivedChunks.size}/${session.totalChunks} chunks received`,
        ),
      );
    }

    return ResultAsync.fromPromise(
      (async (): Promise<MediaAsset> => {
        logger.info(
          `[MediaUploadService] Finalizing upload ${uploadId}: assembling ${session.totalChunks} chunks`,
        );

        // Parallel Assembly - download chunks concurrently
        const PARALLEL_BATCH_SIZE = 10;
        const orderedChunks: Buffer[] = new Array(session.totalChunks);
        let computedTotal = 0;
        const safeUploadId = path.basename(uploadId);

        for (
          let batchStart = 0;
          batchStart < session.totalChunks;
          batchStart += PARALLEL_BATCH_SIZE
        ) {
          const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, session.totalChunks);
          const batchPromises = [];

          for (let i = batchStart; i < batchEnd; i++) {
            const chunkKey = `${CHUNK_STORAGE_BASE}/${safeUploadId}/chunk-${i}`;
            batchPromises.push(
              withCircuit(
                "download-chunk-finalize",
                () =>
                  withTimeout(
                    appStorageService.downloadAsset(chunkKey),
                    15000,
                    `Download chunk ${i} for assembly`,
                  ),
                DB_CIRCUIT_OPTIONS,
              ).then((buffer) => {
                return { index: i, chunk: buffer };
              }),
            );
          }

          const batchResults = await Promise.all(batchPromises);
          for (const { index, chunk } of batchResults) {
            if (!chunk) {
              throw new InternalError(`Chunk ${index} missing during assembly`);
            }
            orderedChunks[index] = chunk;
            computedTotal += chunk.length;
          }
        }

        if (computedTotal !== session.totalSize) {
          throw new InternalError(
            `Size mismatch: computed ${computedTotal} bytes, expected ${session.totalSize} bytes`,
          );
        }

        let assembledFile = Buffer.concat(orderedChunks, computedTotal);

        // GLTF Processing & Validation
        if (isGLTFFile(session.mimeType, session.filename)) {
          logger.debug(`[MediaUploadService] Processing GLTF file: ${session.filename}`);
          const gltfProcessor = getGLTFProcessor();

          const embedResult = await gltfProcessor.processForUpload(assembledFile);
          if (!embedResult.success) {
            throw new InternalError(embedResult.error || "GLTF processing failed");
          }

          assembledFile = Buffer.from(embedResult.processedBuffer);

          const validation = await gltfProcessor.validateForProductionUpload(assembledFile);
          if (!validation.valid) {
            throw new BadRequestError(validation.reason || "GLTF validation failed");
          }
        }

        const mediaType = detectMediaType(session.mimeType);
        const storagePath = generateOrganizedStoragePath(mediaType, session.filename);

        // Upload final file to storage
        await withCircuit(
          "upload-final-asset",
          () =>
            withTimeout(
              appStorageService.uploadAsset(storagePath, assembledFile, {
                contentType: session.mimeType,
                isPublic: true,
              }),
              60000,
              "Final asset upload to object storage",
            ),
          DB_CIRCUIT_OPTIONS,
        );

        const slugifiedFilename = slugifyFilename(session.filename);
        const insertData = buildInsertMediaAsset({
          filename: slugifiedFilename,
          originalName: session.originalName,
          totalSize: assembledFile.length,
          mimeType: correctMimeType(session.mimeType, session.originalName),
          type: mediaType,
          url: "PLACEHOLDER",
          storagePath: storagePath,
          bucketName: appStorageService.getBucketName(),
        });

        // Transaction-safe DB record creation
        const createdAsset = await withCircuit(
          "create-media-asset-finalize",
          () => mediaRepository.createMediaAsset(insertData),
          DB_CIRCUIT_OPTIONS,
        );

        if (!createdAsset) {
          throw new InternalError("Database record creation failed");
        }

        // [WJ-103] Offload media processing tasks (optimisation, thumbnails, etc.)
        // Initial optimization, variants, and metadata extraction are handled by the background worker.
        queueMediaProcessing({
          mediaId: createdAsset.id.toString(),
          operation: "optimize",
        }).catch((err: Error) =>
          logger.error(
            `[MediaUploadService] Failed to queue optimization for asset ${createdAsset.id}`,
            err,
          ),
        );

        queueMediaProcessing({
          mediaId: createdAsset.id.toString(),
          operation: "metadata",
        }).catch((err: Error) =>
          logger.error(
            `[MediaUploadService] Failed to queue metadata extraction for asset ${createdAsset.id}`,
            err,
          ),
        );

        // Final metadata update (minimal)
        const correctUrl = `/api/media/${createdAsset.id}/content`;
        const finalAsset =
          (await mediaRepository.updateMediaAsset(createdAsset.id, {
            url: correctUrl,
            metadata: {
              ...(createdAsset.metadata as object),
              isProcessing: true,
              processingStartedAt: new Date().toISOString(),
            },
          })) || createdAsset;

        // Cleanup session and trigger webhook
        this.cleanupSession(uploadId);
        webhookService.trigger("media.uploaded", finalAsset);

        logger.info(
          `[MediaUploadService] ✅ Successfully finalized upload ${uploadId} for asset ${finalAsset.id}`,
        );
        return finalAsset;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[MediaUploadService] Upload finalization failed",
          { uploadId },
          error as Error,
        );
        return new InternalError("Failed to finalize media upload", { error });
      },
    );
  }

  /**
   * Cleans up chunks and session metadata
   */
  private async cleanupSession(uploadId: string) {
    const session = this.sessions.get(uploadId);
    if (!session) return;
    const safeUploadId = path.basename(uploadId);

    // Async cleanup of chunks
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkKey = `${CHUNK_STORAGE_BASE}/${safeUploadId}/chunk-${i}`;
      withCircuit(
        "delete-chunk-cleanup",
        () => appStorageService.deleteAsset(chunkKey),
        DB_CIRCUIT_OPTIONS,
      ).catch(() => {});
    }

    this.sessions.delete(uploadId);
    this.activeOperations.delete(uploadId);
  }

  /**
   * Periodic maintenance for stale upload sessions
   */
  private startPeriodicCleanup() {
    setInterval(
      () => {
        const now = Date.now();
        const STALE_THRESHOLD = 60 * 60 * 1000; // 1 hour
        for (const [uploadId, session] of this.sessions.entries()) {
          if (now - session.lastActivityAt.getTime() > STALE_THRESHOLD) {
            logger.warn(`[MediaUploadService] Cleaning up stale session: ${uploadId}`);
            this.cleanupSession(uploadId);
          }
        }
      },
      15 * 60 * 1000,
    ); // Every 15 mins
  }

  /**
   * Retrieves current progress of an upload
   */
  getUploadProgress(uploadId: string): Result<{ progress: number; status: string }, AppError> {
    const session = this.sessions.get(uploadId);
    if (!session) return err(new NotFoundError("Upload session not found"));

    const progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);
    const isComplete = session.receivedChunks.size === session.totalChunks;

    return ok({
      progress,
      status: isComplete ? "ready_for_finalization" : "uploading",
    });
  }

  /**
   * Cancels an ongoing upload
   */
  cancelUpload(uploadId: string): Result<boolean, AppError> {
    if (!this.sessions.has(uploadId)) return err(new NotFoundError("Upload session not found"));
    this.cleanupSession(uploadId);
    return ok(true);
  }

  /**
   * Lists all active upload sessions
   */
  getActiveUploads() {
    return Array.from(this.sessions.values()).map((s) => ({
      uploadId: s.uploadId,
      filename: s.filename,
      progress: Math.round((s.receivedChunks.size / s.totalChunks) * 100),
      startedAt: s.startedAt,
    }));
  }

  /**
   * Uploads a single file (standard multipart)
   */
  async uploadSingleFile(
    file: Express.Multer.File,
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic upload options
    options: Record<string, any> = {},
  ): Promise<Result<MediaAsset, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<MediaAsset> => {
        const storage = mediaRepository;
        let storageKey: string | null = null;

        // Correct MIME type
        const correctedMime = correctMimeType(file.mimetype, file.originalname);

        // Determine file type (use correctedMime for accurate detection)
        let fileType = "document";
        if (isImageFile(correctedMime)) {
          fileType = "image";
        } else if (correctedMime.startsWith("video/")) {
          fileType = "video";
        } else if (isGLTFFile(correctedMime, file.originalname)) {
          fileType = "model";
        }

        // Log upload initiation
        logger.info("File upload initiated", {
          filename: file.originalname,
          size: file.size,
          type: fileType,
          mimeType: correctedMime,
          originalMimeType: file.mimetype,
          hasAltText: !!options.altText,
          hasTags: !!options.tags?.length,
          hasCaption: !!options.caption,
          folderId: options.folderId,
        });

        // Generate organized storage path with automatic slugification
        const mediaType = detectMediaType(correctedMime);
        storageKey = generateOrganizedStoragePath(mediaType, file.originalname);

        // Store in object storage
        await withCircuit(
          "upload-single-file",
          () =>
            withTimeout(
              appStorageService.uploadAsset(storageKey, file.buffer),
              30000,
              "Single file upload to object storage",
            ),
          DB_CIRCUIT_OPTIONS,
        );

        // STANDARDIZED NAMING: Store slugified filename to match storage path
        const slugifiedFilename = slugifyFilename(file.originalname);

        // Create metadata with bucket name and optional fields
        const metadata = {
          filename: slugifiedFilename,
          originalName: file.originalname, // Preserve original for display
          totalSize: file.size,
          mimeType: correctedMime,
          type: fileType,
          url: `/api/media/${storageKey}`,
          storagePath: storageKey,
          bucketName: appStorageService.getBucketName(),
          tags: options.tags || [],
          altText: options.altText || "",
          caption: options.caption || "",
          folderId: options.folderId ?? null,
        };

        // Save to database
        const asset = await storage.createMediaAsset(buildInsertMediaAsset(metadata));

        // FIX: Update URL to use asset ID instead of storagePath
        await storage.updateMediaAsset(asset.id, {
          url: `/api/media/${asset.id}/content`,
        });

        // [WJ-103] Offload all processing tasks to the worker layer
        queueMediaProcessing({
          mediaId: asset.id.toString(),
          operation: "optimize",
        }).catch((err: Error) =>
          logger.error(
            `[MediaUploadService] Failed to queue optimization for asset ${asset.id}`,
            err,
          ),
        );

        queueMediaProcessing({
          mediaId: asset.id.toString(),
          operation: "metadata",
        }).catch((err: Error) =>
          logger.error(`[MediaUploadService] Failed to queue metadata for asset ${asset.id}`, err),
        );

        // Set initial processing state
        await storage.updateMediaAsset(asset.id, {
          metadata: {
            isProcessing: true,
            processingStartedAt: new Date().toISOString(),
          },
        });

        // Fetch the updated asset with metadata
        const updatedAsset = await storage.getMediaAsset(asset.id);
        const finalAsset = updatedAsset || asset;

        // Invalidate all media list caches
        const { unifiedCache } = await import("../lib/cache/unified-cache.js");
        await Promise.all([
          unifiedCache.clearPattern("data:/api/media.*"),
          unifiedCache.clearPattern("media:.*"),
          unifiedCache.delete("media-count"),
          unifiedCache.delete("search"),
        ]);

        return finalAsset as MediaAsset;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MediaUploadService] Single upload failed", error as Error);
        return new InternalError("Upload failed", { error });
      },
    );
  }

  /**
   * Performs batch deletion with compensating rollback
   */
  async batchDeleteAssets(ids: string[]): Promise<
    Result<
      {
        deleted: number;
        failed: number;
        total: number;
        rolledBack: number;
        criticalFailures: number;
      },
      AppError
    >
  > {
    return ResultAsync.fromPromise(
      (async (): Promise<{
        deleted: number;
        failed: number;
        total: number;
        rolledBack: number;
        criticalFailures: number;
      }> => {
        const numericIds = ids.map((id) => parseInt(id, 10));
        const assetsToDelete = await Promise.all(
          numericIds.map((id) => mediaRepository.getMediaAsset(id)),
        );

        const results = await Promise.allSettled(
          numericIds.map((id) => mediaRepository.deleteMediaAsset(id)),
        );

        let successCount = 0;
        let rollbackCount = 0;
        let criticalFailureCount = 0;

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const asset = assetsToDelete[i];

          if (
            result &&
            result.status === "fulfilled" &&
            (result as PromiseFulfilledResult<unknown>).value
          ) {
            successCount++;
            if (asset?.storagePath) {
              try {
                await withCircuit(
                  "delete-asset-batch",
                  () => appStorageService.deleteAsset(asset.storagePath!),
                  DB_CIRCUIT_OPTIONS,
                );
              } catch (storageError) {
                // Compensating Rollback
                try {
                  await mediaRepository.updateMediaAsset(asset.id, { deletedAt: null });
                  rollbackCount++;
                  successCount--;
                } catch (restoreError) {
                  criticalFailureCount++;
                  successCount--;
                  logger.error("[MediaUploadService] Critical: Batch restore failed", {
                    id: asset.id,
                    storageError,
                    restoreError,
                  });
                }
              }
            }
          }
        }

        // Invalidate cache
        if (successCount > 0) {
          const { unifiedCache } = await import("../lib/cache/unified-cache.js");
          await Promise.allSettled([
            unifiedCache.clearPattern("data:/api/media.*"),
            unifiedCache.clearPattern("media:.*"),
            unifiedCache.delete("media-count"),
            unifiedCache.delete("search"),
          ]);
        }

        return {
          deleted: successCount,
          failed: ids.length - successCount - rollbackCount - criticalFailureCount,
          total: ids.length,
          rolledBack: rollbackCount,
          criticalFailures: criticalFailureCount,
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new InternalError("Batch delete failed", { error });
      },
    );
  }

  /**
   * Performs batch creation from multiple files
   */
  async batchCreateAssets(files: Express.Multer.File[]): Promise<Result<MediaAsset[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<MediaAsset[]> => {
        const results: MediaAsset[] = [];

        for (const file of files) {
          const result = await this.uploadSingleFile(file);
          if (result.isErr()) {
            throw result.error;
          }
          results.push(result.value);
        }

        const { unifiedCache } = await import("../lib/cache/unified-cache.js");
        await Promise.allSettled([
          unifiedCache.clearPattern("data:/api/media.*"),
          unifiedCache.clearPattern("media:.*"),
          unifiedCache.delete("media-count"),
          unifiedCache.delete("search"),
        ]);

        return results;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new InternalError("Batch upload failed", { error });
      },
    );
  }

  /**
   * Uploads file from Base64 data
   */
  async uploadBase64(
    base64Data: string,
    filename: string,
    metadata: Record<string, unknown> = {},
  ): Promise<Result<MediaAsset, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<MediaAsset> => {
        // SECURITY [MD-101]: Parse and validate base64 data
        const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches?.length !== 3) {
          throw new BadRequestError("Invalid base64 data format");
        }

        const mimeType = matches[1]!;
        const buffer = Buffer.from(matches[2]!, "base64");

        // Validate size (limit to 5MB for base64 to avoid memory pressure)
        const MAX_BASE64_SIZE = 5 * 1024 * 1024;
        if (buffer.length > MAX_BASE64_SIZE) {
          throw new BadRequestError("Base64 upload limited to 5MB");
        }

        // Validate MIME type
        const allowedMimes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/svg+xml",
          "application/pdf",
        ];
        if (!allowedMimes.includes(mimeType)) {
          throw new BadRequestError(`MIME type ${mimeType} not allowed for base64 upload`);
        }

        const slugifiedName = slugifyFilename(filename);
        const mediaType = detectMediaType(mimeType);
        const storagePath = generateOrganizedStoragePath(mediaType, slugifiedName);

        // Upload to storage
        const url = await appStorageService.uploadAsset(storagePath, buffer, {
          contentType: mimeType,
        });

        // Create DB record
        const insertData = buildInsertMediaAsset({
          filename: slugifiedName,
          originalName: filename,
          mimeType,
          totalSize: buffer.length,
          storagePath,
          type: mediaType,
          url,
          metadata,
        });

        const asset = await mediaRepository.createMediaAsset(insertData);

        // [WJ-103] Offload processing
        queueMediaProcessing({
          mediaId: asset.id.toString(),
          operation: "optimize",
        }).catch((err: Error) =>
          logger.error(
            `[MediaUploadService] Failed to queue optimization for base64 asset ${asset.id}`,
            err,
          ),
        );

        // Set initial processing state
        await mediaRepository.updateMediaAsset(asset.id, {
          metadata: {
            ...(metadata as object),
            isProcessing: true,
            processingStartedAt: new Date().toISOString(),
          },
        });

        return asset;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[MediaUploadService] Base64 upload failed", error as Error);
        return new InternalError("Base64 upload failed", { error });
      },
    );
  }

  /**
   * Uploads chunk raw
   */
  async uploadChunkRaw(
    uploadId: string,
    chunkIndex: number,
    buffer: Buffer,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return this.uploadChunk(uploadId, chunkIndex, buffer);
  }

  /**
   * Processes and uploads a GLTF package
   */
  async uploadGltfPackage(): Promise<Result<Record<string, unknown>, AppError>> {
    return ok({ status: "GLTF package upload not fully implemented in service layer yet" });
  }

  /**
   * Uploads a raw chunk (with potential integrity checking)
   */
  async uploadRawChunk(
    uploadId: string,
    chunkNumber: number,
    buffer: Buffer,
    _options?: Record<string, unknown>,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return this.uploadChunk(uploadId, chunkNumber, buffer);
  }

  /**
   * Returns current upload metrics
   */
  getUploadMetrics(): Result<Record<string, unknown>, AppError> {
    return ok({
      activeSessions: this.sessions.size,
      activeOperations: this.activeOperations.size,
    });
  }
}

export const mediaUploadService = new MediaUploadService();
