/**
 * Auth Integration Flow Tests
 * Verifies session retrieval, mock login for testing, and RBAC enforcement.
 */

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupErrorHandling, setupMiddleware } from "../../boot/middleware.js";
import { adminCacheManager } from "../../lib/cache/admin-cache.js";
import { getStorage } from "../../lib/storage-singleton.js";
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
    initialize: () => (_req: any, _res: any, next: any) => next(),
    session: () => (_req: any, _res: any, next: any) => next(),
    authenticate: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  },
}));

describe("Auth Integration Tests", () => {
  let app: express.Express;
  let mockUser: any = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUser = null;
    app = express();
    app.use(express.json());

    // Inject mock user and CSRF bypass middleware
    app.use((req, _res, next) => {
      (req as any)._skipCsrf = true;
      if (mockUser) {
        (req as any).user = mockUser;
      }
      (req as any).isAuthenticated = () => !!(req as any).user;
      (req as any).login = (user: any, cb: any) => {
        mockUser = user;
        cb(null);
      };
      (req as any).logout = (cb: any) => {
        mockUser = null;
        cb(null);
      };
      next();
    });

    // Mock authService.setup to skip real passport strategy/session store init
    vi.spyOn(authService, "setup").mockImplementation(async (app) => {
      app.use((req, _res, next) => {
        (req as any).session = (req as any).session || {};
        next();
      });
    });

    await setupMiddleware(app);

    // Register auth routes
    const apiRouter = express.Router();
    apiRouter.use(authRouter);
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
      vi.mocked(getStorage().getUser).mockResolvedValue(dbUser as any);

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

      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(false);

      const response = await request(app).post("/api/admin/cache/clear").send({ userId: "user-2" });

      expect(response.status).toBe(403);
    });

    it("should allow admins to clear cache", async () => {
      mockUser = {
        id: "admin-1",
        claims: { sub: "admin-1" },
        isAdmin: true,
      };

      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(true);

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
      vi.spyOn(authService, "verifyAdminAccess").mockResolvedValue(true);

      const response = await request(app).get("/api/admin/cache/stats");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("hits");
    });
  });

  describe("GET /api/logout", () => {
    it("should clear session and redirect", async () => {
      mockUser = { id: "test-user" };

      const response = await request(app).get("/api/logout");

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("/");
      expect(mockUser).toBeNull();
    });
  });
});
