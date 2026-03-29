/**
 * MEDIA TYPES & SCHEMAS
 * All TypeScript interfaces, Zod schemas, and type definitions for media routes
 */

import { z } from "zod";
import type { InsertMediaAsset, MediaAsset } from "../../../shared/index.js";

// Re-export shared types
export type { MediaAsset, InsertMediaAsset };

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Base query parameters schema
export const baseQueryParamsSchema = z.object({
  // Pagination with strict validation
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),

  // Search and filtering
  search: z.string().max(500).optional(),
  type: z.string().optional(),
  folderId: z.coerce.number().int().positive().optional(),
  tags: z.string().max(1000).optional(),

  // Date range filtering
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // Size range filtering (in bytes)
  minSize: z.coerce.number().int().min(0).optional(),
  maxSize: z.coerce.number().int().min(0).optional(),

  // Sorting
  sortBy: z
    .enum(["uploadedAt", "filename", "size", "type", "name", "createdAt"])
    .default("uploadedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Performance options
  includeAnalytics: z.coerce.boolean().default(false),
  all: z.coerce.boolean().default(false),
});

export type MediaQueryParams = z.infer<typeof baseQueryParamsSchema>;

// ============================================================================
// UPLOAD TYPES & INTERFACES
// ============================================================================

// Upload optimization constants
export const UPLOAD_OPTIMIZATION = {
  MEMORY_THRESHOLD: 16 * 1024 * 1024, // 16MB
  MAX_BATCH_MEMORY: 100 * 1024 * 1024, // 100MB
};

// Upload metrics tracking
export interface UploadMetrics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageUploadTime: number;
  concurrentUploads: number;
  queuedUploads: number;
}

// Upload result interface
export interface UploadResult {
  success: boolean;
  asset?: MediaAsset;
  error?: string | undefined;
  filename?: string | undefined;
}

// Batch upload result
export interface BatchUploadResult {
  success: boolean;
  results: UploadResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | undefined;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface MediaMetadata {
  filename: string;
  originalName?: string | undefined;
  totalSize: number;
  mimeType: string;
  type: string;
  url: string;
  storagePath?: string | undefined;
  bucketName?: string | undefined;
  tags?: string[];
  altText?: string | undefined;
  caption?: string | undefined;
  folderId?: number | null;
}

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
