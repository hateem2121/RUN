import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { csrfTokenGenerator, csrfValidator } from "../csrf.js";

// Mock dependencies
vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe("CSRF Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      cookies: {},
      method: "GET",
      path: "/api/test",
      get: vi.fn(),
    };
    res = {
      cookie: vi.fn(),
      locals: {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe("csrfTokenGenerator", () => {
    it("should generate token if missing in cookies", () => {
      csrfTokenGenerator(req as Request, res as Response, next);

      expect(res.cookie).toHaveBeenCalledWith(
        "csrf_token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: "strict",
          path: "/",
        }),
      );
      expect(res.locals.csrfToken).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it("should use existing token from cookies", () => {
      req.cookies = { csrf_token: "existing-token" };
      csrfTokenGenerator(req as Request, res as Response, next);

      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.locals.csrfToken).toBe("existing-token");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("csrfValidator", () => {
    beforeEach(() => {
      req.method = "POST";
    });

    it("should skip validation for safe methods", () => {
      req.method = "GET";
      csrfValidator(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should skip validation for excluded routes", () => {
      req.path = "/api/auth/google";
      csrfValidator(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should fail if token missing in cookie", () => {
      req.cookies = {};
      (req.get as any).mockReturnValue("some-token");

      csrfValidator(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "CSRF_TOKEN_MISSING" }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should fail if token missing in header", () => {
      req.cookies = { csrf_token: "some-token" };
      (req.get as any).mockReturnValue(undefined);

      csrfValidator(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "CSRF_TOKEN_MISSING" }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should fail if tokens mismatch", () => {
      req.cookies = { csrf_token: "token-a" };
      (req.get as any).mockReturnValue("token-b");

      csrfValidator(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "CSRF_TOKEN_INVALID" }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass if tokens match", () => {
      req.cookies = { csrf_token: "valid-token" };
      (req.get as any).mockReturnValue("valid-token");

      csrfValidator(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
