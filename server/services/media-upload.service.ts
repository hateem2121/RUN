import { err, ok, type Result } from "neverthrow";
import type { MediaAsset } from "../../shared/index.js";
import { generateResponsiveVariants, isImageFile, processImage } from "../image-processor.js";
import { mediaRepository } from "../lib/db/repositories/index.js";
import { type AppError, BadRequestError, InternalError, NotFoundError } from "../lib/errors.js";
import { getGLTFProcessor, isGLTFFile } from "../lib/integrations/gltf-processor.js";
import { logger, serializeError } from "../lib/monitoring/logger.js";
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
  getVideoMetadata,
  slugifyFilename,
} from "../routes/media/utils.js";
import { webhookService } from "./webhook-service.js";

/**
 * Upload session management for chunk tracking
 */
export interface UploadSession {
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
export class MediaUploadService {
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
    totalSize: number,
    mimeType: string,
    originalName: string,
  ): Promise<Result<{ uploadId: string; chunkSize: number; totalChunks: number }, AppError>> {
    const uploadId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const chunkSize = UPLOAD_CONFIG.chunkSize;
    const totalChunks = Math.ceil(totalSize / chunkSize);

    const session: UploadSession = {
      uploadId,
      filename,
      originalName: originalName || filename,
      totalSize,
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
    const chunkKey = `${CHUNK_STORAGE_BASE}/${uploadId}/chunk-${chunkNumber}`;

    try {
      await withCircuit(
        "upload-chunk",
        () =>
          withTimeout(
            appStorageService.uploadAsset(chunkKey, buffer, { isPublic: CHUNK_STORAGE_IS_PUBLIC }),
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

      return ok({
        uploadId,
        chunkNumber,
        progress,
        status: isComplete ? "ready_for_finalization" : "uploading",
      });
    } catch (error) {
      logger.error(
        "[MediaUploadService] Chunk upload failed",
        { uploadId, chunkNumber },
        error as Error,
      );
      return err(new InternalError("Failed to upload chunk to storage", { error }));
    }
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

    try {
      logger.info(
        `[MediaUploadService] Finalizing upload ${uploadId}: assembling ${session.totalChunks} chunks`,
      );

      // Parallel Assembly - download chunks concurrently
      const PARALLEL_BATCH_SIZE = 10;
      const orderedChunks: Buffer[] = new Array(session.totalChunks);
      let computedTotal = 0;

      for (
        let batchStart = 0;
        batchStart < session.totalChunks;
        batchStart += PARALLEL_BATCH_SIZE
      ) {
        const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, session.totalChunks);
        const batchPromises = [];

        for (let i = batchStart; i < batchEnd; i++) {
          const chunkKey = `${CHUNK_STORAGE_BASE}/${uploadId}/chunk-${i}`;
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
            return err(new InternalError(`Chunk ${index} missing during assembly`));
          }
          orderedChunks[index] = chunk;
          computedTotal += chunk.length;
        }
      }

      if (computedTotal !== session.totalSize) {
        return err(
          new InternalError(
            `Size mismatch: computed ${computedTotal} bytes, expected ${session.totalSize} bytes`,
          ),
        );
      }

      let assembledFile = Buffer.concat(orderedChunks, computedTotal);

      // GLTF Processing & Validation
      if (isGLTFFile(session.mimeType, session.filename)) {
        logger.debug(`[MediaUploadService] Processing GLTF file: ${session.filename}`);
        const gltfProcessor = getGLTFProcessor();

        const embedResult = await gltfProcessor.processForUpload(assembledFile);
        if (!embedResult.success) {
          return err(new InternalError(embedResult.error || "GLTF processing failed"));
        }

        assembledFile = Buffer.from(embedResult.processedBuffer);

        const validation = await gltfProcessor.validateForProductionUpload(assembledFile);
        if (!validation.valid) {
          return err(new BadRequestError(validation.reason || "GLTF validation failed"));
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
        return err(new InternalError("Database record creation failed"));
      }

      // Update URL to use API proxy
      const correctUrl = `/api/media/${createdAsset.id}/content`;
      let finalAsset =
        (await mediaRepository.updateMediaAsset(createdAsset.id, {
          url: correctUrl,
        })) || createdAsset;

      // Image Processing (Async)
      if (mediaType === "images" || isImageFile(session.mimeType)) {
        try {
          const imageData = await processImage(assembledFile, session.filename);
          const variants = await generateResponsiveVariants(assembledFile, session.filename);

          finalAsset =
            (await mediaRepository.updateMediaAsset(createdAsset.id, {
              thumbnailUrl: `/api/media/thumbnail/${createdAsset.id}`,
              metadata: {
                dimensions: { width: imageData.width, height: imageData.height },
                format: session.mimeType.split("/")[1],
              },
              imageVariants: variants || undefined,
            })) || finalAsset;
        } catch (procErr) {
          logger.warn("[MediaUploadService] Image optimization failed", serializeError(procErr));
        }
      }

      // Cleanup session and trigger webhook
      this.cleanupSession(uploadId);
      webhookService.trigger("media.uploaded", finalAsset);

      logger.info(
        `[MediaUploadService] ✅ Successfully finalized upload ${uploadId} for asset ${finalAsset.id}`,
      );
      return ok(finalAsset);
    } catch (error) {
      logger.error("[MediaUploadService] Upload finalization failed", { uploadId }, error as Error);
      return err(new InternalError("Failed to finalize media upload", { error }));
    }
  }

  /**
   * Cleans up chunks and session metadata
   */
  private async cleanupSession(uploadId: string) {
    const session = this.sessions.get(uploadId);
    if (!session) return;

    // Async cleanup of chunks
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkKey = `${CHUNK_STORAGE_BASE}/${uploadId}/chunk-${i}`;
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
    try {
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

      // Process thumbnails for images + generate compressed variants
      if (fileType === "image") {
        try {
          const imageData = await processImage(file.buffer, file.originalname);
          const imageMetadata = {
            dimensions: {
              width: imageData.width,
              height: imageData.height,
            },
            format: correctedMime.split("/")[1],
          };

          let imageVariants: Record<string, string> | undefined;
          try {
            imageVariants = (await generateResponsiveVariants(
              file.buffer,
              file.originalname,
            )) as unknown as Record<string, string>;
            logger.info("Responsive variants generated (single upload)", {
              assetId: asset.id,
              variants: Object.keys(imageVariants || {}),
            });
          } catch (variantError) {
            logger.warn(
              "Responsive variant generation failed (single upload):",
              serializeError(variantError),
            );
          }

          await storage.updateMediaAsset(asset.id, {
            thumbnailUrl: `/api/media/thumbnail/${asset.id}`,
            metadata: imageMetadata,
            imageVariants: imageVariants || undefined,
          });
        } catch (error) {
          logger.error("Thumbnail generation failed:", serializeError(error));
        }
      }

      // Process video metadata
      if (fileType === "video") {
        try {
          const videoMetadata = await getVideoMetadata(file.buffer);

          await storage.updateMediaAsset(asset.id, {
            thumbnailUrl: `/api/media/thumbnail/${asset.id}`,
            metadata: videoMetadata,
          });
        } catch (error) {
          logger.error("Video metadata extraction aborted:", serializeError(error));
        }
      }

      // Process GLTF/GLB models
      if (fileType === "model") {
        try {
          const gltfProcessor = getGLTFProcessor();
          const processed = await gltfProcessor.processForUpload(file.buffer);

          if (processed.success) {
            const gltfMetadata = {
              texturesEmbedded: processed.texturesEmbedded || 0,
              processedSize: processed.processedSize || 0,
              originalSize: processed.originalSize || 0,
            };

            await storage.updateMediaAsset(asset.id, {
              thumbnailUrl: `/api/media/thumbnail/${asset.id}`,
              metadata: gltfMetadata,
            });
          }
        } catch (error) {
          logger.error("GLTF processing failed:", serializeError(error));
        }
      }

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

      return ok(finalAsset as MediaAsset);
    } catch (error) {
      logger.error("[MediaUploadService] Single upload failed", error as Error);
      return err(new InternalError("Upload failed", { error }));
    }
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
    try {
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

      return ok({
        deleted: successCount,
        failed: ids.length - successCount - rollbackCount - criticalFailureCount,
        total: ids.length,
        rolledBack: rollbackCount,
        criticalFailures: criticalFailureCount,
      });
    } catch (error) {
      return err(new InternalError("Batch delete failed", { error }));
    }
  }

  /**
   * Performs batch creation from multiple files
   */
  async batchCreateAssets(files: Express.Multer.File[]): Promise<Result<MediaAsset[], AppError>> {
    try {
      const results: MediaAsset[] = [];

      for (const file of files) {
        const result = await this.uploadSingleFile(file);
        if (result.isErr()) {
          return err(result.error);
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

      return ok(results);
    } catch (error) {
      return err(new InternalError("Batch upload failed", { error }));
    }
  }

  /**
   * Uploads file from Base64 data
   */
  async uploadBase64(
    _filename: string,
    _base64Data: string,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    // Basic implementation for now
    return ok({ status: "Base64 upload not fully implemented in service layer yet" });
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
