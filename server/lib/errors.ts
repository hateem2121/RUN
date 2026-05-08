export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean = true,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, "VALIDATION_ERROR", true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", details?: Record<string, unknown>) {
    super(message, 401, "AUTH_INVALID_TOKEN", true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied", details?: Record<string, unknown>) {
    super(message, 403, "AUTH_FORBIDDEN", true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, details?: Record<string, unknown>) {
    super(`${resource} not found`, 404, "RESOURCE_NOT_FOUND", true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, "CONFLICT_ERROR", true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = "Too many requests",
    detailsOrRetryAfter: number | Record<string, unknown> = 60,
  ) {
    // Support both old (number) and new (object) signatures
    const details =
      typeof detailsOrRetryAfter === "number"
        ? { retryAfter: detailsOrRetryAfter }
        : detailsOrRetryAfter;
    super(message, 429, "RATE_LIMIT_EXCEEDED", true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 503, "DB_CONNECTION_ERROR", true, details);
  }
}

/**
 * Bad Request Error (400)
 * Use for malformed requests that don't fall under validation
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request", details?: Record<string, unknown>) {
    super(message, 400, "BAD_REQUEST", true, details);
  }
}

/**
 * Internal Server Error (500)
 * Use for unexpected server-side errors
 * Note: isOperational = false indicates this is a programmer error
 */
export class InternalError extends AppError {
  constructor(message: string = "Internal Server Error", details?: Record<string, unknown>) {
    super(message, 500, "INTERNAL_ERROR", false, details);
  }
}

/**
 * Database Timeout Error (504)
 * Use for slow query timeouts
 */
export class DatabaseTimeoutError extends AppError {
  constructor(message: string = "Database query timed out", details?: Record<string, unknown>) {
    super(message, 504, "DB_TIMEOUT", true, details);
  }
}

/**
 * Database Deadlock Error (409)
 * Use for transaction deadlocks - these are retryable
 */
export class DatabaseDeadlockError extends AppError {
  constructor(
    message: string = "Transaction deadlock detected",
    details?: Record<string, unknown>,
  ) {
    super(message, 409, "DB_DEADLOCK", true, details);
  }
}
