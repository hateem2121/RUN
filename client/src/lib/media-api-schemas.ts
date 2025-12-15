import { z } from 'zod';
import type { MediaAsset } from '@shared/schema';
import { validateMediaAsset, validateApiResponse, filterValidMediaAssets, monitorSchemaDrift } from '../../../utils/schema-validator';
// Removed server-side import that was causing build failures
// REMOVED: Dead import - replaced with browser-safe fallback

// Re-export the comprehensive schema validator for backward compatibility
export { validateMediaAsset, filterValidMediaAssets } from '../../../utils/schema-validator';

// Browser-safe logging fallback (since we can't import server-side replit-monitor)
const logSchemaError = (data: unknown, validationErrors: string[], context: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'high') => {
  console.error(`[Schema Error] ${context}:`, {
    errors: validationErrors,
    data: JSON.stringify(data).slice(0, 200),
    severity
  });
};

// Base MediaAsset schema - now using the comprehensive validator
export const MediaAssetSchema = z.object({
  id: z.number(),
  filename: z.string(),
  originalName: z.string(),
  size: z.number(),
  type: z.string(),
  mimeType: z.string(),
  url: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).default({}),
  uploadedAt: z.string().nullable().transform(val => val ? new Date(val) : null).optional(),
  createdAt: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  updatedAt: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  isActive: z.boolean().optional(),
  isOptimized: z.boolean().optional(),
  variantCount: z.number().optional(),
  lastOptimized: z.union([z.string(), z.date()]).transform(val => new Date(val)).optional(),
  folderId: z.number().optional(),
  folderPath: z.string().nullable().optional(),
  width: z.number(),
  height: z.number(),
  thumbnailFilename: z.string().default(""),
  altText: z.string().default(""),
  securityScanResult: z.union([
    z.string(),
    z.object({
      isSafe: z.boolean(),
      threats: z.array(z.string()),
      confidence: z.number()
    })
  ]).nullable(),
  blurhash: z.string().default(""),
  thumbnailKey: z.string().nullable().optional(),
});

// Pagination schema with safe defaults including hasMore for infinite scroll
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20), // Aligned with server validation
  total: z.number().min(0).default(0),
  totalPages: z.number().min(1).default(1),
  hasMore: z.boolean().default(false), // Essential for infinite scroll
});

// Media API response schemas
export const MediaListResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.object({
    data: z.array(MediaAssetSchema).default([]),
    pagination: PaginationSchema
  })
});

export const MediaSingleResponseSchema = z.object({
  success: z.boolean().default(true),
  data: MediaAssetSchema
});

export const MediaUploadResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.array(MediaAssetSchema).default([])
});

export const MediaBatchResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.object({
    results: z.array(MediaAssetSchema).default([]),
    errors: z.array(z.object({
      id: z.number(),
      error: z.string()
    })).default([])
  })
});

export const MediaDeleteResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional()
});

