import express, { type RequestHandler, type Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { jsonResponse, registry } from "../../lib/api/openapi-generator.js";
import { createRateLimiter } from "../../middleware/rateLimiter.js";
import { authService } from "../../services/auth-service.js";
import {
  batchGetContent,
  batchOperations,
  cancelUpload,
  clearMediaCache,
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
import { regularUpload, uploadOptimized, validateMagicNumbers } from "./middleware.js";
import { getRateLimiterHealth, getRateLimiterStats } from "./rate-limiter-handlers.js";
import {
  MediaChunkSchema,
  MediaFinalizeSchema,
  MediaIdParamSchema,
  MediaListQuerySchema,
  MediaUpdateSchema,
  MediaUploadInitSchema,
} from "./schemas.js";
import { createErrorResponse } from "./utils.js";

const router: Router = express.Router();

import { logger } from "../../lib/monitoring/logger.js";

router.use((req, _res, next) => {
  logger.info(`[Media Router Debug] Hit: ${req.method} ${req.url}`);
  next();
});

// OpenAPI Registration
registry.registerPath({
  method: "get",
  path: "/media",
  summary: "List media assets",
  description: "Retrieve a paginated list of media assets (images, videos, 3D models).",
  tags: ["Media"],
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
  ],
  responses: {
    200: jsonResponse(z.array(z.any()), "List of media assets"),
  },
});

registry.registerPath({
  method: "get",
  path: "/media/search",
  summary: "Search media assets",
  description: "Search for media assets by filename, original name, or tags.",
  tags: ["Media"],
  parameters: [
    {
      name: "q",
      in: "query",
      required: true,
      schema: { type: "string" },
      description: "Search query",
    },
  ],
  responses: {
    200: jsonResponse(z.array(z.any()), "Search results"),
  },
});

registry.registerPath({
  method: "get",
  path: "/media/{id}",
  summary: "Get media asset by ID",
  description: "Retrieve metadata for a specific media asset.",
  tags: ["Media"],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: {
    200: jsonResponse(z.any(), "Media asset metadata"),
    404: { description: "Media asset not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/media/upload",
  summary: "Upload single file",
  description: "Upload a single media file (image, video, or GLB). Admin role required.",
  tags: ["Media"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.any().describe("The file to upload"),
          }),
        },
      },
    },
  },
  responses: {
    201: jsonResponse(z.any(), "The uploaded media asset"),
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/media/{id}",
  summary: "Delete media asset",
  description:
    "Permanently delete a media asset and its associated files from storage. Admin role required.",
  tags: ["Media"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: {
    204: { description: "Media asset deleted successfully" },
    404: { description: "Media asset not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/media/performance-dashboard",
  summary: "Media performance dashboard",
  description:
    "Retrieve real-time performance metrics for the media subsystem (processing times, cache hit rates, etc.).",
  tags: ["Admin", "Media"],
  security: [{ sessionAuth: [] }],
  responses: {
    200: jsonResponse(z.any(), "Detailed performance metrics"),
    403: { description: "Admin access required" },
  },
});

// Rate limiter for bulk media queries - Phase 1, Block 1D
// DEVELOPMENT-FRIENDLY: High limits + localhost bypass to prevent false positives
// Admin media library makes many legitimate requests during upload/refresh
const bulkMediaLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === "production" ? 500 : 10000, // 10,000 in dev, 500 in prod
  message: "Too many media requests, please try again later",
  keyPrefix: "media",
  // Skip rate limiting for localhost connections (development)
  skip: (req: express.Request) => {
    const ip = req.ip || req.connection?.remoteAddress || "";
    const isLocalhost = ip === "::1" || ip === "127.0.0.1" || ip?.includes("localhost");
    return isLocalhost && process.env.NODE_ENV !== "production";
  },
});

// Performance & monitoring
router.get("/performance-dashboard", authService.requireAdmin, getPerformanceDashboard);
router.get("/upload-metrics", authService.requireAdmin, getUploadMetrics);
router.get("/performance", authService.requireAdmin, getPerformanceMetrics);
router.get("/system-status", authService.requireAdmin, getSystemStatus);
router.get("/health-scan", authService.requireAdmin, getHealthScan);
router.get("/cache/stats", authService.requireAdmin, getCacheStats);

// Rate Limiter Monitoring (Development only)
router.get("/media/rate-limiter/stats", (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  // Export internal stats from the bulkMediaLimiter
  const limiterInfo = {
    config: {
      windowMs: 10 * 60 * 1000,
      max: process.env.NODE_ENV === "production" ? 500 : 10000,
      keyPrefix: "media",
    },
    description: "Bulk media query rate limiter",
    localhostBypass: process.env.NODE_ENV !== "production",
  };

  return res.json({
    success: true,
    data: {
      bulkMediaLimiter: limiterInfo,
      timestamp: new Date().toISOString(),
    },
  });
});

