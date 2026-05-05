/**
 * MEDIA UTILITIES
 * Business logic, data processing, and helper functions for media operations
 */

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffprobeStatic from "ffprobe-static";

// ffprobe-static exports either a string path or an object with a .path property depending on version
const ffprobePath =
  (ffprobeStatic as { path: string }).path ?? (ffprobeStatic as unknown as string);

import type { InsertMediaAsset, MediaAsset } from "@shared/index.js";
import { type ImageVariants, isImageFile, processImage } from "../../image-processor.js";
import { mediaRepository } from "../../lib/db/repositories/index.js";
import { getGLTFProcessor, isGLTFFile } from "../../lib/integrations/gltf-processor.js";
import { logger, serializeError } from "../../lib/monitoring/logger.js";
import { appStorageService } from "../../lib/storage/app-service.js";
import { correctMimeType } from "../../lib/utilities/core-utils.js";
import UPLOAD_CONFIG from "../../lib/utilities/upload-config.js";
import type { MediaMetadata, ValidationResult } from "./types.js";

const execFilePromise = promisify(execFile);

// ============================================================================
// STORAGE PATH UTILITIES (CDN-Ready Architecture)
// ============================================================================

import { cdn } from "../../config/environment.js";

// ============================================================================
// FILENAME SLUGIFICATION & NAMING CONVENTIONS
// ============================================================================

/**
 * STANDARDIZED OBJECT NAMING CONVENTIONS
 * =======================================
 *
 * All files follow this pattern: {timestamp}-{slugified-filename}.{ext}
 *
 * RULES:
 * 1. Timestamp prefix: 13-digit Unix timestamp (milliseconds since epoch)
 *    - Ensures uniqueness and chronological sorting
 *    - Example: 1728123456789
 *
 * 2. Slugified filename: Lowercase with hyphens
 *    - All lowercase letters (a-z)
 *    - Numbers (0-9) preserved
 *    - Spaces → hyphens (-)
 *    - Special characters → removed or converted to hyphens
 *    - Multiple consecutive hyphens → single hyphen
 *    - No leading/trailing hyphens
 *
 * 3. File extension: Preserved from original filename
 *    - Always lowercase
 *    - Kept as-is for compatibility
 *
 * EXAMPLES:
 *   Original: "Product Image 2024.jpg"
 *   Slugified: "1728123456789-product-image-2024.jpg"
 *
 *   Original: "Team_Jersey (Blue).png"
 *   Slugified: "1728123456790-team-jersey-blue.png"
 *
 *   Original: "3D Model - Final Version!.glb"
 *   Slugified: "1728123456791-3d-model-final-version.glb"
 *
 * BENEFITS:
 * - URL-safe and CDN-compatible
 * - Case-insensitive filesystem compatibility
 * - No encoding issues across platforms
 * - Improved SEO for public assets
 * - Consistent sorting and lookup
 * - No collision risk (timestamp prefix)
 *
 * PARTITION STRUCTURE:
 * Files are organized by type and month for efficient lookups:
 *   {partition}/media/{type}/{yyyy}/{mm}/{timestamp}-{slug}.{ext}
 *
 * Examples:
 *   public/media/images/2025/10/1728123456789-product-hero.jpg
 *   public/media/models/2025/10/1728123456790-jersey-3d.glb
 *   private/media/documents/2025/10/1728123456791-contract.pdf
 */

/**
 * Slugify a filename to ensure URL-safe, lowercase, hyphenated naming
 *
 * @param filename - Original filename (e.g., "Product Image 2024.jpg")
 * @returns Slugified filename (e.g., "product-image-2024.jpg")
 */
export function slugifyFilename(filename: string): string {
  // Split filename into name and extension
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex + 1) : "";

  // Slugify the name part
  let slug = name
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/[^\w\s-]/g, "") // Remove special characters (keep alphanumeric, spaces, hyphens)
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // If slug is empty after processing, use a fallback
  if (!slug) {
    slug = "file";
  }

  // Reconstruct filename with extension (also lowercase)
  return ext ? `${slug}.${ext.toLowerCase()}` : slug;
}

/**
 * CDN-READY STORAGE PARTITIONING
 *
 * Public Partition (public/media/...):
 *   - Product images, logos, marketing assets
 *   - CDN-cacheable with aggressive cache headers
 *   - Future: CloudFlare/Fastly/GCS CDN integration
 *   - Future: Signed URLs not required (public access)
 *
 * Private Partition (private/media/...):
 *   - User uploads, confidential documents
 *   - Access-controlled with authentication
 *   - Future: Signed URLs with expiry for secure access
 *   - Future: Private CDN with authentication
 *
 * Temp Partition (private/temp/uploads/...):
 *   - Chunked upload assembly
 *   - Auto-cleanup after 24h
 *   - Never exposed to CDN
 */

