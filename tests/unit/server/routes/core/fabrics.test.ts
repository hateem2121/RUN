import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/repositories/index.js", () => ({
  miscRepository: {
    getFabrics: vi.fn(),
    createFabric: vi.fn(),
    updateFabric: vi.fn(),
    deleteFabric: vi.fn(),
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

vi.mock("../../../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateFabrics: vi.fn().mockResolvedValue(true),
  },
}));

import express from "express";
import fabricsRouter from "../../../../../server/routes/core/fabrics.js";
import { miscRepository } from "../../../../../server/services/repositories/index.js";

const app = express();
app.use(express.json());
app.use("/api", fabricsRouter);
app.use((_error: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: "Internal Server Error" });
});

describe("Core Fabrics Routes", () => {
  describe("GET /api/fabrics", () => {
    it("should return a list of fabrics", async () => {
      const mockFabrics = [{ id: 1, name: "Test Fabric" }];
      vi.mocked(miscRepository.getFabrics).mockResolvedValue(mockFabrics as any);

      const response = await request(app).get("/api/fabrics");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFabrics);
      expect(miscRepository.getFabrics).toHaveBeenCalled();
    });
  });

  describe("POST /api/fabrics", () => {
    it("should create a fabric", async () => {
      const newFabric = { id: 1, name: "New Fabric" };
      vi.mocked(miscRepository.createFabric).mockResolvedValue(newFabric as any);

      const response = await request(app)
        .post("/api/fabrics")
        .send({ name: "New Fabric", slug: "new-fabric" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newFabric);
      expect(miscRepository.createFabric).toHaveBeenCalled();
    });
  });

  describe("PUT /api/fabrics/:id", () => {
    it("should update a fabric", async () => {
      const updatedFabric = { id: 1, name: "Updated Fabric" };
      vi.mocked(miscRepository.updateFabric).mockResolvedValue(updatedFabric as any);

      const response = await request(app)
        .put("/api/fabrics/1")
        .send({ name: "Updated Fabric", slug: "updated-fabric" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedFabric);
    });

    it("should return 404 if fabric not found", async () => {
      vi.mocked(miscRepository.updateFabric).mockResolvedValue(undefined as any);

      const response = await request(app)
        .put("/api/fabrics/999")
        .send({ name: "Updated Fabric", slug: "updated-fabric" });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/fabrics/:id", () => {
    it("should partially update a fabric", async () => {
      const updatedFabric = { id: 1, name: "Updated Fabric" };
      vi.mocked(miscRepository.updateFabric).mockResolvedValue(updatedFabric as any);

      const response = await request(app).patch("/api/fabrics/1").send({ name: "Updated Fabric" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedFabric);
    });

    it("should return 404 if fabric not found", async () => {
      vi.mocked(miscRepository.updateFabric).mockResolvedValue(undefined as any);

      const response = await request(app)
        .patch("/api/fabrics/999")
        .send({ name: "Updated Fabric" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/fabrics/:id", () => {
    it("should delete a fabric", async () => {
      vi.mocked(miscRepository.deleteFabric).mockResolvedValue(true as any);

      const response = await request(app).delete("/api/fabrics/1");

      expect(response.status).toBe(204);
      expect(miscRepository.deleteFabric).toHaveBeenCalledWith(1);
    });

    it("should return 404 if fabric not found", async () => {
      vi.mocked(miscRepository.deleteFabric).mockResolvedValue(false as any);

      const response = await request(app).delete("/api/fabrics/999");

      expect(response.status).toBe(404);
    });
  });
});
