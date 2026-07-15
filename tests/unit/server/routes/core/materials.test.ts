import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/repositories/index.js", () => ({
  miscRepository: {
    getFibers: vi.fn(),
    createFiber: vi.fn(),
    updateFiber: vi.fn(),
    deleteFiber: vi.fn(),
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
    invalidateFibers: vi.fn().mockResolvedValue(true),
  },
}));

import express from "express";
import materialsRouter from "../../../../../server/routes/core/materials.js";
import { miscRepository } from "../../../../../server/services/repositories/index.js";

const app = express();
app.use(express.json());
app.use("/api", materialsRouter);
app.use((_error: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: "Internal Server Error" });
});

describe("Core Materials Routes", () => {
  describe("GET /api/fibers", () => {
    it("should return a list of fibers", async () => {
      const mockFibers = [{ id: 1, name: "Test Fiber" }];
      vi.mocked(miscRepository.getFibers).mockResolvedValue(mockFibers as any);

      const response = await request(app).get("/api/fibers");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFibers);
      expect(miscRepository.getFibers).toHaveBeenCalled();
    });
  });

  describe("POST /api/fibers", () => {
    it("should create a fiber", async () => {
      const newFiber = { id: 1, name: "New Fiber" };
      vi.mocked(miscRepository.createFiber).mockResolvedValue(newFiber as any);

      const response = await request(app).post("/api/fibers").send({
        name: "New Fiber",
        type: "natural",
        slug: "new-fiber",
        description: "desc",
        isActive: true,
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newFiber);
      expect(miscRepository.createFiber).toHaveBeenCalled();
    });
  });

  describe("PUT /api/fibers/:id", () => {
    it("should update a fiber", async () => {
      const updatedFiber = { id: 1, name: "Updated Fiber" };
      vi.mocked(miscRepository.updateFiber).mockResolvedValue(updatedFiber as any);

      const response = await request(app).put("/api/fibers/1").send({ name: "Updated Fiber" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedFiber);
    });

    it("should return 404 if fiber not found", async () => {
      vi.mocked(miscRepository.updateFiber).mockResolvedValue(undefined as any);

      const response = await request(app).put("/api/fibers/999").send({ name: "Updated Fiber" });

      expect(response.status).toBe(404);
    });

    it("should return 422 for invalid id", async () => {
      const response = await request(app).put("/api/fibers/abc").send({});
      expect(response.status).toBe(422);
    });
  });

  describe("DELETE /api/fibers/:id", () => {
    it("should delete a fiber", async () => {
      vi.mocked(miscRepository.deleteFiber).mockResolvedValue(true as any);

      const response = await request(app).delete("/api/fibers/1");

      expect(response.status).toBe(204);
      expect(miscRepository.deleteFiber).toHaveBeenCalledWith(1);
    });

    it("should return 404 if fiber not found", async () => {
      vi.mocked(miscRepository.deleteFiber).mockResolvedValue(false as any);

      const response = await request(app).delete("/api/fibers/999");

      expect(response.status).toBe(404);
    });

    it("should return 422 for invalid id", async () => {
      const response = await request(app).delete("/api/fibers/abc");
      expect(response.status).toBe(422);
    });
  });
});
