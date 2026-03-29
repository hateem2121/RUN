export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Not authenticated") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Not authorized") {
    super(message, 403, "FORBIDDEN");
  }
}

export interface ApiErrorResponse {
  message: string;
  code: string;
  statusCode: number;
  stack?: string;
}

/**
 * RFC 7807 Problem Details
 * Standard error response format for HTTP APIs
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Exhaustive union of all system error codes.
 * Use this for type-safe error handling on the frontend.
 */
export type ErrorCode =
  // Validation errors (400)
  | "VALIDATION_ERROR"
  | "INVALID_INPUT"
  | "BAD_REQUEST"
  // Authentication errors (401)
  | "UNAUTHORIZED"
  | "AUTH_INVALID_TOKEN"
  // Authorization errors (403)
  | "AUTH_FORBIDDEN"
  | "FORBIDDEN"
  // Not found errors (404)
  | "RESOURCE_NOT_FOUND"
  | "NOT_FOUND"
  // Conflict errors (409)
  | "CONFLICT"
  | "DB_DEADLOCK"
  // Rate limit errors (429)
  | "RATE_LIMIT_EXCEEDED"
  // Server errors (500)
  | "INTERNAL_ERROR"
  // Database errors (503/504)
  | "DB_CONNECTION_ERROR"
  | "DB_TIMEOUT";

/**
 * Typed ProblemDetails with known error code.
 * Use this for type-safe API error responses.
 */
export interface TypedProblemDetails extends ProblemDetails {
  code: ErrorCode;
}

/**
 * Check if an error code is retryable
 */
export function isRetryableError(code: ErrorCode): boolean {
  return ["RATE_LIMIT_EXCEEDED", "DB_DEADLOCK", "DB_CONNECTION_ERROR", "DB_TIMEOUT"].includes(code);
}