// Enhanced Validation helpers with comprehensive error tracking
export class MediaApiValidator {
  /**
   * Validate and sanitize media list response with schema drift monitoring
   */
  static validateMediaList(data: unknown): z.infer<typeof MediaListResponseSchema> {
    try {
      // First validate API response structure
      const apiValidation = validateApiResponse(data);
      if (!apiValidation.isValid) {
        logSchemaError(data, apiValidation.errors || [], 'MediaList API Response', 'high');
      }

      const result = MediaListResponseSchema.parse(data);
      
      // Monitor schema drift on the media assets
      if (result.data.data && Array.isArray(result.data.data)) {
        monitorSchemaDrift(result.data.data, 'MediaList Assets');
      }
      
      return result;
    } catch (error) {
      logSchemaError(data, [error instanceof Error ? error.message : 'Unknown error'], 'MediaList Validation', 'high');
      
      return {
        success: true,
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
            hasMore: false
          }
        }
      };
    }
  }

  /**
   * Validate and sanitize single media response with comprehensive validation
   */
  static validateMediaSingle(data: unknown): z.infer<typeof MediaSingleResponseSchema> | null {
    try {
      const result = MediaSingleResponseSchema.parse(data);
      
      // Validate the media asset with comprehensive validator
      const assetValidation = validateMediaAsset(result.data);
      if (!assetValidation.isValid) {
        logSchemaError(result.data, assetValidation.errors || [], 'Single Media Asset', 'medium');
      }
      
      return result;
    } catch (error) {
      logSchemaError(data, [error instanceof Error ? error.message : 'Unknown error'], 'Single Media Validation', 'medium');
      return null;
    }
  }

  /**
   * Validate and sanitize media upload response with error tracking
   */
  static validateMediaUpload(data: unknown): z.infer<typeof MediaUploadResponseSchema> {
    try {
      const result = MediaUploadResponseSchema.parse(data);
      
      // Validate each uploaded asset
      if (result.data && Array.isArray(result.data)) {
        const validatedAssets = filterValidMediaAssets(result.data);
        if (validatedAssets.length !== result.data.length) {
          logSchemaError(
            result.data, 
            [`${result.data.length - validatedAssets.length} invalid assets in upload response`], 
            'Upload Response Validation', 
            'high'
          );
        }
      }
      
      return result;
    } catch (error) {
      logSchemaError(data, [error instanceof Error ? error.message : 'Unknown error'], 'Upload Response Validation', 'high');
      return {
        success: false,
        data: []
      };
    }
  }

  /**
   * Validate and sanitize media batch response with comprehensive tracking
   */
  static validateMediaBatch(data: unknown): z.infer<typeof MediaBatchResponseSchema> {
    try {
      const result = MediaBatchResponseSchema.parse(data);
      
      // Validate results with comprehensive validator
      if (result.data.results && Array.isArray(result.data.results)) {
        const validatedResults = filterValidMediaAssets(result.data.results);
        if (validatedResults.length !== result.data.results.length) {
          logSchemaError(
            result.data.results,
            [`${result.data.results.length - validatedResults.length} invalid assets in batch response`],
            'Batch Response Validation',
            'medium'
          );
        }
      }
      
      return result;
    } catch (error) {
      logSchemaError(data, [error instanceof Error ? error.message : 'Unknown error'], 'Batch Response Validation', 'medium');
      return {
        success: true,
        data: {
          results: [],
          errors: []
        }
      };
    }
  }

  /**
   * Validate and sanitize media delete response
   */
  static validateMediaDelete(data: unknown): z.infer<typeof MediaDeleteResponseSchema> {
    try {
      return MediaDeleteResponseSchema.parse(data);
    } catch (error) {
      logSchemaError(data, [error instanceof Error ? error.message : 'Unknown error'], 'Delete Response Validation', 'low');
      return {
        success: false,
        message: 'Delete validation failed'
      };
    }
  }

  /**
   * Validate individual media asset using comprehensive validator
   */
  static validateMediaAsset(data: unknown): z.infer<typeof MediaAssetSchema> | null {
    const result = validateMediaAsset(data);
    if (result.isValid && result.data) {
      // Ensure compatibility with local schema by transforming the data
      return MediaAssetSchema.parse(result.data);
    }
    return null;
  }

  /**
   * Sanitize array of media assets using comprehensive validator
   */
  static sanitizeMediaAssets(data: unknown[]): z.infer<typeof MediaAssetSchema>[] {
    if (!Array.isArray(data)) {
      logSchemaError(data, ['Expected array for media assets'], 'Asset Array Validation', 'medium');
      return [];
    }

    const validatedAssets = filterValidMediaAssets(data);
    // Transform to local schema format for type compatibility
    return validatedAssets.map(asset => MediaAssetSchema.parse(asset));
  }
}

// Re-export canonical MediaAsset type from shared schema
export type { MediaAsset };

// Type exports for use across the application
export type MediaListResponse = z.infer<typeof MediaListResponseSchema>;
export type MediaSingleResponse = z.infer<typeof MediaSingleResponseSchema>;
export type MediaUploadResponse = z.infer<typeof MediaUploadResponseSchema>;
export type MediaBatchResponse = z.infer<typeof MediaBatchResponseSchema>;
export type MediaDeleteResponse = z.infer<typeof MediaDeleteResponseSchema>;