/**
 * MEDIA ROUTE SERVICES (DEPRECATED)
 *
 * This file is deprecated as of May 2026.
 * All media domain logic has been moved to the centralized service layer:
 * @see server/services/media.service.ts
 *
 * This shim remains for type compatibility during the transition.
 */

import { mediaService } from "../../services/media.service.js";

/**
 * @deprecated Use mediaService from server/services/media.service.ts
 */
export const enhancedUploadService = {
  initializeChunkedUpload: mediaService.initializeUpload.bind(mediaService),
  uploadChunk: mediaService.uploadChunk.bind(mediaService),
  finalizeUpload: mediaService.finalizeUpload.bind(mediaService),
  getUploadProgress: mediaService.getUploadProgress.bind(mediaService),
  cancelUpload: mediaService.cancelUpload.bind(mediaService),
  getActiveUploads: mediaService.getActiveUploads.bind(mediaService),
};

/**
 * @deprecated Use mediaService from server/services/media.service.ts
 */
export const uploadSessions = {
  get: () => {
    throw new Error("Direct access to uploadSessions is deprecated. Use mediaService.");
  },
  entries: () => [],
};

export type { UploadSession } from "../../services/media-upload.service.js";
