import { createHash } from "node:crypto";
import type { Request, Response } from "express";
import { err, ok } from "neverthrow";
import type { Profile as PassportProfile } from "passport-google-oauth20";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminCacheManager } from "../../lib/cache/admin-cache";
import { DatabaseError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger";
import { getStorage } from "../../lib/storage-singleton";
import type { SessionUser } from "../../types/session";
import { AuthErrors, authService } from "../auth-service";

// Mock dependencies
vi.mock("../../lib/storage-singleton", () => ({
  getStorage: vi.fn(),
  StorageSingleton: {
    hasInstance: vi.fn().mockReturnValue(false),
    getInstance: vi.fn(),
  },
}));

vi.mock("../../lib/db/repositories/index.js", () => ({
  userRepository: {
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    upsertUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("../../lib/cache/admin-cache", () => ({
  adminCacheManager: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("../../lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - access private method
    authService.constructor.instance = undefined;
    process.env.NODE_ENV = "development";
    process.env.ENABLE_MOCK_ADMIN = "false";
  });

  describe("verifyAdminAccess", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      claims: { sub: "user-123", email: "test@example.com" },
    } as unknown as SessionUser;

    it("returns cached status if available", async () => {
      vi.mocked(adminCacheManager.get).mockReturnValue(true);

      const result = await authService.verifyAdminAccess(mockUser);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(adminCacheManager.get).toHaveBeenCalledWith("user-123");
      expect(getStorage).not.toHaveBeenCalled();
    });

    it("checks storage if not in cache", async () => {
      vi.mocked(adminCacheManager.get).mockReturnValue(null);
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUser).mockResolvedValue({ id: "user-123", isAdmin: true } as any);

      const result = await authService.verifyAdminAccess(mockUser);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(userRepository.getUser).toHaveBeenCalledWith("user-123");
      expect(adminCacheManager.set).toHaveBeenCalledWith("user-123", true);
    });

    it("returns false if user not found in storage", async () => {
      vi.mocked(adminCacheManager.get).mockReturnValue(null);
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUser).mockResolvedValue(null);

      const result = await authService.verifyAdminAccess(mockUser);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it("handles mock admin access in development", async () => {
      process.env.NODE_ENV = "development";
      process.env.ENABLE_MOCK_ADMIN = "true";
      const mockUserWithMock = {
        ...mockUser,
        isAdmin: true,
        claims: { ...mockUser.claims, isMock: true },
      };
      vi.mocked(adminCacheManager.get).mockReturnValue(null);

      const result = await authService.verifyAdminAccess(mockUserWithMock);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("MOCK ADMIN ACCESS GRANTED"),
        expect.any(Object),
      );
    });

    it("rejects mock admin access in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.ENABLE_MOCK_ADMIN = "true";
      const mockUserWithMock = {
        ...mockUser,
        isAdmin: true,
        claims: { ...mockUser.claims, isMock: true },
      };
      vi.mocked(adminCacheManager.get).mockReturnValue(null);
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUser).mockResolvedValue({
        id: "user-123",
        isAdmin: false,
      } as any);

      const result = await authService.verifyAdminAccess(mockUserWithMock);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });
  });

  describe("sessionSecurityMiddleware", () => {
    it("handles first request by storing UA hash", () => {
      const req = {
        session: {},
        user: {},
        headers: { "user-agent": "test-agent" },
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = vi.fn();

      authService.sessionSecurityMiddleware(req, res, next);

      expect(req.session.uaHash).toBeDefined();
      expect(req.session.lastRotated).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it("rejects session if UA hash mismatches", () => {
      const req = {
        session: { uaHash: "different-hash", destroy: vi.fn((cb) => cb()) },
        user: {},
        headers: { "user-agent": "test-agent" },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      authService.sessionSecurityMiddleware(req, res, next);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(AuthErrors.SESSION_UA_MISMATCH);
    });

    it("regenerates session after rotation interval", () => {
      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const req = {
        session: {
          uaHash: createHash("sha256").update("test-agent").digest("hex").substring(0, 16),
          lastRotated: now - 20 * 60 * 1000, // 20 mins ago
          regenerate: vi.fn((cb) => cb()),
          save: vi.fn((cb) => cb()),
        },
        user: {},
        headers: { "user-agent": "test-agent" },
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = vi.fn();

      authService.sessionSecurityMiddleware(req, res, next);

      expect(
        (req as unknown as { session: { regenerate: ReturnType<typeof vi.fn> } }).session
          .regenerate,
      ).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe("account lockout", () => {
    it("locks account after 5 failed attempts", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
        id: "1",
        failedLoginAttempts: 4,
      } as any);
      vi.mocked(userRepository.updateUser).mockResolvedValue({} as any);

      const result = await authService.recordFailedLogin("test@example.com");
      expect(result.isOk()).toBe(true);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          failedLoginAttempts: 5,
          lockoutUntil: expect.any(Date),
        }),
      );
    });

    it("checks if account is locked", async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
        lockoutUntil: futureDate,
      } as any);

      const result = await authService.isAccountLocked("test@example.com");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it("resets attempts on successful login", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue({ id: "1" } as any);
      vi.mocked(userRepository.updateUser).mockResolvedValue({} as any);

      const result = await authService.recordSuccessfulLogin("test@example.com");
      expect(result.isOk()).toBe(true);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          failedLoginAttempts: 0,
          lockoutUntil: null,
        }),
      );
    });

    it("returns false for non-existent user in isAccountLocked", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue(null);

      const result = await authService.isAccountLocked("notfound@test.com");
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it("resets lock if it has expired", async () => {
      const pastDate = new Date(Date.now() - 1000);
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
        id: "1",
        lockoutUntil: pastDate,
      } as any);
      vi.mocked(userRepository.updateUser).mockResolvedValue({} as any);
      const spySuccess = vi.spyOn(authService, "recordSuccessfulLogin");

      const result = await authService.isAccountLocked("test@example.com");
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
      expect(spySuccess).toHaveBeenCalledWith("test@example.com");
    });
  });

  describe("upsertUser", () => {
    it("successfully upserts a user from Google profile", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.upsertUser).mockResolvedValue({
        id: "google-123",
        email: "test@gmail.com",
      } as any);

      const profile = {
        id: "google-123",
        emails: [{ value: "test@gmail.com" }],
        name: { givenName: "Test", familyName: "User" },
        photos: [{ value: "photo.jpg" }],
      } as unknown as PassportProfile;

      // Access private method for testing
      const result = await (
        authService as unknown as { upsertUser: (p: unknown) => Promise<any> }
      ).upsertUser(profile);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe("google-123");
      expect(userRepository.upsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "google-123",
          email: "test@gmail.com",
        }),
      );
    });

    it("handles error if no email in profile", async () => {
      const profile = { id: "123", emails: [] } as unknown as PassportProfile;
      const result = await (
        authService as unknown as { upsertUser: (p: unknown) => Promise<any> }
      ).upsertUser(profile);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toContain("No email provided by Google");
    });
  });

  describe("middleware", () => {
    it("requireAdmin allows admin users", async () => {
      const req = {
        isAuthenticated: () => true,
        user: { id: "1", claims: { sub: "1" } },
      } as unknown as Request;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
      const next = vi.fn();

      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(ok(true));

      await authService.requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("requireAdmin blocks non-admin users", async () => {
      const req = {
        isAuthenticated: () => true,
        user: { id: "1", claims: { sub: "1" } },
      } as unknown as Request;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
      const next = vi.fn();

      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(ok(false));

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: AuthErrors.ADMIN_REQUIRED });
    });

    it("isAuthenticated allows logged in users", () => {
      const req = { isAuthenticated: () => true } as unknown as Request;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
      const next = vi.fn();

      authService.isAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("isAuthenticated blocks guest users", () => {
      const req = { isAuthenticated: () => false } as unknown as Request;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
      const next = vi.fn();

      authService.isAuthenticated(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("utilities", () => {
    it("hashes user agent correctly", () => {
      const ua = "test-agent";
      const hash = authService.hashUserAgent(ua);
      expect(hash).toBe(createHash("sha256").update(ua).digest("hex"));
    });
  });

  describe("verifyAdminAccess edge cases", () => {
    it("returns false when user has no claims", async () => {
      const userWithoutClaims = {
        id: "user-123",
        email: "test@example.com",
      } as unknown as SessionUser;
      vi.mocked(adminCacheManager.get).mockReturnValue(null);

      const result = await authService.verifyAdminAccess(userWithoutClaims);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it("returns false when user claims is missing sub", async () => {
      const userWithIncompleteClaims = {
        id: "user-123",
        email: "test@example.com",
        claims: { email: "test@example.com" }, // missing 'sub'
      } as unknown as SessionUser;
      vi.mocked(adminCacheManager.get).mockReturnValue(null);

      const result = await authService.verifyAdminAccess(userWithIncompleteClaims);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });
  });

  describe("requireAdmin edge cases", () => {
    it("returns 401 when not authenticated", async () => {
      const req = {
        isAuthenticated: () => false,
        user: { id: "1" },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: AuthErrors.SESSION_EXPIRED,
        redirectTo: "/api/login",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when user is missing", async () => {
      const req = {
        isAuthenticated: () => true,
        user: undefined,
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when user claims is missing", async () => {
      const req = {
        isAuthenticated: () => true,
        user: { id: "1" }, // no claims
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when claims.sub is missing", async () => {
      const req = {
        isAuthenticated: () => true,
        user: { id: "1", claims: { email: "test@example.com" } }, // no sub
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 503 when verifyAdminAccess throws an error", async () => {
      const req = {
        isAuthenticated: () => true,
        user: { id: "1", claims: { sub: "1" } },
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(
        err(new DatabaseError("Unexpected error")),
      );

      await authService.requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: AuthErrors.AUTH_SERVER_ERROR,
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("getFailedAttempts", () => {
    it("returns 0 for non-existent user", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue(null);

      const result = await authService.getFailedAttempts("notfound@test.com");
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(0);
    });

    it("returns correct attempts for existing user", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
        id: "1",
        failedLoginAttempts: 3,
      } as any);

      const result = await authService.getFailedAttempts("test@example.com");
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(3);
    });

    it("returns 0 when failedLoginAttempts is not set", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue({ id: "1" } as any);

      const result = await authService.getFailedAttempts("test@example.com");
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(0);
    });
  });

  describe("sessionSecurityMiddleware edge cases", () => {
    it("calls next when session is missing", () => {
      const req = { headers: { "user-agent": "test" } } as unknown as Request;
      const res = {} as unknown as Response;
      const next = vi.fn();

      authService.sessionSecurityMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("calls next when user is missing", () => {
      const req = {
        session: { uaHash: "hash" },
        headers: { "user-agent": "test" },
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = vi.fn();

      authService.sessionSecurityMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("handles session regeneration error gracefully", () => {
      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const req = {
        session: {
          uaHash: createHash("sha256").update("test-agent").digest("hex").substring(0, 16),
          lastRotated: now - 20 * 60 * 1000, // 20 mins ago
          regenerate: vi.fn((cb) => cb(new Error("Regeneration failed"))),
        },
        user: {},
        headers: { "user-agent": "test-agent" },
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = vi.fn();

      authService.sessionSecurityMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      vi.useRealTimers();
    });

    it("handles session save error gracefully", () => {
      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const sessionObj: {
        uaHash: string;
        lastRotated: number;
        regenerate: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
        passport?: object;
      } = {
        uaHash: createHash("sha256").update("test-agent").digest("hex").substring(0, 16),
        lastRotated: now - 20 * 60 * 1000,
        regenerate: vi.fn((cb) => {
          sessionObj.passport = {};
          cb();
        }),
        save: vi.fn((cb) => cb(new Error("Save failed"))),
      };
      const req = {
        session: sessionObj,
        user: {},
        headers: { "user-agent": "test-agent" },
      } as unknown as Request;
      const res = {} as unknown as Response;
      const next = vi.fn();

      authService.sessionSecurityMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe("recordFailedLogin edge cases", () => {
    it("does nothing for non-existent user", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue(null);

      const result = await authService.recordFailedLogin("notfound@test.com");
      expect(result.isOk()).toBe(true);

      expect(userRepository.updateUser).not.toHaveBeenCalled();
    });

    it.skip("handles user with no previous failed attempts", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      const uniqueEmail = "completely-new-user@example.com";

      vi.mocked(userRepository.getUserByEmail).mockResolvedValueOnce({
        id: "unique-user-1",
        failedLoginAttempts: 0,
      } as any);
      vi.mocked(userRepository.updateUser).mockResolvedValueOnce({} as any);

      const result = await authService.recordFailedLogin(uniqueEmail);
      expect(result.isOk()).toBe(true);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        "unique-user-1",
        expect.objectContaining({
          failedLoginAttempts: 1,
        }),
      );
    });
  });

  describe("recordSuccessfulLogin edge cases", () => {
    it("does nothing for non-existent user", async () => {
      const { userRepository } = await import("../../lib/db/repositories/index.js");
      vi.mocked(userRepository.getUserByEmail).mockResolvedValue(null);

      const result = await authService.recordSuccessfulLogin("notfound@test.com");
      expect(result.isOk()).toBe(true);

      expect(userRepository.updateUser).not.toHaveBeenCalled();
    });
  });
});
