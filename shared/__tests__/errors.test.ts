import { describe, expect, it } from "vitest";
import {
  type ApiErrorResponse,
  AppError,
  AuthenticationError,
  AuthorizationError,
  type ErrorCode,
  isRetryableError,
  NotFoundError,
  type ProblemDetails,
  type TypedProblemDetails,
  ValidationError,
} from "../errors";

describe("shared/errors", () => {
  describe("AppError", () => {
    it("should create an error with default values", () => {
      const error = new AppError("Something went wrong");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.name).toBe("AppError");
    });

    it("should create an error with custom status code", () => {
      const error = new AppError("Bad request", 400);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("INTERNAL_ERROR");
    });

    it("should create an error with custom status code and error code", () => {
      const error = new AppError("Custom error", 418, "IM_A_TEAPOT");

      expect(error.statusCode).toBe(418);
      expect(error.code).toBe("IM_A_TEAPOT");
    });
  });

  describe("NotFoundError", () => {
    it("should create a 404 error for a resource", () => {
      const error = new NotFoundError("Product");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("Product not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.name).toBe("AppError");
    });

    it("should work with different resource names", () => {
      const userError = new NotFoundError("User");
      const orderError = new NotFoundError("Order");

      expect(userError.message).toBe("User not found");
      expect(orderError.message).toBe("Order not found");
    });
  });

  describe("ValidationError", () => {
    it("should create a 400 validation error", () => {
      const error = new ValidationError("Invalid email format");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Invalid email format");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("should work with various validation messages", () => {
      const requiredError = new ValidationError("Field is required");
      const formatError = new ValidationError("Invalid format");

      expect(requiredError.message).toBe("Field is required");
      expect(formatError.message).toBe("Invalid format");
    });
  });

  describe("AuthenticationError", () => {
    it("should create a 401 error with default message", () => {
      const error = new AuthenticationError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe("Not authenticated");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("should create a 401 error with custom message", () => {
      const error = new AuthenticationError("Token expired");

      expect(error.message).toBe("Token expired");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("AuthorizationError", () => {
    it("should create a 403 error with default message", () => {
      const error = new AuthorizationError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe("Not authorized");
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
    });

    it("should create a 403 error with custom message", () => {
      const error = new AuthorizationError("Admin access required");

      expect(error.message).toBe("Admin access required");
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  describe("isRetryableError", () => {
    it("should return true for RATE_LIMIT_EXCEEDED", () => {
      expect(isRetryableError("RATE_LIMIT_EXCEEDED")).toBe(true);
    });

    it("should return true for DB_DEADLOCK", () => {
      expect(isRetryableError("DB_DEADLOCK")).toBe(true);
    });

    it("should return true for DB_CONNECTION_ERROR", () => {
      expect(isRetryableError("DB_CONNECTION_ERROR")).toBe(true);
    });

    it("should return true for DB_TIMEOUT", () => {
      expect(isRetryableError("DB_TIMEOUT")).toBe(true);
    });

    it("should return false for VALIDATION_ERROR", () => {
      expect(isRetryableError("VALIDATION_ERROR")).toBe(false);
    });

    it("should return false for UNAUTHORIZED", () => {
      expect(isRetryableError("UNAUTHORIZED")).toBe(false);
    });

    it("should return false for NOT_FOUND", () => {
      expect(isRetryableError("NOT_FOUND")).toBe(false);
    });

    it("should return false for INTERNAL_ERROR", () => {
      expect(isRetryableError("INTERNAL_ERROR")).toBe(false);
    });

    it("should return false for FORBIDDEN", () => {
      expect(isRetryableError("FORBIDDEN")).toBe(false);
    });

    it("should return false for CONFLICT", () => {
      expect(isRetryableError("CONFLICT")).toBe(false);
    });
  });

  describe("Type definitions", () => {
    it("should have correct ApiErrorResponse type", () => {
      const response: ApiErrorResponse = {
        message: "Error message",
        code: "VALIDATION_ERROR",
        statusCode: 400,
      };

      expect(response.message).toBe("Error message");
      expect(response.code).toBe("VALIDATION_ERROR");
      expect(response.statusCode).toBe(400);
    });

    it("should have correct ApiErrorResponse type with optional stack", () => {
      const response: ApiErrorResponse = {
        message: "Error message",
        code: "INTERNAL_ERROR",
        statusCode: 500,
        stack: "Error at line 1...",
      };

      expect(response.stack).toBe("Error at line 1...");
    });

    it("should have correct ProblemDetails type", () => {
      const problem: ProblemDetails = {
        type: "https://example.com/errors/validation",
        title: "Validation Error",
        status: 400,
        detail: "The email field is required",
      };

      expect(problem.type).toBe("https://example.com/errors/validation");
      expect(problem.title).toBe("Validation Error");
      expect(problem.status).toBe(400);
      expect(problem.detail).toBe("The email field is required");
    });

    it("should have correct ProblemDetails type with optional fields", () => {
      const problem: ProblemDetails = {
        type: "https://example.com/errors/not-found",
        title: "Not Found",
        status: 404,
        detail: "Resource not found",
        instance: "/users/123",
        requestId: "req-abc-123",
        customField: "custom value",
      };

      expect(problem.instance).toBe("/users/123");
      expect(problem.requestId).toBe("req-abc-123");
      expect(problem.customField).toBe("custom value");
    });

    it("should have correct TypedProblemDetails type", () => {
      const typedProblem: TypedProblemDetails = {
        type: "https://example.com/errors/validation",
        title: "Validation Error",
        status: 400,
        detail: "Invalid input",
        code: "VALIDATION_ERROR",
      };

      expect(typedProblem.code).toBe("VALIDATION_ERROR");
    });

    it("should have correct ErrorCode type with all values", () => {
      // Validation errors (400)
      const validationError: ErrorCode = "VALIDATION_ERROR";
      const invalidInput: ErrorCode = "INVALID_INPUT";
      const badRequest: ErrorCode = "BAD_REQUEST";

      // Authentication errors (401)
      const unauthorized: ErrorCode = "UNAUTHORIZED";
      const authInvalidToken: ErrorCode = "AUTH_INVALID_TOKEN";

      // Authorization errors (403)
      const authForbidden: ErrorCode = "AUTH_FORBIDDEN";
      const forbidden: ErrorCode = "FORBIDDEN";

      // Not found errors (404)
      const resourceNotFound: ErrorCode = "RESOURCE_NOT_FOUND";
      const notFound: ErrorCode = "NOT_FOUND";

      // Conflict errors (409)
      const conflict: ErrorCode = "CONFLICT";
      const dbDeadlock: ErrorCode = "DB_DEADLOCK";

      // Rate limit errors (429)
      const rateLimitExceeded: ErrorCode = "RATE_LIMIT_EXCEEDED";

      // Server errors (500)
      const internalError: ErrorCode = "INTERNAL_ERROR";

      // Database errors (503/504)
      const dbConnectionError: ErrorCode = "DB_CONNECTION_ERROR";
      const dbTimeout: ErrorCode = "DB_TIMEOUT";

      // Verify all are strings
      expect(typeof validationError).toBe("string");
      expect(typeof invalidInput).toBe("string");
      expect(typeof badRequest).toBe("string");
      expect(typeof unauthorized).toBe("string");
      expect(typeof authInvalidToken).toBe("string");
      expect(typeof authForbidden).toBe("string");
      expect(typeof forbidden).toBe("string");
      expect(typeof resourceNotFound).toBe("string");
      expect(typeof notFound).toBe("string");
      expect(typeof conflict).toBe("string");
      expect(typeof dbDeadlock).toBe("string");
      expect(typeof rateLimitExceeded).toBe("string");
      expect(typeof internalError).toBe("string");
      expect(typeof dbConnectionError).toBe("string");
      expect(typeof dbTimeout).toBe("string");
    });
  });

  describe("Error inheritance", () => {
    it("should maintain proper prototype chain for NotFoundError", () => {
      const error = new NotFoundError("Product");

      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should maintain proper prototype chain for ValidationError", () => {
      const error = new ValidationError("Invalid");

      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should maintain proper prototype chain for AuthenticationError", () => {
      const error = new AuthenticationError();

      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should maintain proper prototype chain for AuthorizationError", () => {
      const error = new AuthorizationError();

      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should have correct stack trace", () => {
      const error = new AppError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("AppError");
    });
  });

  describe("Error catching", () => {
    it("should catch AppError as Error", () => {
      let caught = false;

      try {
        throw new AppError("Test error");
      } catch (error) {
        if (error instanceof Error) {
          caught = true;
        }
      }

      expect(caught).toBe(true);
    });

    it("should catch specific error types", () => {
      let caughtAsNotFound = false;

      try {
        throw new NotFoundError("Product");
      } catch (error) {
        if (error instanceof NotFoundError) {
          caughtAsNotFound = true;
        }
      }

      expect(caughtAsNotFound).toBe(true);
    });

    it("should distinguish between error types", () => {
      const errors = [
        new NotFoundError("Product"),
        new ValidationError("Invalid"),
        new AuthenticationError(),
        new AuthorizationError(),
      ];

      const results = errors.map((error) => {
        if (error instanceof NotFoundError) return "not-found";
        if (error instanceof ValidationError) return "validation";
        if (error instanceof AuthenticationError) return "authentication";
        if (error instanceof AuthorizationError) return "authorization";
        return "unknown";
      });

      expect(results).toEqual(["not-found", "validation", "authentication", "authorization"]);
    });
  });
});
