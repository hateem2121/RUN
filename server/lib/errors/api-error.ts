export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(message, 403, "FORBIDDEN");
  }

  static notFound(message: string = "Resource not found") {
    return new ApiError(message, 404, "NOT_FOUND");
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(message, 500, "INTERNAL_ERROR");
  }
}
