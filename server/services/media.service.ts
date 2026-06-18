import { mediaContentService } from "./media-content.service.js";
import { mediaQueryService } from "./media-query.service.js";
import { mediaUploadService } from "./media-upload.service.js";

/**
 * Facade service for the Media domain.
 * Coordinates between Query, Upload, and Content sub-services.
 * Adheres to SRP (Single Responsibility Principle) by delegating to specialized services.
 *
 * Refactored to use explicit methods instead of bound property initializers
 * to avoid initialization order issues and circular dependencies.
 */
class MediaService {
  // Query methods
  getAssets = (...args: Parameters<typeof mediaQueryService.getAssets>) =>
    mediaQueryService.getAssets(...args);
  getAssetById = (...args: Parameters<typeof mediaQueryService.getAssetById>) =>
    mediaQueryService.getAssetById(...args);
  getAllAssets = (...args: Parameters<typeof mediaQueryService.getAllAssets>) =>
    mediaQueryService.getAllAssets(...args);
  getMediaCount = (...args: Parameters<typeof mediaQueryService.getMediaCount>) =>
    mediaQueryService.getMediaCount(...args);
  updateAsset = (...args: Parameters<typeof mediaQueryService.updateAsset>) =>
    mediaQueryService.updateAsset(...args);
  deleteAsset = (...args: Parameters<typeof mediaQueryService.deleteAsset>) =>
    mediaQueryService.deleteAsset(...args);
  searchAssets = (...args: Parameters<typeof mediaQueryService.searchAssets>) =>
    mediaQueryService.searchAssets(...args);
  getMediaAssetsByIds = (...args: Parameters<typeof mediaQueryService.getMediaAssetsByIds>) =>
    mediaQueryService.getMediaAssetsByIds(...args);
  getAnalytics = (...args: Parameters<typeof mediaQueryService.getAnalytics>) =>
    mediaQueryService.getAnalytics(...args);
  getCacheStats = (...args: Parameters<typeof mediaQueryService.getCacheStats>) =>
    mediaQueryService.getCacheStats(...args);
  getHealthScan = (...args: Parameters<typeof mediaQueryService.getHealthScan>) =>
    mediaQueryService.getHealthScan(...args);
  repairDatabaseIntegrity = (
    ...args: Parameters<typeof mediaQueryService.repairDatabaseIntegrity>
  ) => mediaQueryService.repairDatabaseIntegrity(...args);
  repairMimeTypes = (...args: Parameters<typeof mediaQueryService.repairMimeTypes>) =>
    mediaQueryService.repairMimeTypes(...args);
  clearCache = (...args: Parameters<typeof mediaQueryService.clearCache>) =>
    mediaQueryService.clearCache(...args);

  // Upload methods
  initializeUpload = (...args: Parameters<typeof mediaUploadService.initializeUpload>) =>
    mediaUploadService.initializeUpload(...args);
  uploadChunk = (...args: Parameters<typeof mediaUploadService.uploadChunk>) =>
    mediaUploadService.uploadChunk(...args);
  finalizeUpload = (...args: Parameters<typeof mediaUploadService.finalizeUpload>) =>
    mediaUploadService.finalizeUpload(...args);
  getUploadProgress = (...args: Parameters<typeof mediaUploadService.getUploadProgress>) =>
    mediaUploadService.getUploadProgress(...args);
  cancelUpload = (...args: Parameters<typeof mediaUploadService.cancelUpload>) =>
    mediaUploadService.cancelUpload(...args);
  getActiveUploads = (...args: Parameters<typeof mediaUploadService.getActiveUploads>) =>
    mediaUploadService.getActiveUploads(...args);
  uploadSingleFile = (...args: Parameters<typeof mediaUploadService.uploadSingleFile>) =>
    mediaUploadService.uploadSingleFile(...args);
  batchDeleteAssets = (...args: Parameters<typeof mediaUploadService.batchDeleteAssets>) =>
    mediaUploadService.batchDeleteAssets(...args);
  batchCreateAssets = (...args: Parameters<typeof mediaUploadService.batchCreateAssets>) =>
    mediaUploadService.batchCreateAssets(...args);
  uploadBase64 = (...args: Parameters<typeof mediaUploadService.uploadBase64>) =>
    mediaUploadService.uploadBase64(...args);
  uploadGltfPackage = (...args: Parameters<typeof mediaUploadService.uploadGltfPackage>) =>
    mediaUploadService.uploadGltfPackage(...args);
  uploadChunkRaw = (...args: Parameters<typeof mediaUploadService.uploadChunkRaw>) =>
    mediaUploadService.uploadChunkRaw(...args);
  getUploadMetrics = (...args: Parameters<typeof mediaUploadService.getUploadMetrics>) =>
    mediaUploadService.getUploadMetrics(...args);

  // Content methods
  getSignedUrl = (...args: Parameters<typeof mediaContentService.getSignedUrl>) =>
    mediaContentService.getSignedUrl(...args);
  getThumbnailUrl = (...args: Parameters<typeof mediaContentService.getThumbnailUrl>) =>
    mediaContentService.getThumbnailUrl(...args);
  getMediaGeometry = (...args: Parameters<typeof mediaContentService.getMediaGeometry>) =>
    mediaContentService.getMediaGeometry(...args);
  getMediaRaw = (...args: Parameters<typeof mediaContentService.getMediaRaw>) =>
    mediaContentService.getMediaRaw(...args);
  getMediaProxy = (...args: Parameters<typeof mediaContentService.getMediaProxy>) =>
    mediaContentService.getMediaProxy(...args);
  getThumbnailProxy = (...args: Parameters<typeof mediaContentService.getThumbnailProxy>) =>
    mediaContentService.getThumbnailProxy(...args);
  testObjectStorageConnectivity = (
    ...args: Parameters<typeof mediaContentService.testObjectStorageConnectivity>
  ) => mediaContentService.testObjectStorageConnectivity(...args);
  getPerformanceDashboard = (
    ...args: Parameters<typeof mediaContentService.getPerformanceDashboard>
  ) => mediaContentService.getPerformanceDashboard(...args);
  getPerformanceMetrics = (...args: Parameters<typeof mediaContentService.getPerformanceMetrics>) =>
    mediaContentService.getPerformanceMetrics(...args);
  getSystemStatus = (...args: Parameters<typeof mediaContentService.getSystemStatus>) =>
    mediaContentService.getSystemStatus(...args);
}

export const mediaService = new MediaService();
