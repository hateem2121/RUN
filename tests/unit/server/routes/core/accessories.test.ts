import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/repositories/accessory-repository.js", () => ({
  accessoryRepository: {
    getAccessoriesWithCount: vi.fn(),
    getAccessories: vi.fn(),
    createAccessory: vi.fn(),
    updateAccessory: vi.fn(),
    deleteAccessory: vi.fn(),
  },
}));

vi.mock("../../../../../server/middleware/rbac.js", () => ({
  requireRole: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../../../../server/services/auth-service.js", () => ({
  authService: {
    requireAdmin: (_req: any, _res: any, next: any) => next(),
  },
}));

import express from "express";
import accessoriesRouter from "../../../../../server/routes/core/accessories.js";
import { accessoryRepository } from "../../../../../server/services/repositories/accessory-repository.js";

const app = express();
app.use(express.json());
app.use("/api", accessoriesRouter);
// Basic error handler
app.use((_error: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: "Internal Server Error" });
});

describe("Core Accessories Routes", () => {
  describe("GET /api/accessories", () => {
    it("should return a list of accessories without count", async () => {
      const mockAccessories = [{ id: 1, name: "Test Accessory" }];
      vi.mocked(accessoryRepository.getAccessories).mockResolvedValue(mockAccessories as any);

      const response = await request(app).get("/api/accessories?limit=10&offset=0");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAccessories);
      expect(accessoryRepository.getAccessories).toHaveBeenCalledWith(10, 0, {});
    });

    it("should return a list of accessories with count", async () => {
      const mockResponse = { data: [{ id: 1, name: "Test Accessory" }], total: 1 };
      vi.mocked(accessoryRepository.getAccessoriesWithCount).mockResolvedValue(mockResponse as any);

      const response = await request(app).get("/api/accessories?withCount=true");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(accessoryRepository.getAccessoriesWithCount).toHaveBeenCalledWith(100, 0, {});
    });
  });

  describe("POST /api/accessories", () => {
    it("should create an accessory", async () => {
      const newAcc = { id: 1, name: "New Accessory", price: "10.99" };
      vi.mocked(accessoryRepository.createAccessory).mockResolvedValue(newAcc as any);

      const response = await request(app)
        .post("/api/accessories")
        .send({ name: "New Accessory", slug: "new-accessory", price: "10.99", isActive: true });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newAcc);
      expect(accessoryRepository.createAccessory).toHaveBeenCalled();
    });
  });

  describe("PUT /api/accessories/:id", () => {
    it("should update an accessory", async () => {
      const updatedAcc = { id: 1, name: "Updated Accessory", price: "20.99" };
      vi.mocked(accessoryRepository.updateAccessory).mockResolvedValue(updatedAcc as any);

      const response = await request(app).put("/api/accessories/1").send({
        name: "Updated Accessory",
        slug: "updated-accessory",
        price: "20.99",
        isActive: true,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedAcc);
    });

    it("should return 404 if accessory not found", async () => {
      vi.mocked(accessoryRepository.updateAccessory).mockResolvedValue(undefined as any);

      const response = await request(app).put("/api/accessories/999").send({
        name: "Updated Accessory",
        slug: "updated-accessory",
        price: "20.99",
        isActive: true,
      });

      expect(response.status).toBe(404);
    });

    it("should return 422 if id is invalid", async () => {
      const response = await request(app).put("/api/accessories/abc").send({
        name: "Updated Accessory",
        slug: "updated-accessory",
        price: "20.99",
        isActive: true,
      });
      expect(response.status).toBe(422);
    });
  });

  describe("DELETE /api/accessories/:id", () => {
    it("should delete an accessory", async () => {
      vi.mocked(accessoryRepository.deleteAccessory).mockResolvedValue(true as any);

      const response = await request(app).delete("/api/accessories/1");

      expect(response.status).toBe(204);
      expect(accessoryRepository.deleteAccessory).toHaveBeenCalledWith(1);
    });

    it("should return 404 if accessory not found", async () => {
      vi.mocked(accessoryRepository.deleteAccessory).mockResolvedValue(false as any);

      const response = await request(app).delete("/api/accessories/999");

      expect(response.status).toBe(404);
    });

    it("should return 422 if id is invalid", async () => {
      const response = await request(app).delete("/api/accessories/abc");
      expect(response.status).toBe(422);
    });
  });
});
