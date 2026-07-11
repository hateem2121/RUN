import type { InsertCategory, InsertMediaAsset } from "@run-remix/shared";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { adminCacheManager } from "../../../server/lib/cache/admin-cache.js";
import { MemoryStorage } from "./memory-storage.js";
import { createMockSessionUser, setupTestApp } from "./test-utils.js";

describe("Admin V2 Integration Tests", () => {
  let app: import("express").Express;
  let storage: MemoryStorage;

  const adminUser = createMockSessionUser({
    id: "admin-id",
    email: "admin@wear-run.com",
    isAdmin: true,
  });
  const regularUser = createMockSessionUser({
    id: "user-id",
    email: "user@wear-run.com",
    isAdmin: false,
  });

  beforeEach(async () => {
    storage = new MemoryStorage();
    app = await setupTestApp(storage);
    adminCacheManager.clear();

    // Register users in storage
    await storage.upsertUser(adminUser);
    await storage.upsertUser(regularUser);

    // Seed some data
    await storage.createCategory({
      name: "Tops",
      slug: "tops",
      description: "T-shirts and tanks",
      isActive: true,
    } as unknown as InsertCategory);

    await storage.createMediaAsset({
      filename: "test.jpg",
      originalName: "test.jpg",
      mimeType: "image/jpeg",
      fileSize: 1024,
      type: "image",
      url: "/media/test.jpg",
    } as unknown as InsertMediaAsset);
  });

  describe("RBAC Enforcement", () => {
    it("should block non-admin from accessing admin endpoints", async () => {
      const res = await request(app)
        .get("/api/admin/media-assets")
        .set("X-Test-User", JSON.stringify(regularUser));

      expect(res.status).toBe(403);
    });

    it("should allow admin to access admin endpoints", async () => {
      const res = await request(app)
        .get("/api/admin/media-assets")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe("Media Management", () => {
    it("should return media assets for admin", async () => {
      const res = await request(app)
        .get("/api/admin/media-assets")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(200);
      expect(res.body[0].filename).toBe("test.jpg");
    });
  });

  describe("Product Dashboard Data", () => {
    it("should return initial products data for admin", async () => {
      const res = await request(app)
        .get("/api/admin/products/initial-data")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("products");
      expect(res.body).toHaveProperty("categories");
      expect(res.body).toHaveProperty("mediaAssets");
      expect(res.body.meta.totalCategories).toBe(1);
    });
  });

  describe("Data Restoration", () => {
    it("should restore a soft-deleted category", async () => {
      // 1. Create and delete a category
      const cat = await storage.createCategory({
        name: "Deleted",
        slug: "deleted",
      } as unknown as InsertCategory);
      await storage.deleteCategory(cat.id);

      const deletedCat = await storage.getCategory(cat.id);
      expect(deletedCat?.deletedAt).not.toBeNull();

      // 2. Restore via API
      const res = await request(app)
        .post(`/api/admin/categories/${cat.id}/restore`)
        .set("X-Test-User", JSON.stringify(adminUser))
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 3. Verify in storage
      const restoredCat = await storage.getCategory(cat.id);
      expect(restoredCat?.deletedAt).toBeNull();
    });
  });

  describe("Audit Configuration", () => {
    it("should return audit configuration", async () => {
      const res = await request(app)
        .get("/api/admin/audit-config")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);
      expect(Array.isArray(res.body.trackedTables)).toBe(true);
    });

    it("should update audit configuration", async () => {
      const res = await request(app)
        .post("/api/admin/audit-config")
        .set("X-Test-User", JSON.stringify(adminUser))
        .send({
          enabled: false,
          trackedTables: ["products"],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("System Operations", () => {
    it("should trigger storage cleanup", async () => {
      const res = await request(app)
        .post("/api/admin/cleanup/trigger")
        .set("X-Test-User", JSON.stringify(adminUser))
        .send({ autoClean: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("report");
    });

    it("should provide a test endpoint", async () => {
      const res = await request(app)
        .get("/api/admin/test")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("API routing works");
    });
  });
});
