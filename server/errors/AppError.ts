export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: Record<string, string[] | string>;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true,
    details?: Record<string, string[] | string>,
    metadata?: Record<string, unknown>,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    if (details) this.details = details;
    if (metadata) this.metadata = metadata;

    Error.captureStackTrace(this);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation Failed", details?: Record<string, string[] | string>) {
    super(message, 400, "INVALID_INPUT", true, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource Not Found") {
    super(message, 404, "RESOURCE_NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests, please try again later.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class InternalError extends AppError {
  constructor(message: string = "Internal Server Error") {
    super(message, 500, "INTERNAL_ERROR", false);
  }
}
