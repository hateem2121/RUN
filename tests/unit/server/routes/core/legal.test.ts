import { ok } from "neverthrow";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/legal.service.js", () => ({
  legalService: {
    getLegalPolicyBySlug: vi.fn(),
    getLegalPolicies: vi.fn(),
    getLegalPolicy: vi.fn(),
    createLegalPolicy: vi.fn(),
    updateLegalPolicy: vi.fn(),
    deleteLegalPolicy: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/auth-service.js", () => ({
  authService: {
    requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
  },
}));

import express from "express";
import legalRouter from "../../../../../server/routes/core/legal.js";
import { legalService } from "../../../../../server/services/legal.service.js";

const app = express();
app.use(express.json());
app.use("/api", legalRouter);
app.use((error: any, _req: any, res: any, _next: any) => {
  res.status(error.statusCode || 422).json({ error: error.message || "Internal Server Error" });
});

describe("Core Legal Routes", () => {
  describe("GET /api/legal-policies", () => {
    it("should return policies", async () => {
      const mockPolicies = [{ id: 1, title: "Test Policy" }];
      vi.mocked(legalService.getLegalPolicies).mockResolvedValue(ok(mockPolicies) as any);

      const response = await request(app).get("/api/legal-policies");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPolicies);
      expect(legalService.getLegalPolicies).toHaveBeenCalledWith(false);
    });

    it("should return a policy by slug if provided", async () => {
      const mockPolicy = { id: 1, title: "Test Policy", slug: "test" };
      vi.mocked(legalService.getLegalPolicyBySlug).mockResolvedValue(ok(mockPolicy) as any);

      const response = await request(app).get("/api/legal-policies?slug=test");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPolicy);
      expect(legalService.getLegalPolicyBySlug).toHaveBeenCalledWith("test", false);
    });
  });

  describe("GET /api/legal-policies/admin", () => {
    it("should return all policies for admin", async () => {
      const mockPolicies = [{ id: 1, title: "Test Policy" }];
      vi.mocked(legalService.getLegalPolicies).mockResolvedValue(ok(mockPolicies) as any);

      const response = await request(app).get("/api/legal-policies/admin");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPolicies);
      expect(legalService.getLegalPolicies).toHaveBeenCalledWith(true);
    });
  });

  describe("GET /api/legal-policies/:id", () => {
    it("should return a policy by id", async () => {
      const mockPolicy = { id: 1, title: "Test Policy" };
      vi.mocked(legalService.getLegalPolicy).mockResolvedValue(ok(mockPolicy) as any);

      const response = await request(app).get("/api/legal-policies/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPolicy);
      expect(legalService.getLegalPolicy).toHaveBeenCalledWith(1);
    });

    it("should handle invalid id", async () => {
      const response = await request(app).get("/api/legal-policies/abc");
      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/legal-policies", () => {
    it("should create a policy", async () => {
      const newPolicy = { id: 1, title: "New Policy", slug: "new", content: "..." };
      vi.mocked(legalService.createLegalPolicy).mockResolvedValue(ok(newPolicy) as any);

      const response = await request(app)
        .post("/api/legal-policies")
        .send({ title: "New Policy", slug: "new", content: "..." });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newPolicy);
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app).post("/api/legal-policies").send({ invalid: "data" });

      expect(response.status).toBe(422);
    });
  });

  describe("PUT /api/legal-policies/:id", () => {
    it("should update a policy", async () => {
      const updatedPolicy = { id: 1, title: "Updated", slug: "new", content: "..." };
      vi.mocked(legalService.updateLegalPolicy).mockResolvedValue(ok(updatedPolicy) as any);

      const response = await request(app).put("/api/legal-policies/1").send({ title: "Updated" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedPolicy);
    });

    it("should handle invalid id", async () => {
      const response = await request(app).put("/api/legal-policies/abc").send({});
      expect(response.status).toBe(422);
    });
  });

  describe("DELETE /api/legal-policies/:id", () => {
    it("should delete a policy", async () => {
      vi.mocked(legalService.deleteLegalPolicy).mockResolvedValue(ok(true) as any);

      const response = await request(app).delete("/api/legal-policies/1");

      expect(response.status).toBe(204);
      expect(legalService.deleteLegalPolicy).toHaveBeenCalledWith(1);
    });

    it("should handle invalid id", async () => {
      const response = await request(app).delete("/api/legal-policies/abc");
      expect(response.status).toBe(422);
    });
  });
});
