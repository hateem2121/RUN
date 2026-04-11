/**
 * Auth Service Unit Tests
 * Phase 1: Testing & Quality Excellence
 *
 * Tests cover:
 * - Session management
 * - Admin role verification
 * - Error handling
 * - UA binding for hijack prevention
 */

import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing the module
vi.mock("../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../server/lib/secrets/secret-manager.js", () => ({
  getSecret: vi.fn((key: string) => {
    if (key === "SESSION_SECRET") {
      return "test-session-secret-at-least-32-chars";
    }
    return undefined;
  }),
}));

vi.mock("../../../server/lib/storage-singleton.js", () => ({
  getStorage: vi.fn(() => ({
    getUser: vi.fn(),
    upsertUser: vi.fn(),
  })),
}));

vi.mock("../../../server/lib/cache/admin-cache.js", () => ({
  adminCacheManager: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("AuthService", () => {
  describe("AuthErrors", () => {
    it("should have correct error codes and status", async () => {
      const { AuthErrors } = await import("../../../server/services/auth-service.js");

      expect(AuthErrors.SESSION_EXPIRED.code).toBe("SESSION_EXPIRED");
      expect(AuthErrors.SESSION_EXPIRED.status).toBe(401);

      expect(AuthErrors.ADMIN_REQUIRED.code).toBe("ADMIN_REQUIRED");
      expect(AuthErrors.ADMIN_REQUIRED.status).toBe(403);

      expect(AuthErrors.AUTH_SERVER_ERROR.code).toBe("AUTH_SERVER_ERROR");
      expect(AuthErrors.AUTH_SERVER_ERROR.status).toBe(503);

      expect(AuthErrors.USER_NOT_FOUND.code).toBe("USER_NOT_FOUND");
      expect(AuthErrors.USER_NOT_FOUND.status).toBe(404);

      expect(AuthErrors.INVALID_SESSION.code).toBe("INVALID_SESSION");
      expect(AuthErrors.INVALID_SESSION.status).toBe(401);

      expect(AuthErrors.SESSION_UA_MISMATCH.code).toBe("SESSION_UA_MISMATCH");
      expect(AuthErrors.SESSION_UA_MISMATCH.status).toBe(401);
    });
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", async () => {
      const { AuthService } = await import("../../../server/services/auth-service.js");

      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("isAuthenticated middleware", () => {
    it("should call next() for authenticated requests", async () => {
      const { authService } = await import("../../../server/services/auth-service.js");

      const req = {
        isAuthenticated: () => true,
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      authService.isAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 for unauthenticated requests", async () => {
      const { authService } = await import("../../../server/services/auth-service.js");

      const req = {
        isAuthenticated: () => false,
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      authService.isAuthenticated(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });
  });

  describe("requireAdmin middleware", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      process.env.BYPASS_RBAC_FOR_TESTING = "false";
    });

    it("should return SESSION_EXPIRED for unauthenticated requests", async () => {
      const { authService, AuthErrors } = await import("../../../server/services/auth-service.js");

      const req = {
        isAuthenticated: () => false,
        user: undefined,
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(AuthErrors.SESSION_EXPIRED.status);
      expect(res.json).toHaveBeenCalledWith({
        error: AuthErrors.SESSION_EXPIRED,
        redirectTo: "/api/login",
      });
    });

    it("should return SESSION_EXPIRED when user has no claims", async () => {
      const { authService, AuthErrors } = await import("../../../server/services/auth-service.js");

      const req = {
        isAuthenticated: () => true,
        user: { claims: undefined },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(AuthErrors.SESSION_EXPIRED.status);
    });

    it("should use cached admin status when available", async () => {
      const { adminCacheManager } = await import("../../../server/lib/cache/admin-cache.js");
      vi.mocked(adminCacheManager.get).mockReturnValue(true);

      const { authService } = await import("../../../server/services/auth-service.js");

      const req = {
        isAuthenticated: () => true,
        user: { claims: { sub: "user-123", email: "test@test.com" } },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(adminCacheManager.get).toHaveBeenCalledWith("user-123");
      expect(next).toHaveBeenCalled();
    });

    it("should deny access for non-admin cached users", async () => {
      const { adminCacheManager } = await import("../../../server/lib/cache/admin-cache.js");
      vi.mocked(adminCacheManager.get).mockReturnValue(false);

      const { authService, AuthErrors } = await import("../../../server/services/auth-service.js");

      const req = {
        isAuthenticated: () => true,
        user: { claims: { sub: "user-123", email: "test@test.com" } },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(AuthErrors.ADMIN_REQUIRED.status);
      expect(res.json).toHaveBeenCalledWith({
        error: AuthErrors.ADMIN_REQUIRED,
      });
    });
  });
});
