/**
 * Centralized Upload Configuration
 * Systematic configuration for chunk uploads, rate limits, and file size constraints
 */

export const UPLOAD_CONFIG = {
  // Chunk upload settings
  chunkSize: 8 * 1024 * 1024, // 8MB chunks (optimal for memory/performance balance)
  concurrencyPerUpload: 2, // 2 concurrent chunks per upload (prevents memory spikes)
  globalConcurrency: 8, // 8 total concurrent chunks across all uploads
  maxSingleUpload: 500 * 1024 * 1024, // 500MB for non-chunked uploads (matches MODEL file limits)

  // Rate limiting configuration
  rateLimits: {
    chunk: 100, // 100 requests/10min for chunk routes (allows 500MB uploads)
    regular: 30, // 30 requests/10min for other routes (existing limit)
  },

  // File size limits per type
  fileSizeLimits: {
    IMAGE: 500 * 1024 * 1024, // 500MB for images (as requested)
    VIDEO: 500 * 1024 * 1024, // 500MB for videos (as requested)
    MODEL: 500 * 1024 * 1024, // 500MB for 3D models (as requested)
    DOCUMENT: 20 * 1024 * 1024, // 20MB for PDFs (25x safer)
    DEFAULT: 500 * 1024 * 1024, // 500MB default (matches MODEL file limits)
  },

  // Timeout and retry settings
  chunkUploadTimeout: 30 * 1000, // 30 second timeout per chunk
  maxRetries: 3, // Max retry attempts for failed chunks
  sessionTTL: 24 * 60 * 60 * 1000, // 24 hour session expiry

  // Security settings
  allowedMimeTypes: {
    regular: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "model/gltf-binary",
      "model/gltf+json",
      "application/pdf",
      "application/json", // Browsers send .gltf as application/json
      "application/octet-stream", // Generic binary MIME type
    ],
    chunk: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "model/gltf-binary",
      "model/gltf+json",
      "application/pdf",
      "application/json", // Browsers send .gltf as application/json
      "application/octet-stream", // Generic binary and chunk uploads
    ],
  },

  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".mp4",
    ".webm",
    ".glb",
    ".gltf",
    ".pdf",
  ],
};

export default UPLOAD_CONFIG;
