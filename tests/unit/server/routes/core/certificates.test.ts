import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/repositories/index.js", () => ({
  miscRepository: {
    getCertificates: vi.fn(),
    createCertificate: vi.fn(),
    updateCertificate: vi.fn(),
    deleteCertificate: vi.fn(),
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
import certificatesRouter from "../../../../../server/routes/core/certificates.js";
import { miscRepository } from "../../../../../server/services/repositories/index.js";

const app = express();
app.use(express.json());
app.use("/api", certificatesRouter);
app.use((_error: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: "Internal Server Error" });
});

describe("Core Certificates Routes", () => {
  describe("GET /api/certificates", () => {
    it("should return a list of certificates", async () => {
      const mockCerts = [{ id: 1, name: "Test Cert" }];
      vi.mocked(miscRepository.getCertificates).mockResolvedValue(mockCerts as any);

      const response = await request(app).get("/api/certificates");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCerts);
      expect(miscRepository.getCertificates).toHaveBeenCalled();
    });
  });

  describe("POST /api/certificates", () => {
    it("should create a certificate", async () => {
      const newCert = { id: 1, name: "New Cert", issueDate: "2023-01-01" };
      vi.mocked(miscRepository.createCertificate).mockResolvedValue(newCert as any);

      const response = await request(app)
        .post("/api/certificates")
        .send({ name: "New Cert", issueDate: "2023-01-01" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newCert);
      expect(miscRepository.createCertificate).toHaveBeenCalled();
    });
  });

  describe("PUT /api/certificates/:id", () => {
    it("should update a certificate", async () => {
      const updatedCert = { id: 1, name: "Updated Cert" };
      vi.mocked(miscRepository.updateCertificate).mockResolvedValue(updatedCert as any);

      const response = await request(app).put("/api/certificates/1").send({ name: "Updated Cert" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedCert);
    });

    it("should return 404 if certificate not found", async () => {
      vi.mocked(miscRepository.updateCertificate).mockResolvedValue(undefined as any);

      const response = await request(app)
        .put("/api/certificates/999")
        .send({ name: "Updated Cert" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/certificates/:id", () => {
    it("should delete a certificate", async () => {
      vi.mocked(miscRepository.deleteCertificate).mockResolvedValue(true as any);

      const response = await request(app).delete("/api/certificates/1");

      expect(response.status).toBe(204);
      expect(miscRepository.deleteCertificate).toHaveBeenCalledWith(1);
    });

    it("should return 404 if certificate not found", async () => {
      vi.mocked(miscRepository.deleteCertificate).mockResolvedValue(false as any);

      const response = await request(app).delete("/api/certificates/999");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/sustainability-certificates", () => {
    it("should return only sustainability certificates", async () => {
      const mockCerts = [
        { id: 1, name: "Test Cert 1", showOnSustainabilityPage: true, isActive: true },
        { id: 2, name: "Test Cert 2", showOnSustainabilityPage: false, isActive: true },
        { id: 3, name: "Test Cert 3", showOnSustainabilityPage: true, isActive: false },
      ];
      vi.mocked(miscRepository.getCertificates).mockResolvedValue(mockCerts as any);

      const response = await request(app).get("/api/sustainability-certificates");

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(1);
    });
  });
});
