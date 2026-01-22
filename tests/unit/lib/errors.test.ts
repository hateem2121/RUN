/**
 * Error Classes Unit Tests
 * Tests all custom AppError subclasses
 */

import { describe, expect, it } from "vitest";
import {
  AppError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  DatabaseDeadlockError,
  DatabaseError,
  DatabaseTimeoutError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../../../server/lib/errors.js";

describe("AppError classes", () => {
  describe("ValidationError", () => {
    it("should have correct status code and code", () => {
      const error = new ValidationError("Invalid input");

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.isOperational).toBe(true);
      expect(error.message).toBe("Invalid input");
    });

    it("should include details when provided", () => {
      const error = new ValidationError("Invalid input", { field: "email" });

      expect(error.details).toEqual({ field: "email" });
    });
  });

  describe("AuthenticationError", () => {
    it("should have correct status code 401", () => {
      const error = new AuthenticationError();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("AUTH_INVALID_TOKEN");
      expect(error.message).toBe("Authentication required");
    });

    it("should accept custom message", () => {
      const error = new AuthenticationError("Token expired");

      expect(error.message).toBe("Token expired");
    });
  });

  describe("ForbiddenError", () => {
    it("should have correct status code 403", () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("AUTH_FORBIDDEN");
      expect(error.message).toBe("Access denied");
    });
  });

  describe("NotFoundError", () => {
    it("should have correct status code 404", () => {
      const error = new NotFoundError("User");

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("RESOURCE_NOT_FOUND");
      expect(error.message).toBe("User not found");
    });
  });

  describe("ConflictError", () => {
    it("should have correct status code 409", () => {
      const error = new ConflictError("Resource already exists");

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT_ERROR");
    });
  });

  describe("RateLimitError", () => {
    it("should have correct status code 429", () => {
      const error = new RateLimitError();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.message).toBe("Too many requests");
    });

    it("should accept retryAfter as number (legacy)", () => {
      const error = new RateLimitError("Slow down", 120);

      expect(error.details).toEqual({ retryAfter: 120 });
    });

    it("should accept details object", () => {
      const error = new RateLimitError("Slow down", { retryAfter: 60, limit: 100 });

      expect(error.details).toEqual({ retryAfter: 60, limit: 100 });
    });
  });

  describe("DatabaseError", () => {
    it("should have correct status code 503", () => {
      const error = new DatabaseError("Connection failed");

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("DB_CONNECTION_ERROR");
      expect(error.isOperational).toBe(true);
    });
  });

  describe("DatabaseTimeoutError", () => {
    it("should have correct status code 504", () => {
      const error = new DatabaseTimeoutError();

      expect(error.statusCode).toBe(504);
      expect(error.code).toBe("DB_TIMEOUT");
      expect(error.message).toBe("Database query timed out");
    });
  });

  describe("DatabaseDeadlockError", () => {
    it("should have correct status code 409", () => {
      const error = new DatabaseDeadlockError();

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("DB_DEADLOCK");
      expect(error.isOperational).toBe(true);
    });
  });

  describe("BadRequestError", () => {
    it("should have correct status code 400", () => {
      const error = new BadRequestError();

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.message).toBe("Bad Request");
    });
  });

  describe("InternalError", () => {
    it("should have correct status code 500", () => {
      const error = new InternalError();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.message).toBe("Internal Server Error");
    });

    it("should NOT be operational (programmer error)", () => {
      const error = new InternalError("Bug");

      expect(error.isOperational).toBe(false);
    });
  });

  describe("Error inheritance", () => {
    it("should be instanceof Error", () => {
      const error = new ValidationError("test");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it("should have stack trace", () => {
      const error = new ValidationError("test");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("ValidationError");
    });
  });
});
