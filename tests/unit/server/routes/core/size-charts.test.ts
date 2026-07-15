import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/repositories/index.js", () => ({
  miscRepository: {
    getSizeCharts: vi.fn(),
    createSizeChart: vi.fn(),
    updateSizeChart: vi.fn(),
    deleteSizeChart: vi.fn(),
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
import sizeChartsRouter from "../../../../../server/routes/core/size-charts.js";
import { miscRepository } from "../../../../../server/services/repositories/index.js";

const app = express();
app.use(express.json());
app.use("/api", sizeChartsRouter);
app.use((_error: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: "Internal Server Error" });
});

describe("Core Size Charts Routes", () => {
  describe("GET /api/size-charts", () => {
    it("should return a list of size charts", async () => {
      const mockCharts = [{ id: 1, name: "Mens Top" }];
      vi.mocked(miscRepository.getSizeCharts).mockResolvedValue(mockCharts as any);

      const response = await request(app).get("/api/size-charts");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCharts);
      expect(miscRepository.getSizeCharts).toHaveBeenCalled();
    });
  });

  describe("POST /api/size-charts", () => {
    it("should create a size chart", async () => {
      const newChart = { id: 1, name: "Womens Top" };
      vi.mocked(miscRepository.createSizeChart).mockResolvedValue(newChart as any);

      const response = await request(app)
        .post("/api/size-charts")
        .send({ name: "Womens Top", categoryId: 1, structure: [] });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newChart);
      expect(miscRepository.createSizeChart).toHaveBeenCalled();
    });
  });

  describe("PUT /api/size-charts/:id", () => {
    it("should update a size chart", async () => {
      const updatedChart = { id: 1, name: "Updated Chart" };
      vi.mocked(miscRepository.updateSizeChart).mockResolvedValue(updatedChart as any);

      const response = await request(app).put("/api/size-charts/1").send({ name: "Updated Chart" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedChart);
    });

    it("should return 404 if size chart not found", async () => {
      vi.mocked(miscRepository.updateSizeChart).mockResolvedValue(undefined as any);

      const response = await request(app)
        .put("/api/size-charts/999")
        .send({ name: "Updated Chart" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/size-charts/:id", () => {
    it("should delete a size chart", async () => {
      vi.mocked(miscRepository.deleteSizeChart).mockResolvedValue(true as any);

      const response = await request(app).delete("/api/size-charts/1");

      expect(response.status).toBe(204);
      expect(miscRepository.deleteSizeChart).toHaveBeenCalledWith(1);
    });

    it("should return 404 if size chart not found", async () => {
      vi.mocked(miscRepository.deleteSizeChart).mockResolvedValue(false as any);

      const response = await request(app).delete("/api/size-charts/999");

      expect(response.status).toBe(404);
    });
  });
});