export type AssetVisibility = "public" | "private";

/**
 * Generates CDN-optimized storage path with public/private partitioning
 *
 * Format: {partition}/media/{type}/{yyyy}/{mm}/{timestamp}-{slugified-filename}.{ext}
 *
 * NAMING CONVENTION: All filenames are automatically slugified for consistency
 *   - Lowercase with hyphens (no spaces or special characters)
 *   - Timestamp prefix ensures uniqueness
 *   - Month-based partitioning for efficient lookups
 *
 * Examples:
 *   Input: "Product Image 2024.jpg"
 *   Output: "public/media/images/2025/10/1728123456789-product-image-2024.jpg"
 *
 *   Input: "Team_Jersey (Blue).png"
 *   Output: "public/media/images/2025/10/1728123456790-team-jersey-blue.png"
 *
 * @param fileType - Type of media (images, videos, models, documents, temp, thumbnails)
 * @param filename - Original filename (will be slugified automatically)
 * @param visibility - Asset visibility ('public' for CDN, 'private' for access-controlled)
 * @returns Organized storage path with CDN partition and slugified filename
 */
export function generateOrganizedStoragePath(
  fileType: "images" | "videos" | "models" | "documents" | "temp" | "thumbnails",
  filename: string,
  visibility: AssetVisibility = "public",
): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const timestamp = Date.now();

  // STANDARDIZED NAMING: Slugify filename for URL-safety and consistency
  const slugifiedFilename = slugifyFilename(filename);

  // CDN-ready partitioning: Separate public (CDN-cacheable) from private (access-controlled)
  // Future CDN integration: Configure CDN to only cache public/* paths
  if (cdn.partitioning.enabled) {
    const partition =
      visibility === "public"
        ? cdn.partitioning.publicPartition
        : cdn.partitioning.privatePartition;
    return `${partition}/media/${fileType}/${year}/${month}/${timestamp}-${slugifiedFilename}`;
  }

  // Fallback for legacy behavior (no partitioning, but still slugified)
  return `media/${fileType}/${year}/${month}/${timestamp}-${slugifiedFilename}`;
}

/**
 * Generates thumbnail cache path (prepared for future warm-cache optimization)
 *
 * Format: public/media/thumbnails/{yyyy}/{mm}/{assetId}.jpg
 *
 * CURRENT: Thumbnails generated dynamically on-demand via /api/media/thumbnail/:id
 * FUTURE: If analytics show repeated thumbnail requests, enable warm cache:
 *   1. Generate thumbnail on upload → store at this path
 *   2. Configure CDN to cache public/media/thumbnails/* with long TTL
 *   3. Update thumbnail URL generation to point to cached path
 *
 * @param assetId - Media asset database ID
 * @returns Thumbnail cache path (not currently used)
 */
export function generateThumbnailCachePath(assetId: number): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  // Always use public partition for thumbnails (CDN-cacheable)
  // Future CDN integration: Add Cache-Control: public, max-age=31536000
  return `${cdn.partitioning.publicPartition}/media/thumbnails/${year}/${month}/${assetId}.jpg`;
}

/**
 * Detects media type from MIME type
 * @param mimeType - File MIME type
 * @returns Media type category
 */
