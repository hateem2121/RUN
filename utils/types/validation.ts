/**
 * Shared Validation Type Definitions
 *
 * Consolidated validation interfaces to prevent duplicate identifier conflicts.
 * Each interface serves a specific validation context with clear naming.
 */

import type { MediaAsset } from "../../shared/index.js";

/**
 * Schema Validation Result
 * Used for runtime schema validation of API responses and data structures
 *
 * @example
 * const result = validateMediaAsset(apiData);
 * if (result.isValid && result.data) {
 *   // Use validated data
 * }
 */
export interface SchemaValidationResult {
  isValid: boolean;
  data?: MediaAsset;
  errors?: string[];
  warnings?: string[];
}

/**
 * Media File Validation Result
 * Used for validating uploaded media files (images, videos, models)
 * Includes file-specific metadata like size and MIME type
 *
 * @example
 * const result = MediaValidator.validateAsset(file);
 * if (result.isValid) {
 *   console.log(`File size: ${result.fileSize}, type: ${result.mimeType}`);
 * }
 */
export interface MediaFileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileSize: number;
  mimeType: string;
}

/**
 * Batch Media File Validation Result
 * Used when validating multiple media files in a single operation
 */
export interface BatchMediaFileValidationResult {
  validAssets: number;
  invalidAssets: number;
  totalProcessed: number;
  validationReport: MediaFileValidationResult[];
}
