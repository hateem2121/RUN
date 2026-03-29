import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { adminCacheManager } from "../../lib/cache/admin-cache.js";
import { MemoryStorage } from "../memory-storage.js";
import { createMockSessionUser, setupTestApp } from "../test-utils.js";

describe("Auth V2 Integration Tests", () => {
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
  });

  describe("GET /api/auth/user", () => {
    it("should return user info for authenticated admin", async () => {
      const res = await request(app)
        .get("/api/auth/user")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(adminUser.email);
      expect(res.body.isAdmin).toBe(true);
    });

    it("should return user info for authenticated regular user", async () => {
      const res = await request(app)
        .get("/api/auth/user")
        .set("X-Test-User", JSON.stringify(regularUser));

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(regularUser.email);
      expect(res.body.isAdmin).toBe(false);
    });

    it("should block unauthenticated requests", async () => {
      const res = await request(app).get("/api/auth/user");
      // test-utils.ts middleware returns 401 if header missing
      expect(res.status).toBe(401);
    });
  });

  describe("Logout redirect", () => {
    it("should redirect on logout", async () => {
      const res = await request(app).get("/api/logout");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/");
    });
  });

  describe("Admin Cache Management", () => {
    it("should allow admin to clear cache", async () => {
      const res = await request(app)
        .post("/api/admin/cache/clear")
        .set("X-Test-User", JSON.stringify(adminUser))
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should allow admin to view cache stats", async () => {
      const res = await request(app)
        .get("/api/admin/cache/stats")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("size");
    });

    it("should block non-admin from cache management", async () => {
      const res = await request(app)
        .post("/api/admin/cache/clear")
        .set("X-Test-User", JSON.stringify(regularUser))
        .send({});

      expect(res.status).toBe(403);
    });
  });
});
