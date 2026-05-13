/**
 * Auth Integration Flow Tests
 * Verifies session retrieval, mock login for testing, and RBAC enforcement.
 */

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ok, err } from "neverthrow";
import { setupErrorHandling, setupMiddleware } from "../../boot/middleware.js";
import { adminCacheManager } from "../../lib/cache/admin-cache.js";
import { getStorage } from "../../lib/storage-singleton.js";
import adminRouter from "../../routes/admin/admin.js";
import authRouter from "../../routes/auth.js";
import { authService } from "../../services/auth-service.js";

// Mock external dependencies
vi.mock("../../lib/storage-singleton.js", () => {
  const mockStorage = {
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    upsertUser: vi.fn(),
  };
  return {
    getStorage: () => mockStorage,
    StorageSingleton: {
      getInstance: () => mockStorage,
      hasInstance: () => true,
    },
  };
});

vi.mock("../../lib/cache/admin-cache.js", () => ({
  adminCacheManager: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    clearUser: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(() => ({
      hits: 0,
      misses: 0,
      keys: 0,
    })),
  },
}));

vi.mock("passport", () => ({
  default: {
    initialize: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    session: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    authenticate: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  },
}));

describe("Auth Integration Tests", () => {
  let app: express.Express;
  let mockUser: Record<string, unknown> | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUser = null;
    app = express();
    app.use(express.json());

    // Inject mock user and CSRF bypass middleware
    app.use((req, _res, next) => {
      (req as unknown as Record<string, unknown>)._skipCsrf = true;
      if (mockUser) {
        (req as unknown as Record<string, unknown>).user = mockUser;
      }
      (req as unknown as Record<string, unknown>).isAuthenticated = () =>
        !!(req as unknown as Record<string, unknown>).user;
      (req as unknown as Record<string, unknown>).login = (
        user: Record<string, unknown>,
        cb: (err: null) => void,
      ) => {
        mockUser = user;
        cb(null);
      };
      (req as unknown as Record<string, unknown>).logout = (cb: (err: null) => void) => {
        mockUser = null;
        cb(null);
      };
      next();
    });

    // Mock authService.setup to skip real passport strategy/session store init
    vi.spyOn(authService, "setup").mockImplementation(async (app) => {
      app.use((req, _res, next) => {
        const r = req as unknown as Record<string, unknown>;
        r.session = r.session || {
          destroy: (cb: (err: null) => void) => cb(null),
        };
        next();
      });
    });

    await setupMiddleware(app);

    // Register auth and admin routes
    const apiRouter = express.Router();
    apiRouter.use("/auth", authRouter);
    apiRouter.use("/admin", adminRouter);
    app.use("/api", apiRouter);

    setupErrorHandling(app);
  });

  describe("GET /api/auth/user", () => {
    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/auth/user");
      expect(response.status).toBe(401);
    });

    it("should return mock user information when logged in manually", async () => {
      mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        profileImageUrl: "https://example.com/img.png",
        isAdmin: true,
        claims: { isMock: true, sub: "test-user-id" },
      };

      const response = await request(app).get("/api/auth/user");

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("test@example.com");
      expect(response.body.isAdmin).toBe(true);
    });

    it("should fetch user from storage if not a mock user", async () => {
      mockUser = {
        id: "real-user-id",
        email: "real@example.com",
        firstName: "Real",
        lastName: "User",
        isAdmin: false,
        claims: { sub: "real-user-id" },
      };

      const dbUser = {
        id: "real-user-id",
        email: "real@example.com",
        firstName: "Real",
        lastName: "User",
        isAdmin: false,
      };

      // Use the storage mock instance directly
      vi.mocked(getStorage().getUser).mockResolvedValue(
        dbUser as unknown as Awaited<ReturnType<ReturnType<typeof getStorage>["getUser"]>>,
      );

      const response = await request(app).get("/api/auth/user");

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("real@example.com");
      expect(getStorage().getUser).toHaveBeenCalledWith("real-user-id");
    });
  });

  describe("Admin Cache Management", () => {
    it("should block non-admins from clearing cache", async () => {
      mockUser = {
        id: "user-1",
        claims: { sub: "user-1" },
        isAdmin: false,
      };

      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(ok(false));

      const response = await request(app).post("/api/admin/cache/clear").send({ userId: "user-2" });

      expect(response.status).toBe(403);
    });

    it("should allow admins to clear cache", async () => {
      mockUser = {
        id: "admin-1",
        claims: { sub: "admin-1" },
        isAdmin: true,
      };

      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(ok(true));

      const response = await request(app).post("/api/admin/cache/clear").send({ userId: "user-2" });

      expect(response.status).toBe(200);
      expect(adminCacheManager.clearUser).toHaveBeenCalledWith("user-2");
    });

    it("should allow admins to get cache stats", async () => {
      mockUser = {
        id: "admin-1",
        claims: { sub: "admin-1" },
        isAdmin: true,
      };
      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(ok(true));

      const response = await request(app).get("/api/admin/cache/stats");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("hits");
    });
  });

  describe("GET /api/logout", () => {
    it("should clear session and redirect", async () => {
      mockUser = { id: "test-user" };

      const response = await request(app).get("/api/auth/logout");

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("/");
      expect(mockUser).toBeNull();
    });
  });
});
