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
    super(message, 400, "VALIDATION_ERROR", true, details);
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
  constructor(message: string = "Too many requests", retryAfterSecs: number = 60) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true, { retryAfter: retryAfterSecs });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 503, "DB_CONNECTION_ERROR", true, details);
  }
}
