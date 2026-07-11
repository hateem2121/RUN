/**
 * Admin Operations Integration Tests
 * Verifies specialized maintenance routes, audit config, and restore operations.
 */

import express from "express";
import { ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupErrorHandling, setupMiddleware } from "../../../server/boot/middleware.js";
import adminRouter from "../../../server/routes/admin/admin.js";
import { adminService } from "../../../server/services/admin/admin.service.js";
import { authService } from "../../../server/services/auth-service.js";

// Mock Storage singleton using factory for correct hoisting
vi.mock("../../../server/lib/storage-singleton.js", () => {
  const mockStore = {
    getMediaAssets: vi.fn(),
    getUser: vi.fn(),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
  return {
    getStorage: () => mockStore,
  };
});

// Mock Admin Service instance
vi.mock("../../../server/services/admin/admin.service.js", () => {
  return {
    AdminService: class {},
    adminService: {
      fixCorruptedMedia: vi.fn(),
      triggerCleanup: vi.fn(),
      updateAuditConfig: vi.fn(),
      restoreCategory: vi.fn(),
      restoreProduct: vi.fn(),
      restoreMediaAsset: vi.fn(),
    },
  };
});

describe("Admin Operations Integration Tests", () => {
  let app: express.Express;
  let mockUser: Record<string, unknown> | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUser = null;
    process.env.BYPASS_RBAC_FOR_TESTING = "false";

    app = express();
    app.use(express.json());

    app.use((req, _res, next) => {
      (req as unknown as Record<string, unknown>)._skipCsrf = true;
      if (mockUser) {
        (req as unknown as Record<string, unknown>).user = mockUser;
      }
      (req as unknown as Record<string, unknown>).isAuthenticated = () =>
        !!(req as unknown as Record<string, unknown>).user;
      next();
    });

    vi.spyOn(authService, "setup").mockResolvedValue(undefined);
    vi.spyOn(authService, "verifyAdminAccess").mockImplementation(async (user: unknown) => {
      return ok(!!(user as Record<string, unknown>)?.isAdmin);
    });

    await setupMiddleware(app);
    app.use("/api/admin", adminRouter);
    setupErrorHandling(app);
  });

  describe("RBAC Enforcement", () => {
    it("should block non-admins from maintenance routes", async () => {
      mockUser = { id: "user-1", isAdmin: false, claims: { sub: "user-1" } };
      const response = await request(app).post("/api/admin/fix-corrupted-media").send({});
      expect(response.status).toBe(403);
    });
  });

  describe("Maintenance Routes", () => {
    beforeEach(() => {
      mockUser = { id: "admin-1", isAdmin: true, claims: { sub: "admin-1" } };
    });

    it("should trigger media fix with valid body", async () => {
      vi.mocked(adminService.fixCorruptedMedia).mockResolvedValue(
        ok({
          fixedCount: 5,
          fixedCategories: ["Cat 1"],
        }),
      );

      const response = await request(app)
        .post("/api/admin/fix-corrupted-media")
        .send({ timeout: 10000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fixedCount).toBe(5);
      expect(adminService.fixCorruptedMedia).toHaveBeenCalled();
    });

    it("should trigger system cleanup", async () => {
      vi.mocked(adminService.triggerCleanup).mockResolvedValue(
        ok({
          cleanedFiles: [],
          orphanedFiles: [],
          spaceSaved: 0,
        }),
      );

      const response = await request(app)
        .post("/api/admin/cleanup/trigger")
        .send({ autoClean: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(adminService.triggerCleanup).toHaveBeenCalled();
    });

    it("should update audit configuration", async () => {
      vi.mocked(adminService.updateAuditConfig).mockResolvedValue(ok(true));

      const response = await request(app)
        .post("/api/admin/system/audit-config")
        .send({ enabled: true, trackedTables: ["products"] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(adminService.updateAuditConfig).toHaveBeenCalled();
    });
  });

  describe("Restore Operations", () => {
    beforeEach(() => {
      mockUser = { id: "admin-1", isAdmin: true, claims: { sub: "admin-1" } };
    });

    it("should restore a deleted category", async () => {
      vi.mocked(adminService.restoreCategory).mockResolvedValue(ok(true));

      const response = await request(app).post("/api/admin/categories/1/restore").send({}); // Needs empty object to satisfy emptyBodySchema

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(adminService.restoreCategory).toHaveBeenCalledWith(expect.any(Object), 1);
    });

    it("should restore a deleted product", async () => {
      vi.mocked(adminService.restoreProduct).mockResolvedValue(ok(true));

      const response = await request(app).post("/api/admin/products/123/restore").send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(adminService.restoreProduct).toHaveBeenCalledWith(expect.any(Object), 123);
    });

    it("should return 422 for invalid ID in restore", async () => {
      const response = await request(app).post("/api/admin/products/invalid/restore").send({});

      expect(response.status).toBe(422);
    });
  });
});