// FORENSIC INVESTIGATION - Phase 6: Rate limiter monitoring endpoints
router.get("/rate-limiter/stats", authService.requireAdmin, getRateLimiterStats);
router.get("/rate-limiter/health", authService.requireAdmin, getRateLimiterHealth);

// Core CRUD (non-parametric routes first)
router.get(
  "/",
  bulkMediaLimiter,
  validateRequest({ query: MediaListQuerySchema }) as unknown as RequestHandler,
  getMediaAssets as unknown as RequestHandler,
);
router.get("/count", getMediaCount);
router.get(
  "/search",
  validateRequest({ query: MediaListQuerySchema }) as unknown as RequestHandler,
  searchMediaAssets as unknown as RequestHandler,
);

// Batch operations (specific routes before parametric)
// Note: batchOperations handles both file uploads and JSON delete operations
// Conditional middleware: use JSON parser for JSON content-type, multer for multipart
// prettier-ignore
router.post(
  "/batch",
  authService.requireAdmin,
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      return express.json()(req, res, next);
    } else if (contentType.includes("multipart/form-data")) {
      return uploadOptimized(req, res, next);
    } else {
      return res
        .status(400)
        .json(createErrorResponse("Content-Type must be application/json or multipart/form-data"));
    }
  },
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      return validateMagicNumbers(req, res, next);
    }
    next();
  },
  batchOperations,
);
// router.post("/batch", authService.requireAdmin, batchOperations); // Removed duplicate registration

router.get("/batch/content", batchGetContent);

// Analytics
router.get("/analytics", getAnalytics);

// Cache management
router.post("/clear-cache/:id", authService.requireAdmin, clearMediaCache);

// Content delivery - CRITICAL: Specific routes BEFORE generic parametric routes
// Proxy routes (most specific first)
router.get("/proxy/:id/thumbnail", getThumbnailProxy);
router.get("/proxy/:id", getMediaProxy);

// Parametric routes (generic - must be AFTER specific routes)
router.get(
  "/:id",
  validateRequest({ params: MediaIdParamSchema }) as unknown as RequestHandler,
  getMediaAssetById as unknown as RequestHandler,
);
router.patch(
  "/:id",
  authService.requireAdmin,
  validateRequest({
    params: MediaIdParamSchema,
    body: MediaUpdateSchema,
  }) as unknown as RequestHandler,
  updateMediaAsset as unknown as RequestHandler,
);
router.delete(
  "/:id",
  authService.requireAdmin,
  validateRequest({ params: MediaIdParamSchema }) as unknown as RequestHandler,
  deleteMediaAsset as unknown as RequestHandler,
);
router.get("/:id/content", getMediaContent);
router.get("/:id/content/*path", getMediaContentWithPath);
router.get("/:id/geometry", getMediaGeometry);
router.get("/:id/raw", getMediaRaw);
router.get("/:id/thumbnail", getThumbnail);

// Debug & maintenance
router.get(
  "/test/object-storage-connectivity",
  authService.requireAdmin,
  testObjectStorageConnectivity,
);
// prettier-ignore
router.post("/debug/repair-database-integrity", authService.requireAdmin, repairDatabaseIntegrity);
router.post("/repair/mime-types", authService.requireAdmin, repairMimeTypes);

// Direct uploads (MUST be before parametric upload routes)
import { optimizeImageMiddleware } from "../../lib/utilities/image-optimizer.js";

// prettier-ignore
router.post(
  "/upload",
  authService.requireAdmin,
  regularUpload.single("file"),
  optimizeImageMiddleware,
  validateMagicNumbers,
  uploadSingleFile,
);
router.post("/upload-base64", authService.requireAdmin, uploadBase64);
// prettier-ignore
router.post(
  "/upload-gltf-package",
  authService.requireAdmin,
  uploadOptimized,
  validateMagicNumbers,
  uploadGltfPackage,
);

// Chunked upload flow
router.post(
  "/upload/init",
  authService.requireAdmin,
  validateRequest({ body: MediaUploadInitSchema }),
  initializeUpload,
);
// prettier-ignore
router.post(
  "/upload/chunk",
  authService.requireAdmin,
  regularUpload.single("chunk"),
  validateRequest({ body: MediaChunkSchema }),
  validateMagicNumbers,
  uploadChunk,
);
router.post("/upload/chunk-raw", authService.requireAdmin, uploadChunkRaw);
// prettier-ignore
router.post(
  "/upload/finalize",
  authService.requireAdmin,
  express.json(),
  validateRequest({ body: MediaFinalizeSchema }),
  finalizeUpload,
);
router.get("/upload/progress/:uploadId", authService.requireAdmin, getUploadProgress);
router.delete("/upload/:uploadId", authService.requireAdmin, cancelUpload);
router.get("/upload/active", authService.requireAdmin, getActiveUploads);

export default router;
