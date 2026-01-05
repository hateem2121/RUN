/**
 * MEDIA MIDDLEWARE
 * Multer configuration, rate limiting, and request validators for media routes
 */

import multer from "multer";
import UPLOAD_CONFIG from "../../lib/utilities/upload-config.js";
import { UploadRateLimiter } from "../../middleware/rateLimiter.js";
import {
  MAX_CONCURRENT_UPLOADS,
  MAX_FILES,
  uploadOptimized as multerUploadOptimized,
  validateMagicNumbers,
} from "../../multer-optimized.js";

// ============================================================================
// UPLOAD MIDDLEWARE
// ============================================================================

// Enhanced multer configuration with 50-file support
export const uploadOptimized = multerUploadOptimized;

// Magic number validation middleware for security
export { validateMagicNumbers };

// Regular upload middleware (single/small batches)
export const regularUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_CONFIG.fileSizeLimits.DEFAULT,
    files: 10, // Regular upload limit
  },
});

// ============================================================================
// RATE LIMITING
// ============================================================================

// UploadRateLimiter instance for rate limiting uploads
export const uploadRateLimiter = new UploadRateLimiter(100); // Max 100 requests per window

// ============================================================================
// UPLOAD OPTIMIZATION CONSTANTS
// ============================================================================

export const UPLOAD_CONSTANTS = {
  MAX_FILES,
  MAX_CONCURRENT_UPLOADS,
  MEMORY_THRESHOLD: 16 * 1024 * 1024, // 16MB
  MAX_BATCH_MEMORY: 100 * 1024 * 1024, // 100MB
};

// ============================================================================
// BACKEND UPLOAD MANAGER
// ============================================================================

export class BackendUploadManager {
  private activeUploads = new Set<string>();
  private maxConcurrent = MAX_CONCURRENT_UPLOADS;

  canStartUpload(): boolean {
    return this.activeUploads.size < this.maxConcurrent;
  }

  startUpload(uploadId: string): void {
    this.activeUploads.add(uploadId);
  }

  finishUpload(uploadId: string): void {
    this.activeUploads.delete(uploadId);
  }

  getActiveCount(): number {
    return this.activeUploads.size;
  }

  getMetrics() {
    return {
      activeUploads: this.activeUploads.size,
      maxConcurrent: this.maxConcurrent,
      availableSlots: this.maxConcurrent - this.activeUploads.size,
    };
  }
}

export const backendUploadManager = new BackendUploadManager();

// ============================================================================
// UPLOAD METRICS TRACKER
// ============================================================================

export const uploadMetrics = {
  totalUploads: 0,
  successfulUploads: 0,
  failedUploads: 0,
  averageUploadTime: 0,
  concurrentUploads: 0,
  queuedUploads: 0,

  recordUpload(success: boolean, duration: number) {
    this.totalUploads++;
    if (success) {
      this.successfulUploads++;
    } else {
      this.failedUploads++;
    }

    // Update average upload time
    this.averageUploadTime =
      (this.averageUploadTime * (this.totalUploads - 1) + duration) / this.totalUploads;
  },

  updateConcurrent(count: number) {
    this.concurrentUploads = count;
  },

  reset() {
    this.totalUploads = 0;
    this.successfulUploads = 0;
    this.failedUploads = 0;
    this.averageUploadTime = 0;
    this.concurrentUploads = 0;
    this.queuedUploads = 0;
  },
};
