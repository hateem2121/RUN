import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminCacheManager } from "../../lib/cache/admin-cache.js";
import { getStorage } from "../../lib/storage-singleton.js";
import type { SessionUser } from "../../types/session.js";
// @ts-expect-error - We are testing private/protected methods or Just need strict types
import { AuthErrors, authService } from "../auth-service.js";

// Mock dependencies
vi.mock("../../lib/storage-singleton.js", () => ({
  getStorage: vi.fn(),
}));

vi.mock("../../lib/cache/admin-cache.js", () => ({
  adminCacheManager: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../lib/secrets/secret-manager.js", () => ({
  getSecret: vi.fn().mockReturnValue("test-secret"),
}));

describe("AuthService", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      user: undefined,
      session: {
        destroy: vi.fn((cb) => cb && cb(null)),
        regenerate: vi.fn((cb) => cb && cb(null)),
        save: vi.fn((cb) => cb && cb(null)),
        cookie: {},
      } as any,
      headers: {
        "user-agent": "test-agent",
      },
      ip: "127.0.0.1",
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();
  });

  describe("isAuthenticated", () => {
    it("calls next() if authenticated", () => {
      // @ts-expect-error
      req.isAuthenticated.mockReturnValue(true);
      authService.isAuthenticated(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("returns 401 if not authenticated", () => {
      // @ts-expect-error
      req.isAuthenticated.mockReturnValue(false);
      authService.isAuthenticated(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("returns SESSION_EXPIRED if not authenticated", async () => {
      // @ts-expect-error
      req.isAuthenticated.mockReturnValue(false);
      await authService.requireAdmin(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: AuthErrors.SESSION_EXPIRED,
        }),
      );
    });

    it("checks cache using sub claim", async () => {
      const user = { claims: { sub: "user-123" } } as SessionUser;
      // @ts-expect-error
      req.isAuthenticated.mockReturnValue(true);
      req.user = user;

      vi.mocked(adminCacheManager.get).mockReturnValue(true);

      await authService.requireAdmin(req as Request, res as Response, next);

      expect(adminCacheManager.get).toHaveBeenCalledWith("user-123");
      expect(next).toHaveBeenCalled();
    });

    it("returns ADMIN_REQUIRED if cache says false", async () => {
      const user = { claims: { sub: "user-123" } } as SessionUser;
      // @ts-expect-error
      req.isAuthenticated.mockReturnValue(true);
      req.user = user;

      vi.mocked(adminCacheManager.get).mockReturnValue(false);

      await authService.requireAdmin(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: AuthErrors.ADMIN_REQUIRED,
        }),
      );
    });

    it("checks DB if cache miss", async () => {
      const user = { claims: { sub: "user-123" } } as SessionUser;
      // @ts-expect-error
      req.isAuthenticated.mockReturnValue(true);
      req.user = user;

      vi.mocked(adminCacheManager.get).mockReturnValue(null);
      const mockGetUser = vi.fn().mockResolvedValue({ isAdmin: true });
      vi.mocked(getStorage).mockReturnValue({ getUser: mockGetUser } as any);

      await authService.requireAdmin(req as Request, res as Response, next);

      expect(mockGetUser).toHaveBeenCalledWith("user-123");
      expect(adminCacheManager.set).toHaveBeenCalledWith("user-123", true);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("sessionSecurityMiddleware", () => {
    it("skips if no session or user", () => {
      req.session = undefined;
      authService.sessionSecurityMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("initializes uaHash on first request", () => {
      const user = { claims: { sub: "user-123" } } as SessionUser;
      req.user = user;
      req.session = { uaHash: undefined } as any; // Empty session

      authService.sessionSecurityMiddleware(req as Request, res as Response, next);

      expect(req.session!.uaHash).toBeDefined();
      expect(req.session!.uaHash).toHaveLength(16);
      expect(next).toHaveBeenCalled();
    });

    it("destroys session on UA mismatch", () => {
      const user = { claims: { sub: "user-123" } } as SessionUser;
      req.user = user;

      const destroyMock = vi.fn().mockImplementation((cb) => {
        if (cb) cb(null);
      });

      req.session = {
        uaHash: "old-hash",
        destroy: destroyMock,
      } as any;

      // Different UA than what produced 'old-hash'
      req.headers = { "user-agent": "new-agent" };

      authService.sessionSecurityMiddleware(req as Request, res as Response, next);

      expect(destroyMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      // We check for the specific object returned by logic
      expect(res.json).toHaveBeenCalledWith(AuthErrors.SESSION_UA_MISMATCH);
    });

    it("rotates session after interval", () => {
      const user = { claims: { sub: "user-123" } } as SessionUser;
      req.user = user;

      const now = 1700000000000;
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const oldTime = now - 16 * 60 * 1000; // 16 mins ago (interval is 15)

      const regenerateMock = vi.fn().mockImplementation((cb) => cb(null));
      const saveMock = vi.fn().mockImplementation((cb) => cb(null));

      req.session = {
        uaHash: undefined, // Let it reset, logic handles it.
        // Wait, if uaHash is missing, it sets it.
        // But rotation check comes AFTER uaHash check.
        // So we need uaHash to be set to MATCH current UA, otherwise it destroys.
        // Let's rely on the fact that if uaHash is unset, it sets it and continues.
        // Then it checks rotation.
        lastRotated: oldTime,
        passport: { user },
        regenerate: regenerateMock,
        save: saveMock,
      } as any;

      req.headers = { "user-agent": "test-agent" };

      authService.sessionSecurityMiddleware(req as Request, res as Response, next);

      expect(regenerateMock).toHaveBeenCalled();
      // save should be called inside regenerate callback
      expect(saveMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
