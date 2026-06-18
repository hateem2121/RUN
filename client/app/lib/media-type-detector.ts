/**
 * Media Type Detection Utilities
 * Identifies media formats (3D models, images, videos) from URLs or MIME types
 */

type MediaType = "3d-model" | "image" | "video" | "unknown";

const MODEL_EXTENSIONS = [".glb", ".gltf"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];

const MODEL_MIME_TYPES = ["model/gltf-binary", "model/gltf+json"];
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

/**
 * Detects media type from URL file extension
 */
function detectMediaTypeFromUrl(url: string | null | undefined): MediaType {
  if (!url) {
    return "unknown";
  }

  const urlLower = url.toLowerCase();

  if (MODEL_EXTENSIONS.some((ext) => urlLower.endsWith(ext))) {
    return "3d-model";
  }

  if (IMAGE_EXTENSIONS.some((ext) => urlLower.endsWith(ext))) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.some((ext) => urlLower.endsWith(ext))) {
    return "video";
  }

  return "unknown";
}

/**
 * Detects media type from MIME type
 */
function detectMediaTypeFromMime(mimeType: string | null | undefined): MediaType {
  if (!mimeType) {
    return "unknown";
  }

  const mimeLower = mimeType.toLowerCase();

  if (MODEL_MIME_TYPES.some((type) => mimeLower.includes(type))) {
    return "3d-model";
  }

  if (IMAGE_MIME_TYPES.some((type) => mimeLower.includes(type))) {
    return "image";
  }

  if (VIDEO_MIME_TYPES.some((type) => mimeLower.includes(type))) {
    return "video";
  }

  return "unknown";
}

/**
 * Checks if a URL or MIME type points to a 3D model (GLB/GLTF)
 * Supports both direct URLs with extensions and MIME type-based detection
 */
export function isModelUrl(url: string | null | undefined, mimeType?: string | null): boolean {
  // First try MIME type if provided (most reliable for API-served media)
  if (mimeType && detectMediaTypeFromMime(mimeType) === "3d-model") {
    return true;
  }
  // Fallback to URL extension detection (for direct URLs)
  return detectMediaTypeFromUrl(url) === "3d-model";
}

/**
 * Checks if a URL points to an image
 */
export function isImageUrl(url: string | null | undefined): boolean {
  return detectMediaTypeFromUrl(url) === "image";
}

/**
 * Checks if a URL points to a video
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  return detectMediaTypeFromUrl(url) === "video";
}
