import type { Request, Response } from "express";
import type { z } from "zod";
import { BadRequestError } from "../../lib/errors.js";
import { safeSerialize, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { mediaService } from "../../services/media.service.js";
import type { MediaListQuerySchema } from "./schemas.js";
import { createPaginatedResponse, createSuccessResponse } from "./utils.js";

type MediaListQuery = z.infer<typeof MediaListQuerySchema>;

/**
 * MEDIA HANDLERS
 *
 * Express handlers for Media operations.
 * Refactored to "Thin Controller" pattern: delegates all domain logic to mediaService.
 * Enforces RFC 9110/9457 compliance via native Express 5 error propagation.
 */

// ============================================================================
// QUERY & LISTING HANDLERS
// ============================================================================

export async function getMediaAssets(
  req: Request<Record<string, string>, unknown, unknown, MediaListQuery>,
  res: Response,
) {
  const { page, limit, type, search, folderId } = req.query;

  if (shouldBypassCache(req)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  } else {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }

  const result = await mediaService.getAssets(Number(limit), (Number(page) - 1) * Number(limit), {
    type: type as string,
    search: search as string,
    folderId: folderId ? Number(folderId) : undefined,
  });

  if (result.isErr()) throw result.error;

  const { assets, total } = result.value;

  return res.json(
    safeSerialize(
      createPaginatedResponse(assets, {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      }),
    ),
  );
}

export async function getMediaAssetById(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);

  if (shouldBypassCache(req)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  } else {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }

  const result = await mediaService.getAssetById(id);
  if (result.isErr()) throw result.error;

  return res.json(createSuccessResponse(result.value));
}

export async function getMediaCount(req: Request, res: Response) {
  const { type } = req.query as { type?: string };
  const folderId = req.query.folderId ? parseInt(req.query.folderId as string, 10) : undefined;

  const result = await mediaService.getMediaCount({ type, folderId });
  if (result.isErr()) throw result.error;

  return res.json(createSuccessResponse({ count: result.value }));
}

export async function searchMediaAssets(
  req: Request<Record<string, string>, unknown, unknown, MediaListQuery>,
  res: Response,
) {
  const { search, type, limit, folderId } = req.query;

  const result = await mediaService.searchAssets(search || "", Number(limit), {
    type: type as string,
    folderId,
  });

  if (result.isErr()) throw result.error;

  return res.json(createSuccessResponse(result.value));
}

// ============================================================================
// CRUD HANDLERS
// ============================================================================

export async function updateMediaAsset(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = req.body;

  const result = await mediaService.updateAsset(id, data);
  if (result.isErr()) throw result.error;

  return res.json(createSuccessResponse(result.value));
}

export async function deleteMediaAsset(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);

  const result = await mediaService.deleteAsset(id);
  if (result.isErr()) throw result.error;

  return res.json(createSuccessResponse({ deleted: true }));
}

// ============================================================================
// UPLOAD HANDLERS
// ============================================================================

export async function initializeUpload(req: Request, res: Response) {
  const { filename, fileSize, mimeType, originalName } = req.body;

  const result = await mediaService.initializeUpload(
    filename,
    fileSize,
    mimeType,
    originalName || filename,
  );

  if (result.isErr()) throw result.error;

  return res.status(201).json(createSuccessResponse(result.value));
}

export async function uploadChunk(req: Request, res: Response) {
  const { uploadId, chunkNumber } = req.body;
  const file = req.file;

  if (!file) {
    throw new BadRequestError("No file provided");
  }

  const result = await mediaService.uploadChunk(uploadId, parseInt(chunkNumber, 10), file.buffer);

  if (result.isErr()) throw result.error;

  return res.status(201).json(createSuccessResponse(result.value));
}

export async function finalizeUpload(req: Request, res: Response) {
  const { uploadId } = req.body;

  const result = await mediaService.finalizeUpload(uploadId);
  if (result.isErr()) throw result.error;

  return res.status(201).json(createSuccessResponse(result.value));
}

export async function uploadSingleFile(req: Request, res: Response) {
  if (!req.file) throw new BadRequestError("No file provided");

  const result = await mediaService.uploadSingleFile(req.file, req.body);
  if (result.isErr()) throw result.error;

  return res.status(201).json(createSuccessResponse(result.value));
}

export async function uploadBase64(req: Request, res: Response) {
  const { filename, base64Data } = req.body;
  const result = await mediaService.uploadBase64(base64Data, filename);
  if (result.isErr()) throw result.error;
  return res.status(201).json(createSuccessResponse(result.value));
}

export async function uploadGltfPackage(_req: Request, res: Response) {
  const result = await mediaService.uploadGltfPackage();
  if (result.isErr()) throw result.error;
  return res.status(201).json(createSuccessResponse(result.value));
}