export function detectMediaType(mimeType: string): "images" | "videos" | "models" | "documents" {
  if (mimeType.startsWith("image/")) {
    return "images";
  }
  if (mimeType.startsWith("video/")) {
    return "videos";
  }
  if (mimeType.includes("gltf") || mimeType.includes("glb") || mimeType.startsWith("model/")) {
    return "models";
  }

  // All other files (PDFs, docs, etc.) go to documents
  return "documents";
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export const createPaginatedResponse = <T>(
  data: T[],
  meta: Record<string, unknown>,
  additionalMeta?: Record<string, unknown>,
) => ({
  success: true,
  data,
  meta,
  metadata: additionalMeta || meta,
});

export const createErrorResponse = (error: string, details?: Record<string, unknown>) => ({
  success: false,
  error,
  ...(details && { details }),
});

export const createSuccessResponse = <T>(data: T) => ({ success: true, data });

// ============================================================================
// BUFFER UTILITIES
// ============================================================================

export function toBuffer(x: unknown): Buffer | null {
  if (Buffer.isBuffer(x)) {
    return x;
  }
  if (ArrayBuffer.isView(x)) {
    return Buffer.from(x.buffer, x.byteOffset, x.byteLength);
  }
  if (x instanceof ArrayBuffer) {
    return Buffer.from(x);
  }
  if (
    typeof x === "object" &&
    x !== null &&
    "type" in x &&
    x.type === "Buffer" &&
    "data" in x &&
    Array.isArray(x.data)
  ) {
    return Buffer.from(x.data);
  }
  if (Array.isArray(x)) {
    if (x.length === 1 && Buffer.isBuffer(x[0])) {
      return x[0];
    }
    if (x.every((n) => typeof n === "number")) {
      return Buffer.from(x);
    }
    return null;
  }
  if (typeof x === "string") {
    return Buffer.from(x, "utf8");
  }
  return null;
}

// ============================================================================
// MEDIA URL RESOLVER
// ============================================================================

export const MediaUrlResolver = {
  generateConsistentUrl: (asset: Partial<MediaAsset>) => {
    if (!asset || !asset.url) {
      return null;
    }
    try {
      const cleanUrl = asset.url.replace(/\/+/g, "/").replace(/:\/([^/])/, "://$1");
      return cleanUrl;
    } catch {
      return asset.url;
    }
  },
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const enhancedValidation = {
  validateFilename: (filename: string) => {
    if (!filename || filename.length < 1 || filename.length > 255) {
      return false;
    }
    // biome-ignore lint/suspicious/noControlCharactersInRegex: validating dangerous chars
    const dangerousChars = /[/\\:*?"<>|\x00-\x1f]/;
    return !dangerousChars.test(filename);
  },

  validateFileType: (type: string) => {
    const validTypes = ["image", "video", "model", "document"];
    return validTypes.includes(type);
  },

  validateFileSize: (size: number, type?: string) => {
    if (size <= 0) {
      return false;
    }
    const limits = UPLOAD_CONFIG.fileSizeLimits;

    switch (type) {
      case "image":
        return size <= limits.IMAGE;
      case "video":
        return size <= limits.VIDEO;
      case "model":
        return size <= limits.MODEL;
      case "document":
        return size <= limits.DOCUMENT;
      default:
        return size <= limits.DEFAULT;
    }
  },

  validateMimeType: (mimeType: string, filename: string) => {
    if (!mimeType) {
      return false;
    }

    const allowedMimes = UPLOAD_CONFIG.allowedMimeTypes.regular;
    const isAllowedMime = allowedMimes.includes(mimeType);

    const extension = filename.toLowerCase().split(".").pop();
    const allowedExtensions = UPLOAD_CONFIG.allowedExtensions;
    const hasValidExtension = extension ? allowedExtensions.includes(`.${extension}`) : false;

    return isAllowedMime && hasValidExtension;
  },

  sanitizeAsset: (asset: MediaAsset) => {
    return {
      ...asset,
      filename: asset.filename?.replace(/[^a-zA-Z0-9._-]/g, "_") || asset.filename,
      originalName: asset.originalName?.replace(/[^a-zA-Z0-9._\-\s]/g, "_") || asset.originalName,
      altText: asset.altText?.substring(0, 500),
      caption: asset.caption?.substring(0, 1000),
    };
  },

  validateAsset: (asset: MediaAsset): ValidationResult => {
    const errors = [];

    if (!enhancedValidation.validateFilename(asset.filename)) {
      errors.push("Invalid filename");
    }

    if (!enhancedValidation.validateFileType(asset.type)) {
      errors.push("Invalid file type");
    }

    if (asset.fileSize && !enhancedValidation.validateFileSize(asset.fileSize, asset.type)) {
      errors.push("File size exceeds limits");
    }

    if (asset.mimeType && !enhancedValidation.validateMimeType(asset.mimeType, asset.filename)) {
      errors.push("Invalid MIME type for file extension");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// ============================================================================
// METADATA BUILDER
// ============================================================================

export function buildInsertMediaAsset(metadata: MediaMetadata): InsertMediaAsset {
  if (!metadata.mimeType) {
    throw new Error("CRITICAL: mimeType cannot be null or empty");
  }
  if (!metadata.filename) {
    throw new Error("CRITICAL: filename cannot be null or empty");
  }
  if (!metadata.type) {
    throw new Error("CRITICAL: type cannot be null or empty");
  }
  if (!metadata.url) {
    throw new Error("CRITICAL: url cannot be null or empty");
  }

  return {
    filename: metadata.filename,
    originalName: metadata.originalName || metadata.filename,
    fileSize: metadata.totalSize,
    size: metadata.totalSize,
    mimeType: metadata.mimeType,
    type: metadata.type,
    url: metadata.url,
    storagePath: metadata.storagePath || "",
    bucketName: metadata.bucketName || "",
    thumbnailUrl: null,
    altText: metadata.altText || null,
    caption: metadata.caption || null,
    metadata: undefined,
    isActive: true,
    folderId: metadata.folderId !== undefined ? metadata.folderId : null,
    tags: metadata.tags || null,
  };
}

interface FFProbeStream {
  codec_type: string;
  codec_name?: string;
  duration?: string;
  width?: number;
  height?: number;
}

interface FFProbeOutput {
  streams?: FFProbeStream[];
  format?: {
    duration?: string;
  };
}

/**
 * Extracts metadata from a video file using ffprobe
 *
 * @param buffer - Video file buffer
 * @returns Object containing duration, codec, and resolution
 */
export async function getVideoMetadata(buffer: Buffer): Promise<{
  duration: number | null;
  codec: string | null;
  resolution: string | null;
}> {
  const tempPath = path.join(os.tmpdir(), `video-metadata-${Date.now()}.tmp`);

  // Write buffer to temporary file for ffprobe to read
  await fs.writeFile(tempPath, buffer);

  const { stdout } = await execFilePromise(ffprobePath as string, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    "-show_format",
    tempPath,
  ]);

  const data = JSON.parse(stdout) as FFProbeOutput;
  const videoStream = data.streams?.find((s) => s.codec_type === "video");
  const format = data.format;

  return {
    duration: videoStream?.duration
      ? parseFloat(videoStream.duration)
      : format?.duration
        ? parseFloat(format.duration)
        : null,
    codec: videoStream?.codec_name || null,
    resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
  };
}

// ============================================================================
// FILE PROCESSING
// ============================================================================

export interface UploadOptions {
  tags?: string[];
  altText?: string | undefined;
  caption?: string | undefined;
  folderId?: number | null;
}

export async function processUploadedFile(
  file: Express.Multer.File,
  options: UploadOptions = {},
): Promise<MediaAsset> {
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
  // Format: {partition}/media/{type}/{yyyy}/{mm}/{timestamp}-{slugified-filename}.{ext}
  const mediaType = detectMediaType(correctedMime);
  storageKey = generateOrganizedStoragePath(mediaType, file.originalname);

  // Store in object storage
  await appStorageService.uploadAsset(storageKey, file.buffer);

  // STANDARDIZED NAMING: Store slugified filename to match storage path
  const slugifiedFilename = slugifyFilename(file.originalname);

  // Create metadata with bucket name and optional fields
  const metadata: MediaMetadata = {
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

      // Generate compressed responsive variants to fix 60-85s load times
      let imageVariants: ImageVariants | undefined;
      try {
        const { generateResponsiveVariants } = await import("../../image-processor.js");
        imageVariants = await generateResponsiveVariants(file.buffer, file.originalname);
        logger.info("Responsive variants generated (single upload)", {
          assetId: asset.id,
          variants: Object.keys(imageVariants),
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

      logger.info("Image metadata extracted", {
        assetId: asset.id,
        metadata: imageMetadata,
        hasVariants: !!imageVariants,
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

      logger.info("Video metadata extracted successfully", {
        assetId: asset.id,
        metadata: videoMetadata,
      });
    } catch (error) {
      logger.error("Video metadata extraction aborted:", serializeError(error));
      // Upload succeeds even if metadata extraction fails
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

        // Store basic GLTF processing info
        // Note: Full metadata extraction (vertexCount, triangleCount, etc.) requires GLTF-Transform analysis
        await storage.updateMediaAsset(asset.id, {
          thumbnailUrl: `/api/media/thumbnail/${asset.id}`,
          metadata: gltfMetadata,
        });

        logger.info("GLTF metadata extracted", {
          assetId: asset.id,
          metadata: gltfMetadata,
        });
      }
    } catch (error) {
      logger.error("GLTF processing failed:", serializeError(error));
      // Upload succeeds even if GLTF processing fails
    }
  }

  // Fetch the updated asset with metadata
  const updatedAsset = await storage.getMediaAsset(asset.id);

  logger.info("File upload completed successfully", {
    assetId: asset.id,
    filename: file.originalname,
    type: fileType,
    hasMetadata: !!updatedAsset?.metadata,
  });

  return updatedAsset || asset;
}
