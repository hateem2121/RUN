/**
 * CHUNK UPLOAD CONFIGURATION
 *
 * Single source of truth for chunk storage paths.
 * This file is imported by both handlers.ts and services.ts to ensure
 * upload and finalization use identical paths (prevents circular dependency).
 */

/**
 * Base path for temporary chunk storage in object storage.
 * All chunk uploads and downloads MUST use this exact path.
 *
 * Format: {partition}/temp/uploads/{uploadId}/chunk-{index}
 * Example: private/temp/uploads/1760277958482-p28v0wru4/chunk-0
 */
export const CHUNK_STORAGE_BASE = "private/temp/uploads";

/**
 * Visibility flag for chunk storage.
 * Must match the partition prefix (private = false, public = true).
 *
 * CRITICAL: Chunks are temporary and should NEVER be CDN-accessible.
 * Always use private partition (isPublic: false) for chunk storage.
 */
export const CHUNK_STORAGE_IS_PUBLIC = false;