export async function uploadChunkRaw(req: Request, res: Response) {
  const { "x-upload-id": uploadId, "x-chunk-index": chunkIndex } = req.headers;
  const result = await mediaService.uploadChunkRaw(
    String(uploadId),
    parseInt(String(chunkIndex), 10),
    req.body,
  );
  if (result.isErr()) throw result.error;
  return res.status(201).json(createSuccessResponse(result.value));
}

// ============================================================================
// CONTENT DELIVERY HANDLERS
// ============================================================================

export async function getMediaContent(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const { variant } = req.query as { variant?: string };

  const result = await mediaService.getSignedUrl(Number(id), 300, variant as any);
  if (result.isErr()) throw result.error;

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Cache-Control", "public, max-age=300");

  return res.redirect(302, result.value);
}

export async function getThumbnail(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const result = await mediaService.getThumbnailUrl(Number(id));
  if (result.isErr()) throw result.error;

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Cache-Control", "public, max-age=300");

  return res.redirect(302, result.value);
}

export async function getMediaContentWithPath(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  return res.redirect(`/api/media/${id}/content`);
}

export async function getMediaGeometry(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const result = await mediaService.getMediaGeometry(Number(id));
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getMediaRaw(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const result = await mediaService.getMediaRaw(Number(id));
  if (result.isErr()) throw result.error;
  return res.redirect(302, result.value);
}

export async function getMediaProxy(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const result = await mediaService.getMediaProxy(Number(id));
  if (result.isErr()) throw result.error;
  return res.redirect(302, result.value);
}

export async function getThumbnailProxy(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const result = await mediaService.getThumbnailProxy(Number(id));
  if (result.isErr()) throw result.error;
  return res.redirect(302, result.value);
}

// ============================================================================
// BATCH OPERATION HANDLERS
// ============================================================================

export async function batchOperations(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[];
  if (files && files.length > 0) {
    const result = await mediaService.batchCreateAssets(files);
    if (result.isErr()) throw result.error;
    return res.status(201).json(createSuccessResponse(result.value));
  }

  const { operation, ids } = req.body;
  if (operation === "delete" && ids) {
    const result = await mediaService.batchDeleteAssets(ids);
    if (result.isErr()) throw result.error;
    return res.json(createSuccessResponse(result.value));
  }

  throw new BadRequestError("Invalid batch operation");
}

export async function batchGetContent(req: Request, res: Response) {
  const { ids } = req.query as { ids?: string };
  if (!ids) throw new BadRequestError("No IDs provided");

  const idList = ids.split(",");
  const result = await mediaService.getMediaAssetsByIds(idList);
  if (result.isErr()) throw result.error;

  return res.json(createSuccessResponse(result.value));
}

// ============================================================================
// ANALYTICS & MONITORING HANDLERS
// ============================================================================

export async function getAnalytics(_req: Request, res: Response) {
  const result = await mediaService.getAnalytics();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getUploadMetrics(_req: Request, res: Response) {
  const result = mediaService.getUploadMetrics();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getCacheStats(_req: Request, res: Response) {
  const result = await mediaService.getCacheStats();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getPerformanceDashboard(_req: Request, res: Response) {
  const result = await mediaService.getPerformanceDashboard();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getPerformanceMetrics(_req: Request, res: Response) {
  const result = await mediaService.getPerformanceMetrics();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getSystemStatus(_req: Request, res: Response) {
  const result = await mediaService.getSystemStatus();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getHealthScan(_req: Request, res: Response) {
  const result = await mediaService.getHealthScan();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getUploadProgress(req: Request, res: Response) {
  const { uploadId } = req.params;
  const result = mediaService.getUploadProgress(uploadId as string);
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function getActiveUploads(_req: Request, res: Response) {
  const uploads = mediaService.getActiveUploads();
  return res.json(createSuccessResponse(uploads));
}

export async function cancelUpload(req: Request, res: Response) {
  const { uploadId } = req.params;
  const result = mediaService.cancelUpload(uploadId as string);
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse({ deleted: true }));
}

// ============================================================================
// UTILITY & MAINTENANCE HANDLERS
// ============================================================================

export async function clearMediaCache(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const result = await mediaService.clearCache(Number(id));
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse({ cleared: true }));
}

export async function testObjectStorageConnectivity(_req: Request, res: Response) {
  const result = await mediaService.testObjectStorageConnectivity();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse({ connectivity: "OK" }));
}

export async function repairDatabaseIntegrity(_req: Request, res: Response) {
  const result = await mediaService.repairDatabaseIntegrity();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

export async function repairMimeTypes(_req: Request, res: Response) {
  const result = await mediaService.repairMimeTypes();
  if (result.isErr()) throw result.error;
  return res.json(createSuccessResponse(result.value));
}

/**
 * Legacy support for fetching all media assets
 * Note: Use getMediaAssets with pagination for production
 */
export async function getAllMediaAssets() {
  const result = await mediaService.getAllAssets();
  return result;
}
