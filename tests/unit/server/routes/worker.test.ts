import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheOperations } from "../../../../server/lib/cache/cache-strategies";
import { isImageFile } from "../../../../server/lib/image-processor";
import { emailService } from "../../../../server/lib/integrations/email-service";
import { appStorageService } from "../../../../server/lib/storage/app-service";
import workerRouter from "../../../../server/routes/worker";
import { mediaService } from "../../../../server/services/media.service";

vi.mock("zod-express-middleware", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../../../server/lib/verify-cloud-task-token", () => ({
  verifyCloudTaskToken: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../../../server/services/job-metrics.service", () => ({
  workerTaskDuration: {
    observe: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/integrations/email-service", () => ({
  emailService: {
    sendAdminNotification: vi.fn(),
    sendCustomerConfirmation: vi.fn(),
  },
}));

vi.mock("../../../../server/services/media.service", () => ({
  mediaService: {
    getAssetById: vi.fn(),
    updateAsset: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/storage/app-service", () => ({
  appStorageService: {
    downloadAsset: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/cache/cache-strategies", () => ({
  CacheOperations: {
    invalidateHomepage: vi.fn(),
    invalidateManufacturing: vi.fn(),
    invalidateCategories: vi.fn(),
    invalidateProducts: vi.fn(),
    invalidateAbout: vi.fn(),
    invalidateSustainability: vi.fn(),
    invalidateTechnology: vi.fn(),
    invalidateContact: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/image-processor", () => ({
  isImageFile: vi.fn(),
  processImage: vi.fn(),
  generateResponsiveVariants: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/", workerRouter);

describe("Worker Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
    });
  });

  describe("POST /send-email", () => {
    const validEmailData = {
      id: "inq-123",
      name: "Test Name",
      email: "test@example.com",
      message: "Hello",
    };

    it("should send both admin and customer emails and return 200", async () => {
      vi.mocked(emailService.sendAdminNotification).mockResolvedValue(ok(true) as any);
      vi.mocked(emailService.sendCustomerConfirmation).mockResolvedValue(ok(true) as any);

      const response = await request(app).post("/send-email").send(validEmailData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 500 if an email fails", async () => {
      vi.mocked(emailService.sendAdminNotification).mockResolvedValue(
        err(new Error("Failed")) as any,
      );
      vi.mocked(emailService.sendCustomerConfirmation).mockResolvedValue(ok(true) as any);

      const response = await request(app).post("/send-email").send(validEmailData);

      expect(response.status).toBe(500);
    });
  });

  describe("POST /process-media", () => {
    const validMediaData = {
      mediaId: "123",
      operation: "optimize",
    };

    it("should return 200 early if asset not found", async () => {
      vi.mocked(mediaService.getAssetById).mockResolvedValue(err(new Error("Not found")) as any);

      const response = await request(app).post("/process-media").send(validMediaData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Asset not found");
    });

    it("should return 200 with success if operation finishes", async () => {
      vi.mocked(mediaService.getAssetById).mockResolvedValue(
        ok({
          id: 123,
          storagePath: "test.jpg",
          mimeType: "image/jpeg",
          filename: "test.jpg",
        }) as any,
      );
      vi.mocked(appStorageService.downloadAsset).mockResolvedValue(Buffer.from("test") as any);
      vi.mocked(mediaService.updateAsset).mockResolvedValue(ok(true) as any);
      vi.mocked(isImageFile).mockReturnValue(false);

      const response = await request(app).post("/process-media").send(validMediaData);
      expect(response.status).toBe(200);
    });

    it("should return 500 if an error is thrown", async () => {
      vi.mocked(mediaService.getAssetById).mockRejectedValue(new Error("DB failure"));

      const response = await request(app).post("/process-media").send(validMediaData);
      expect(response.status).toBe(500);
    });
  });

  describe("POST /invalidate-cache", () => {
    it("should call the correct cache invalidation method based on target", async () => {
      const response = await request(app).post("/invalidate-cache").send({ target: "homepage" });
      expect(response.status).toBe(200);
      expect(CacheOperations.invalidateHomepage).toHaveBeenCalled();
    });

    it("should pass id if provided", async () => {
      const response = await request(app)
        .post("/invalidate-cache")
        .send({ target: "products", id: 456 });
      expect(response.status).toBe(200);
      expect(CacheOperations.invalidateProducts).toHaveBeenCalledWith(456);
    });

    it("should return 500 on failure", async () => {
      vi.mocked(CacheOperations.invalidateCategories).mockRejectedValue(new Error("Cache error"));
      const response = await request(app).post("/invalidate-cache").send({ target: "categories" });
      expect(response.status).toBe(500);
    });
  });
});
