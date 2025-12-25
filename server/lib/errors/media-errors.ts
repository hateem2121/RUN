/**
 * Custom error classes for media operations
 * Enables precise error handling and proper HTTP status code mapping
 */

export class MediaNotFoundError extends Error {
  constructor(mediaId: number | string) {
    super(`Media asset not found or already deleted: ${mediaId}`);
    this.name = "MediaNotFoundError";
  }
}

export class CacheInvalidationError extends Error {
  cause?: Error;

  constructor(operation: string, cause?: Error) {
    super(
      `Cache invalidation failed for ${operation} operation: ${cause?.message || "Unknown error"}`,
    );
    this.name = "CacheInvalidationError";
    this.cause = cause;
  }
}
