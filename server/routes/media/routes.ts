import express, { type Router } from "express";
import { createRateLimiter } from "../../middleware/rate-limiter.js";
import {
  batchGetContent,
  batchOperations,
  cancelUpload,
  clearAssetCache,
  deleteMediaAsset,
  finalizeUpload,
  getActiveUploads,
  getAnalytics,
  getCacheStats,
  getHealthScan,
  getMediaAssetById,
  getMediaAssets,
  getMediaContent,
  getMediaContentWithPath,
  getMediaCount,
  getMediaGeometry,
  getMediaProxy,
  getMediaRaw,
  getPerformanceDashboard,
  getPerformanceMetrics,
  getSystemStatus,
  getThumbnail,
  getThumbnailProxy,
  getUploadMetrics,
  getUploadProgress,
  initializeUpload,
  repairDatabaseIntegrity,
  repairMimeTypes,
  searchMediaAssets,
  testObjectStorageConnectivity,
  updateMediaAsset,
  uploadBase64,
  uploadChunk,
  uploadChunkRaw,
  uploadGltfPackage,
  uploadSingleFile,
} from "./handlers.js";
import {
  regularUpload,
  uploadOptimized,
  validateMagicNumbers,
} from "./middleware.js";
import {
  getRateLimiterHealth,
  getRateLimiterStats,
} from "./rate-limiter-handlers.js";
import { createErrorResponse } from "./utils.js";

const router: Router = express.Router();

// Rate limiter for bulk media queries - Phase 1, Block 1D
// DEVELOPMENT-FRIENDLY: High limits + localhost bypass to prevent false positives
// Admin media library makes many legitimate requests during upload/refresh
const bulkMediaLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 10000, // 10,000 in dev, 500 in prod
  message: "Too many media requests, please try again later",
  keyPrefix: "media",
  // Skip rate limiting for localhost connections (development)
  skip: (req: express.Request) => {
    const ip = req.ip || req.connection?.remoteAddress || '';
    const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip?.includes('localhost');
    return isLocalhost && process.env.NODE_ENV !== 'production';
  },
});

// Performance & monitoring
router.get("/performance-dashboard", getPerformanceDashboard);
router.get("/upload-metrics", getUploadMetrics);
router.get("/performance", getPerformanceMetrics);
router.get("/system-status", getSystemStatus);
router.get("/health-scan", getHealthScan);
router.get("/cache/stats", getCacheStats);

// Rate Limiter Monitoring (Development only)
router.get("/rate-limiter/stats", (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Export internal stats from the bulkMediaLimiter
  const limiterInfo = {
    config: {
      windowMs: 10 * 60 * 1000,
      max: process.env.NODE_ENV === 'production' ? 500 : 10000,
      keyPrefix: 'media',
    },
    description: 'Bulk media query rate limiter',
    localhostBypass: process.env.NODE_ENV !== 'production',
  };

  return res.json({
    success: true,
    data: {
      bulkMediaLimiter: limiterInfo,
      timestamp: new Date().toISOString(),
    }
  });
});

// FORENSIC INVESTIGATION - Phase 6: Rate limiter monitoring endpoints
router.get("/rate-limiter/stats", getRateLimiterStats);
router.get("/rate-limiter/health", getRateLimiterHealth);

// Core CRUD (non-parametric routes first)
router.get("/", bulkMediaLimiter, getMediaAssets);
router.get("/count", getMediaCount);
router.get("/search", searchMediaAssets);

// Batch operations (specific routes before parametric)
// Note: batchOperations handles both file uploads and JSON delete operations
// Conditional middleware: use JSON parser for JSON content-type, multer for multipart
router.post(
  "/batch",
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      return express.json()(req, res, next);
    } else if (contentType.includes("multipart/form-data")) {
      return uploadOptimized(req, res, next);
    } else {
      return res
        .status(400)
        .json(
          createErrorResponse(
            "Content-Type must be application/json or multipart/form-data",
          ),
        );
    }
  },
  (req, res, next) => {
    // Apply magic number validation only for multipart uploads
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      return validateMagicNumbers(req, res, next);
    }
    next();
  },
  batchOperations,
);
router.get("/batch/content", batchGetContent);

// Analytics
router.get("/analytics", getAnalytics);

// Cache management
router.post("/clear-cache/:id", clearAssetCache);

// Content delivery - CRITICAL: Specific routes BEFORE generic parametric routes
// Proxy routes (most specific first)
router.get("/proxy/:id/thumbnail", getThumbnailProxy);
router.get("/proxy/:id", getMediaProxy);

// Parametric routes (generic - must be AFTER specific routes)
router.get("/:id", getMediaAssetById);
router.patch("/:id", updateMediaAsset);
router.delete("/:id", deleteMediaAsset);
router.get("/:id/content", getMediaContent);
router.get("/:id/content/*path", getMediaContentWithPath);
router.get("/:id/geometry", getMediaGeometry);
router.get("/:id/raw", getMediaRaw);
router.get("/:id/thumbnail", getThumbnail);

// Debug & maintenance
router.get("/test/object-storage-connectivity", testObjectStorageConnectivity);
router.post("/debug/repair-database-integrity", repairDatabaseIntegrity);
router.post("/repair/mime-types", repairMimeTypes);

// Direct uploads (MUST be before parametric upload routes)
router.post(
  "/upload",
  regularUpload.single("file"),
  validateMagicNumbers,
  uploadSingleFile,
);
router.post("/upload-base64", uploadBase64);
router.post(
  "/upload-gltf-package",
  uploadOptimized,
  validateMagicNumbers,
  uploadGltfPackage,
);

// Chunked upload flow
router.post("/upload/init", initializeUpload);
router.post(
  "/upload/chunk",
  regularUpload.single("chunk"),
  validateMagicNumbers,
  uploadChunk,
);
router.post("/upload/chunk-raw", uploadChunkRaw);
router.post("/upload/finalize", express.json(), finalizeUpload);
router.get("/upload/progress/:uploadId", getUploadProgress);
router.delete("/upload/:uploadId", cancelUpload);
router.get("/upload/active", getActiveUploads);

export default router;
