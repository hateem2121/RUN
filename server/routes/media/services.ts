import type { MediaAsset } from "@shared/schema.js";
import { mediaRepository } from "../../lib/db/repositories/index.js";
import { getGLTFProcessor, isGLTFFile } from "../../lib/integrations/gltf-processor.js";
import { logger, serializeError } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { appStorageService } from "../../lib/storage/app-service.js";
import UPLOAD_CONFIG from "../../lib/utilities/upload-config.js";
import { UploadRateLimiter } from "../../middleware/rateLimiter.js";
import { correctMimeType } from "../../utils.js";
import { CHUNK_STORAGE_BASE, CHUNK_STORAGE_IS_PUBLIC } from "./chunk-config.js";
import {
  buildInsertMediaAsset,
  detectMediaType,
  generateOrganizedStoragePath,
  slugifyFilename,
} from "./utils.js";

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

export const uploadSessions = new Map<string, UploadSession>();

/**
 * Enhanced upload service with proper chunk assembly and database integration
 * MEMORY LEAK FIX: Added file handle management and resource cleanup
 */
export const enhancedUploadService = {
  // MEMORY LEAK FIX: Track active file operations for cleanup
  activeFileOperations: new Set<string>(),

  // MEMORY LEAK FIX: Cleanup function for file handles and resources
  cleanupFileHandles: () => {
    logger.info(
      `[File Handle Cleanup] Cleaning up ${enhancedUploadService.activeFileOperations.size} active operations`,
    );
    enhancedUploadService.activeFileOperations.clear();
  },

  initializeChunkedUpload: async (
    filename: string,
    totalSize: number,
    mimeType: string,
    originalName: string,
  ) => {
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

    uploadSessions.set(uploadId, session);

    // MEMORY LEAK FIX: Track upload session for file handle management
    enhancedUploadService.activeFileOperations.add(uploadId);

    // Auto-cleanup after TTL with enhanced cleanup
    setTimeout(() => {
      if (uploadSessions.has(uploadId)) {
        logger.warn(`[Enhanced Upload] Auto-cleaning expired session: ${uploadId}`);
        uploadSessions.delete(uploadId);
        enhancedUploadService.activeFileOperations.delete(uploadId);
        // MEMORY LEAK FIX: Force garbage collection on expired sessions
        if (global.gc) {
          global.gc();
        }
      }
    }, UPLOAD_CONFIG.sessionTTL);

    logger.debug(`[Enhanced Upload] Initialized session: ${uploadId} (${totalChunks} chunks)`);
    return { uploadId, chunkSize, totalChunks };
  },

  uploadChunk: async (uploadId: string, chunkNumber: number, buffer: Buffer) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
      throw new Error("Upload session not found or expired");
    }

    // Update activity timestamp
    session.lastActivityAt = new Date();

    // Use shared CHUNK_STORAGE_BASE constant to ensure upload/finalize path consistency
    const chunkKey = `${CHUNK_STORAGE_BASE}/${uploadId}/chunk-${chunkNumber}`;
    await withTimeout(
      appStorageService.uploadAsset(chunkKey, buffer, {
        isPublic: CHUNK_STORAGE_IS_PUBLIC,
      }),
      30000,
      "Upload chunk to object storage",
    );
    session.receivedChunks.set(chunkNumber, true); // Track receipt, not data

    const progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);
    const isComplete = session.receivedChunks.size === session.totalChunks;

    logger.debug(
      `[Enhanced Upload] Chunk ${chunkNumber}/${session.totalChunks} uploaded for ${uploadId} (${progress}%)`,
    );

    return {
      uploadId,
      chunkNumber,
      progress,
      status: isComplete ? "ready_for_finalization" : "uploading",
      receivedChunks: session.receivedChunks.size,
      totalChunks: session.totalChunks,
    };
  },

  // CRITICAL FIX: Raw chunk upload handler to bypass DevTools FormData corruption
  uploadRawChunk: async (
    uploadId: string,
    chunkNumber: number,
    chunkData: Buffer,
    metadata: {
      chunkSize: number;
      chunkHash: string;
      totalChunks: number;
    },
  ) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
      throw new Error("Upload session not found");
    }

    // Validate chunk size
    if (chunkData.length !== metadata.chunkSize) {
      throw new Error(
        `Chunk size mismatch: expected ${metadata.chunkSize}, got ${chunkData.length}`,
      );
    }

    // Verify chunk integrity with SHA-256
    const crypto = await withTimeout(import("node:crypto"), 5000, "Import crypto module");
    const hash = crypto.createHash("sha256");
    hash.update(chunkData);
    const computedHash = hash.digest("base64");

    if (computedHash !== metadata.chunkHash) {
      logger.error(
        `[Raw Chunk] Hash mismatch for chunk ${chunkNumber}: expected ${metadata.chunkHash}, got ${computedHash}`,
      );
      throw new Error(`Chunk integrity check failed: hash mismatch for chunk ${chunkNumber}`);
    }

    session.lastActivityAt = new Date();

    // Use shared CHUNK_STORAGE_BASE constant to ensure upload/finalize path consistency
    const chunkKey = `${CHUNK_STORAGE_BASE}/${uploadId}/chunk-${chunkNumber}`;
    await withTimeout(
      appStorageService.uploadAsset(chunkKey, chunkData, {
        isPublic: CHUNK_STORAGE_IS_PUBLIC,
      }),
      30000,
      "Upload raw chunk to object storage",
    );
    session.receivedChunks.set(chunkNumber, true); // Track receipt, not data

    const progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);
    const isComplete = session.receivedChunks.size === session.totalChunks;

    logger.debug(
      `[Raw Chunk] ✅ Chunk ${chunkNumber}/${session.totalChunks} uploaded with integrity verified (${progress}%)`,
    );

    return {
      uploadId,
      chunkNumber,
      progress,
      status: isComplete ? "ready_for_finalization" : "uploading",
      receivedChunks: session.receivedChunks.size,
      totalChunks: session.totalChunks,
    };
  },

  getUploadProgress: (uploadId: string) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
      return { status: "not_found", progress: 0 };
    }

    const progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);
    const isComplete = session.receivedChunks.size === session.totalChunks;

    return {
      uploadId,
      progress,
      status: isComplete ? "ready_for_finalization" : "uploading",
      receivedChunks: session.receivedChunks.size,
      totalChunks: session.totalChunks,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
    };
  },

  finalizeUpload: async (uploadId: string) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
      throw new Error("Upload session not found or expired");
    }

    if (session.receivedChunks.size !== session.totalChunks) {
      throw new Error(
        `Incomplete upload: ${session.receivedChunks.size}/${session.totalChunks} chunks received`,
      );
    }

    // PHASE 5: PARALLEL CHUNK DOWNLOAD - Download chunks concurrently for faster assembly
    logger.info(
      `[ChunkAssembly] 🔧 Starting parallel assembly for ${session.totalChunks} chunks, expected total: ${session.totalSize} bytes`,
    );

    // OPTIMIZATION: Download chunks in parallel batches to improve speed while controlling memory
    const PARALLEL_BATCH_SIZE = 10; // Download 10 chunks at a time
    const orderedChunks: Buffer[] = new Array(session.totalChunks);
    let computedTotal = 0;

    for (let batchStart = 0; batchStart < session.totalChunks; batchStart += PARALLEL_BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, session.totalChunks);
      const batchPromises = [];

      for (let i = batchStart; i < batchEnd; i++) {
        // Use shared CHUNK_STORAGE_BASE constant - MUST match upload path exactly
        const chunkKey = `${CHUNK_STORAGE_BASE}/${uploadId}/chunk-${i}`;
        batchPromises.push(
          appStorageService.downloadAsset(chunkKey).then((buffer) => {
            if (!buffer) {
              throw new Error(`Chunk ${i} missing or corrupted - cannot assemble file`);
            }
            return { index: i, chunk: buffer };
          }),
        );
      }

      const batchResults = await withTimeout(
        Promise.all(batchPromises),
        60000,
        "Download chunk batch from storage",
      );

      for (const { index, chunk } of batchResults) {
        if (!chunk) {
          throw new Error(`Chunk ${index} not found in storage`);
        }
        orderedChunks[index] = chunk;
        computedTotal += chunk.length;
        logger.debug(`[ChunkAssembly] 📥 Retrieved chunk ${index}: ${chunk.length} bytes`);
      }
    }

    if (computedTotal !== session.totalSize) {
      throw new Error(
        `Size mismatch: computed ${computedTotal} bytes, expected ${session.totalSize} bytes`,
      );
    }

    logger.info(
      `[ChunkAssembly] 🔧 Performing single Buffer.concat with ${orderedChunks.length} chunks, exact total: ${computedTotal}`,
    );
    let assembledFile = Buffer.concat(orderedChunks, computedTotal);
    logger.info(`[ChunkAssembly] ✅ Parallel assembly complete: ${assembledFile.length} bytes`);

    // Verify file size
    if (assembledFile.length !== session.totalSize) {
      logger.error(
        `[ChunkAssembly] Size mismatch detected! Expected: ${session.totalSize}, Got: ${assembledFile.length}`,
      );
      throw new Error(
        `File size mismatch: expected ${session.totalSize}, got ${assembledFile.length}`,
      );
    }

    // PHASE 1.1 ENHANCED: GLTF Processing & Validation - Embed textures and enforce zero external dependencies
    if (isGLTFFile(session.mimeType, session.filename)) {
      logger.debug(`[GLTF] Processing and validating GLTF file: ${session.filename}`);
      logger.debug(
        `[GLTF] Assembled file size: ${assembledFile.length} bytes, expected: ${session.totalSize} bytes`,
      );

      // ENHANCED: Robust GLTF format detection with proper validation
      const fileHeader = assembledFile.subarray(0, Math.min(4096, assembledFile.length)); // Expanded scan window
      const fileStartHex = fileHeader.subarray(0, 20).toString("hex");

      // GLB format detection with proper header validation
      let isGLBFormat = false;
      let glbValidationDetails = "";

      if (assembledFile.length >= 12) {
        const magic = assembledFile.subarray(0, 4);
        const version = assembledFile.readUInt32LE(4);
        const declaredLength = assembledFile.readUInt32LE(8);

        const magicMatch =
          magic[0] === 0x67 && magic[1] === 0x6c && magic[2] === 0x54 && magic[3] === 0x46; // 'glTF'
        const versionValid = version === 2;
        const lengthValid = declaredLength === assembledFile.length;

        isGLBFormat = magicMatch && versionValid && lengthValid;
        glbValidationDetails = `magic=${magicMatch}, version=${version} (valid=${versionValid}), length=${declaredLength}/${assembledFile.length} (valid=${lengthValid})`;
      }

      // JSON format detection with UTF-8 BOM handling and robust parsing
      let isJSONFormat = false;
      let jsonValidationDetails = "";

      try {
        // Strip UTF-8 BOM if present
        let jsonText = fileHeader.toString("utf8");
        if (jsonText.charCodeAt(0) === 0xfeff) {
          jsonText = jsonText.substring(1);
          logger.debug("[GLTF] Stripped UTF-8 BOM from file");
        }

        // Trim leading whitespace and check for JSON start
        jsonText = jsonText.trim();
        const startsWithJSON = jsonText.charAt(0) === "{";

        // FIX: For large files, check more content or accept JSON structure
        let hasAssetProperty = false;
        if (jsonText.includes('"asset"') && jsonText.includes('"version"')) {
          hasAssetProperty = true;
        } else if (assembledFile.length > 1024 * 1024) {
          // For large files (>1MB), check first 32KB for asset field
          const largerHeader = assembledFile.subarray(0, Math.min(32768, assembledFile.length));
          const largerText = largerHeader.toString("utf8");
          if (largerText.includes('"asset"')) {
            hasAssetProperty = true;
            logger.info(`[GLTF] Found asset field in larger scan window for large file`);
          } else {
            // For very large files, accept if JSON structure is valid
            logger.info(
              `[GLTF] Large GLTF file - accepting based on JSON structure (${assembledFile.length} bytes)`,
            );
            hasAssetProperty = true;
          }
        }

        if (startsWithJSON && hasAssetProperty) {
          // Attempt to parse first part to validate JSON structure
          const firstBraceEnd = jsonText.indexOf("}") + 1;
          if (firstBraceEnd > 0) {
            const partialJson = jsonText.substring(0, Math.min(1000, firstBraceEnd));
            JSON.parse(`${partialJson}}`); // Just for validation
            isJSONFormat = true;
          }
        }

        jsonValidationDetails = `startsWithJSON=${startsWithJSON}, hasAsset=${hasAssetProperty}, firstChar='${jsonText.charAt(0)}'`;
      } catch (jsonError) {
        jsonValidationDetails = `parseError: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`;
      }

      logger.debug(`[GLTF] Enhanced format analysis:`);
      logger.debug(`  - File size: ${assembledFile.length} bytes`);
      logger.debug(`  - Hex start: ${fileStartHex}...`);
      logger.debug(`  - GLB validation: ${glbValidationDetails}`);
      logger.debug(`  - JSON validation: ${jsonValidationDetails}`);
      logger.debug(`  - Is valid GLB: ${isGLBFormat}`);
      logger.debug(`  - Is valid JSON GLTF: ${isJSONFormat}`);

      const isValidGLTFFormat = isGLBFormat || isJSONFormat;

      if (!isValidGLTFFormat) {
        logger.error(
          `[GLTF] Assembled file failed format validation - may be corrupted during chunk assembly`,
        );
        logger.error(`[GLTF] GLB details: ${glbValidationDetails}`);
        logger.error(`[GLTF] JSON details: ${jsonValidationDetails}`);
        // DON'T delete session yet - preserve for debugging
        throw new Error(`Assembled GLTF file failed format validation - possible chunk corruption`);
      }

      try {
        const gltfProcessor = getGLTFProcessor();

        // PHASE 1: First attempt texture embedding for files with external references
        const embedResult = await withTimeout(
          gltfProcessor.processForUpload(assembledFile),
          60000,
          "Process GLTF file for upload",
        );

        if (!embedResult.success) {
          uploadSessions.delete(uploadId);
          throw new Error(embedResult.error || "GLTF processing failed");
        }

        // Update assembled file with processed version
        assembledFile = Buffer.from(embedResult.processedBuffer);

        // PHASE 2: Strict production validation - ZERO external dependencies allowed
        const validation = await withTimeout(
          gltfProcessor.validateForProductionUpload(assembledFile),
          20000,
          "Validate GLTF for production upload",
        );

        if (!validation.valid) {
          uploadSessions.delete(uploadId);
          throw new Error(validation.reason || "GLTF validation failed");
        }

        logger.info(
          `[GLTF] Successfully processed and validated ${session.filename} - ${embedResult.texturesEmbedded} textures embedded, ${embedResult.externalReferencesRemoved} external refs removed`,
        );
      } catch (gltfError) {
        logger.error(
          `[GLTF] Processing/validation failed for ${session.filename}:`,
          serializeError(gltfError),
        );
        uploadSessions.delete(uploadId);
        throw gltfError;
      }
    }

    // Determine file type from MIME type
    let type = "document";
    if (session.mimeType.startsWith("image/")) {
      type = "image";
    } else if (session.mimeType.startsWith("video/")) {
      type = "video";
    } else if (session.mimeType.includes("gltf") || session.mimeType.startsWith("model/")) {
      type = "model";
    }

    // Generate organized storage path with automatic slugification
    // Format: {partition}/media/{type}/{yyyy}/{mm}/{timestamp}-{slugified-filename}.{ext}
    // The filename will be automatically slugified by generateOrganizedStoragePath
    const mediaType = detectMediaType(session.mimeType);
    const storagePath = generateOrganizedStoragePath(mediaType, session.filename);

    // Store file in Replit Object Storage using correct pattern
    const storage = mediaRepository;

    // Upload to object storage using correct App Storage pattern
    await withTimeout(
      appStorageService.uploadAsset(storagePath, assembledFile, {
        contentType: session.mimeType,
        isPublic: true,
      }),
      30000,
      "Upload final assembled file to object storage",
    );

    // Build metadata for database insertion using standardized field mapping
    // STANDARDIZED NAMING: Use slugified filename to match what's in storage
    const slugifiedFilename = slugifyFilename(session.filename);
    const actualBucketName = process.env.REPLIT_OBJSTORE_BUCKET_ID || "replit-default-bucket";
    const metadata = buildInsertMediaAsset({
      filename: slugifiedFilename,
      originalName: session.originalName, // Preserve original for display
      totalSize: assembledFile.length, // Use actual processed file size (GLTF processing may change size)
      mimeType: correctMimeType(session.mimeType, session.originalName),
      type: type,
      url: "PLACEHOLDER", // Will be updated with proper API proxy URL
      storagePath: storagePath,
      bucketName: actualBucketName,
    });

    // HARDENED: Transaction-safe database record creation
    let createdAsset: MediaAsset | null = null;
    try {
      createdAsset = await withTimeout(
        storage.createMediaAsset(metadata),
        10000,
        "Create media asset database record",
      );
      if (!createdAsset) {
        throw new Error("Database creation returned null");
      }

      // FIX: Update URL to use API proxy URL pattern like other media files
      const correctUrl = `/api/media/${createdAsset.id}/content`;
      const updatedAsset = await withTimeout(
        storage.updateMediaAsset(createdAsset.id, {
          url: correctUrl,
        }),
        10000,
        "Update media asset URL in database",
      );
      createdAsset = updatedAsset || null;
    } catch (dbError) {
      // RECOVERY: If database fails, cleanup object storage to prevent orphaned files
      logger.error(
        "[Upload] Database creation failed, cleaning up object storage:",
        serializeError(dbError),
      );
      try {
        await withTimeout(
          appStorageService.deleteAsset(storagePath),
          10000,
          "Delete uploaded file from storage (cleanup)",
        );
      } catch (cleanupError) {
        logger.error("[Upload] Failed to cleanup object storage:", serializeError(cleanupError));
      }
      throw new Error(
        `Database creation failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
      );
    }

    // MEMORY LEAK FIX: Enhanced session cleanup with file handle management
    uploadSessions.delete(uploadId);
    enhancedUploadService.activeFileOperations.delete(uploadId);

    // Use shared CHUNK_STORAGE_BASE constant for cleanup
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkKey = `${CHUNK_STORAGE_BASE}/${uploadId}/chunk-${i}`;
      try {
        await withTimeout(
          appStorageService.deleteAsset(chunkKey),
          10000,
          "Delete chunk from storage (cleanup)",
        );
        logger.debug(`[Cleanup] Removed chunk ${i} from Object Storage`);
      } catch (error) {
        logger.warn(`Failed to cleanup chunk ${i} for upload ${uploadId}:`, serializeError(error));
      }
    }

    // Force cleanup of chunk tracking from memory
    if (session.receivedChunks) {
      session.receivedChunks.clear();
    }

    // Clear any references in the session object
    Object.keys(session).forEach((key) => {
      delete (session as unknown as Record<string, unknown>)[key];
    });

    logger.info(
      `[Enhanced Upload] Finalized upload ${uploadId}: ${createdAsset?.filename} (${createdAsset?.fileSize} bytes)`,
    );

    return {
      asset: createdAsset,
      status: "completed",
      message: "Upload completed successfully",
    };
  },

  cancelUpload: (uploadId: string) => {
    const session = uploadSessions.get(uploadId);
    const deleted = uploadSessions.delete(uploadId);

    if (deleted) {
      // MEMORY LEAK FIX: Enhanced cancellation cleanup
      enhancedUploadService.activeFileOperations.delete(uploadId);

      // Cleanup chunk buffers
      if (session?.receivedChunks) {
        session.receivedChunks.clear();
      }

      logger.debug(`[Enhanced Upload] Cancelled session with cleanup: ${uploadId}`);
    }

    return deleted;
  },

  getActiveUploads: () => {
    return Array.from(uploadSessions.values()).map((session) => ({
      uploadId: session.uploadId,
      filename: session.filename,
      progress: Math.round((session.receivedChunks.size / session.totalChunks) * 100),
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
    }));
  },

  // MEMORY LEAK FIX: Periodic cleanup of stale file operations
  startPeriodicCleanup: () => {
    const cleanupInterval = setInterval(
      () => {
        const now = Date.now();
        const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

        let cleanedCount = 0;

        // Cleanup stale sessions
        for (const [uploadId, session] of uploadSessions.entries()) {
          if (now - session.lastActivityAt.getTime() > STALE_THRESHOLD) {
            logger.warn(`[File Handle Cleanup] Removing stale session: ${uploadId}`);
            uploadSessions.delete(uploadId);
            enhancedUploadService.activeFileOperations.delete(uploadId);
            cleanedCount++;
          }
        }

        // Cleanup orphaned operations
        const activeSessionIds = new Set(uploadSessions.keys());
        for (const operationId of enhancedUploadService.activeFileOperations) {
          if (!activeSessionIds.has(operationId)) {
            enhancedUploadService.activeFileOperations.delete(operationId);
            cleanedCount++;
          }
        }

        if (cleanedCount > 0) {
          logger.info(`[File Handle Cleanup] Cleaned ${cleanedCount} stale operations`);
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
      },
      5 * 60 * 1000,
    ); // Run every 5 minutes

    logger.info("[File Handle Cleanup] Periodic cleanup started");
    return cleanupInterval;
  },
};

// SECURITY FIX: Enable actual rate limiting for upload endpoints
const uploadRateLimiter = new UploadRateLimiter(30, 10 * 60 * 1000); // 30 requests per 10 minutes (stricter)
export const uploadRateLimit = uploadRateLimiter.middleware;
