/**
 * Custom error classes for media operations
 * Enables precise error handling and proper HTTP status code mapping
 */

export class MediaNotFoundError extends Error {
  public readonly status: number = 404;

  constructor(message: string = "Media not found") {
    super(message);
    this.name = "MediaNotFoundError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CacheInvalidationError extends Error {
  public readonly status: number = 500;

  constructor(message: string = "Cache invalidation failed") {
    super(message);
    this.name = "CacheInvalidationError";
    Error.captureStackTrace(this, this.constructor);
  }
}
