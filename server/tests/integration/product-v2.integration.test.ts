import type { InsertCategory, InsertProduct, UpsertUser } from "@run-remix/shared";
import type { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryStorage } from "../memory-storage.js";
import { createMockSessionUser, setupTestApp } from "../test-utils.js";

describe("Product V2 Integration Tests", () => {
  let app: Express;
  let storage: MemoryStorage;

  beforeEach(async () => {
    storage = new MemoryStorage();
    app = await setupTestApp(storage);

    // Seed data
    await storage.createCategory({
      name: "Activewear",
      slug: "activewear",
      description: "Performance gear",
    } as unknown as InsertCategory);

    await storage.createProduct({
      name: "Running Tee",
      slug: "running-tee",
      description: "Breathable fabric",
      sku: "RT-001",
      categoryId: 1,
      isActive: true,
      isFeatured: true,
      urlPath: "/products/activewear/running-tee",
    } as unknown as InsertProduct);

    await storage.createProduct({
      name: "Gym Shorts",
      slug: "gym-shorts",
      description: "Stretchy shorts",
      sku: "GS-001",
      categoryId: 1,
      isActive: true,
      isFeatured: false,
      urlPath: "/products/activewear/gym-shorts",
    } as unknown as InsertProduct);
  });

  describe("GET /api/products", () => {
    it("should return a list of products", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it("should filter by featured status", async () => {
      const res = await request(app).get("/api/products?featured=true");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Running Tee");
    });

    it("should search products by query", async () => {
      const res = await request(app).get("/api/products?search=Gym");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Gym Shorts");
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return a specific product", async () => {
      const res = await request(app).get("/api/products/1");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Running Tee");
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/products/999");
      expect(res.status).toBe(404);
    });
  });

  describe("RBAC - Mutations", () => {
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
      // We need the admin user to exist in storage for requireRole('admin') -> verifyAdminAccess -> getStorage().getUser()
      await storage.upsertUser({
        id: adminUser.id,
        email: adminUser.email,
        isAdmin: true,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
      } as unknown as UpsertUser);

      await storage.upsertUser({
        id: regularUser.id,
        email: regularUser.email,
        isAdmin: false,
        firstName: regularUser.firstName,
        lastName: regularUser.lastName,
      } as unknown as UpsertUser);
    });

    it("should allow admin to create a product", async () => {
      const newProduct = {
        name: "New Product",
        slug: "new-product",
        description: "Fresh arrival",
        sku: "NP-001",
        categoryId: 1,
        isActive: true,
      };

      const res = await request(app)
        .post("/api/products")
        .set("X-Test-User", JSON.stringify(adminUser))
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("New Product");
    });

    it("should allow admin to update a product", async () => {
      const res = await request(app)
        .patch("/api/products/1")
        .set("X-Test-User", JSON.stringify(adminUser))
        .send({ sku: "UPDATED-SKU" });

      expect(res.status).toBe(200);
      expect(res.body.sku).toBe("UPDATED-SKU");

      // Verify storage state
      const updated = await storage.getProduct(1);
      expect(updated?.sku).toBe("UPDATED-SKU");
    });

    it("should allow admin to delete a product", async () => {
      const res = await request(app)
        .delete("/api/products/1")
        .set("X-Test-User", JSON.stringify(adminUser));

      expect(res.status).toBe(204);

      // Verify soft delete
      const product = await storage.getProductsIncludingDeleted();
      const deletedProduct = product.find((p) => p.id === 1);
      expect(deletedProduct?.deletedAt).not.toBeNull();
    });
  });
});
