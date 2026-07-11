/**
 * MEDIA TYPES & SCHEMAS
 * All TypeScript interfaces, Zod schemas, and type definitions for media routes
 */

import type { baseQueryParamsSchema, MediaAsset } from "@run-remix/shared";
import type { z } from "zod";

// Re-export shared types
/** @public */ export type MediaQueryParams = z.infer<typeof baseQueryParamsSchema>;

// ============================================================================
// UPLOAD TYPES & INTERFACES
// ============================================================================

// Upload optimization constants
/** @public */ export const UPLOAD_OPTIMIZATION = {
  MEMORY_THRESHOLD: 16 * 1024 * 1024, // 16MB
  MAX_BATCH_MEMORY: 100 * 1024 * 1024, // 100MB
};

// Upload metrics tracking
/** @public */ export interface UploadMetrics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageUploadTime: number;
  concurrentUploads: number;
  queuedUploads: number;
}

// Upload result interface
interface UploadResult {
  success: boolean;
  asset?: MediaAsset;
  error?: string | undefined;
  filename?: string | undefined;
}

// Batch upload result
/** @public */ export interface BatchUploadResult {
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

/** @public */ export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | undefined;
  details?: Record<string, unknown>;
}

/** @public */ export interface PaginatedResponse<T = unknown> {
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
  metadata?: Record<string, unknown>;
}

/** @public */ export interface UploadSession {
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
