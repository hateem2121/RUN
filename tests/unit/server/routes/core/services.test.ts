import { ok } from "neverthrow";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/services.service.js", () => ({
  servicesService: {
    getServices: vi.fn(),
    getService: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn(),
    reorderServices: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/auth-service.js", () => ({
  authService: {
    requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
  },
}));

import express from "express";
import servicesRouter from "../../../../../server/routes/core/services.js";
import { servicesService } from "../../../../../server/services/services.service.js";

const app = express();
app.use(express.json());
app.use("/api", servicesRouter);
app.use((error: any, _req: any, res: any, _next: any) => {
  res.status(error.statusCode || 500).json({ error: error.message || "Internal Server Error" });
});

describe("Core Services Routes", () => {
  describe("GET /api/services", () => {
    it("should return services", async () => {
      const mockServices = [{ id: 1, name: "Test Service" }];
      vi.mocked(servicesService.getServices).mockResolvedValue(ok(mockServices) as any);

      const response = await request(app).get("/api/services");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServices);
      expect(servicesService.getServices).toHaveBeenCalledWith(false);
    });
  });

  describe("GET /api/services/admin", () => {
    it("should return services for admin", async () => {
      const mockServices = [{ id: 1, name: "Test Service" }];
      vi.mocked(servicesService.getServices).mockResolvedValue(ok(mockServices) as any);

      const response = await request(app).get("/api/services/admin");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServices);
      expect(servicesService.getServices).toHaveBeenCalledWith(true);
    });
  });

  describe("GET /api/services/:id", () => {
    it("should return a service by id", async () => {
      const mockService = { id: 1, name: "Test Service" };
      vi.mocked(servicesService.getService).mockResolvedValue(ok(mockService) as any);

      const response = await request(app).get("/api/services/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockService);
      expect(servicesService.getService).toHaveBeenCalledWith(1);
    });

    it("should handle invalid id", async () => {
      const response = await request(app).get("/api/services/abc");
      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/services", () => {
    it("should create a service", async () => {
      const newService = {
        id: 1,
        title: "New Service",
        slug: "new-service",
        description: "desc",
        isActive: true,
      };
      vi.mocked(servicesService.createService).mockResolvedValue(ok(newService) as any);

      const response = await request(app)
        .post("/api/services")
        .send({ title: "New Service", iconName: "star", description: "desc", isActive: true });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newService);
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app).post("/api/services").send({ invalid: "data" });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/services/reorder", () => {
    it("should reorder services", async () => {
      vi.mocked(servicesService.reorderServices).mockResolvedValue(ok(true) as any);

      const response = await request(app)
        .put("/api/services/reorder")
        .send({ orderedIds: [1, 2, 3] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("PUT /api/services/:id", () => {
    it("should update a service", async () => {
      const updatedService = { id: 1, title: "Updated Service" };
      vi.mocked(servicesService.updateService).mockResolvedValue(ok(updatedService) as any);

      const response = await request(app).put("/api/services/1").send({ title: "Updated Service" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedService);
    });
  });

  describe("DELETE /api/services/:id", () => {
    it("should delete a service", async () => {
      vi.mocked(servicesService.deleteService).mockResolvedValue(ok(true) as any);

      const response = await request(app).delete("/api/services/1");

      expect(response.status).toBe(204);
      expect(servicesService.deleteService).toHaveBeenCalledWith(1);
    });
  });
});
