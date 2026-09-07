import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheOperations } from "../../lib/cache/cache-strategies";
import { isImageFile } from "../../lib/image-processor";
import { emailService } from "../../lib/integrations/email-service";
import { appStorageService } from "../../lib/storage/app-service";
import workerRouter from "../../routes/worker";
import { mediaService } from "../../services/media/media.service";
import {
  deadLetterQueueService,
  UnrecoverableWorkerError,
} from "../../services/worker/dead-letter-queue";

vi.mock("zod-express-middleware", () => ({
  validateRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../../lib/verify-cloud-task-token", () => ({
  verifyCloudTaskToken: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../services/system/job-metrics.service", () => ({
  workerTaskDuration: {
    observe: vi.fn(),
  },
}));

vi.mock("../../lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../lib/integrations/email-service", () => ({
  emailService: {
    sendAdminNotification: vi.fn(),
    sendCustomerConfirmation: vi.fn(),
  },
}));

vi.mock("../../services/media/media.service", () => ({
  mediaService: {
    getAssetById: vi.fn(),
    updateAsset: vi.fn(),
  },
}));

vi.mock("../../lib/storage/app-service", () => ({
  appStorageService: {
    downloadAsset: vi.fn(),
  },
}));

vi.mock("../../lib/cache/cache-strategies", () => ({
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

vi.mock("../../lib/image-processor", () => ({
  isImageFile: vi.fn(),
  processImage: vi.fn(),
  generateResponsiveVariants: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/", workerRouter);

describe("Worker Routes", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await deadLetterQueueService.clear();
  });

  describe("GET /health", () => {
    it("should return health status and structured metrics", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.metrics).toBeDefined();
      expect(typeof response.body.metrics.worker_tasks_queued).toBe("number");
      expect(typeof response.body.metrics.worker_concurrency_active).toBe("number");
      expect(typeof response.body.metrics.worker_dlq_count).toBe("number");
    });
  });

  describe("POST /send-email", () => {
    const validEmailData = {
      id: 123,
      name: "Test Name",
      email: "test@example.com",
      message: "Hello",
    };

    it("should send both admin and customer emails and return 200", async () => {
      vi.mocked(emailService.sendAdminNotification).mockResolvedValue(ok(true) as never);
      vi.mocked(emailService.sendCustomerConfirmation).mockResolvedValue(ok(true) as never);

      const response = await request(app).post("/send-email").send(validEmailData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 500 if an email fails and retries <= 5", async () => {
      vi.mocked(emailService.sendAdminNotification).mockResolvedValue(
        err(new Error("Failed")) as never,
      );
      vi.mocked(emailService.sendCustomerConfirmation).mockResolvedValue(ok(true) as never);

      const response = await request(app)
        .post("/send-email")
        .set("x-cloudtasks-taskretrycount", "2")
        .send(validEmailData);

      expect(response.status).toBe(500);
    });

    it("should capture to DLQ and return 200 with status dead_lettered when retries > 5", async () => {
      vi.mocked(emailService.sendAdminNotification).mockResolvedValue(
        err(new Error("Failed")) as never,
      );

      const response = await request(app)
        .post("/send-email")
        .set("x-cloudtasks-taskretrycount", "6")
        .send(validEmailData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("dead_lettered");
      expect(response.body.reason).toMatch(/retry/i);
      expect(deadLetterQueueService.getDlqCount()).toBe(1);
    });
  });

  describe("POST /process-media", () => {
    const validMediaData = {
      mediaId: "123",
      operation: "optimize",
    };

    it("should return 200 early if asset not found", async () => {
      vi.mocked(mediaService.getAssetById).mockResolvedValue(err(new Error("Not found")) as never);

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
        }) as never,
      );
      vi.mocked(appStorageService.downloadAsset).mockResolvedValue(Buffer.from("test") as never);
      vi.mocked(mediaService.updateAsset).mockResolvedValue(ok(true) as never);
      vi.mocked(isImageFile).mockReturnValue(false);

      const response = await request(app).post("/process-media").send(validMediaData);
      expect(response.status).toBe(200);
    });

    it("should return 500 if an error is thrown and retries <= 5", async () => {
      vi.mocked(mediaService.getAssetById).mockRejectedValue(new Error("DB failure"));

      const response = await request(app).post("/process-media").send(validMediaData);
      expect(response.status).toBe(500);
    });

    it("should return 200 and DLQ when retries > 5", async () => {
      const response = await request(app)
        .post("/process-media")
        .set("x-cloudtasks-taskretrycount", "7")
        .send(validMediaData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("dead_lettered");
      expect(deadLetterQueueService.getDlqCount()).toBe(1);
    });

    it("should return 200 and DLQ on unrecoverable error during execution", async () => {
      vi.mocked(mediaService.getAssetById).mockRejectedValue(
        new UnrecoverableWorkerError("Corrupt media record"),
      );

      const response = await request(app).post("/process-media").send(validMediaData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("dead_lettered");
      expect(response.body.reason).toBe("Corrupt media record");
      expect(deadLetterQueueService.getDlqCount()).toBe(1);
    });
  });

  describe("POST /generate-derivatives", () => {
    it("should generate responsive variants and return 200", async () => {
      vi.mocked(mediaService.getAssetById).mockResolvedValue(
        ok({
          id: 456,
          storagePath: "hero.png",
          mimeType: "image/png",
          filename: "hero.png",
        }) as never,
      );
      vi.mocked(appStorageService.downloadAsset).mockResolvedValue(Buffer.from("hero") as never);
      vi.mocked(isImageFile).mockReturnValue(true);
      vi.mocked(mediaService.updateAsset).mockResolvedValue(ok(true) as never);

      const response = await request(app).post("/generate-derivatives").send({ mediaId: "456" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.mediaId).toBe(456);
    });

    it("should dead-letter when retries > 5", async () => {
      const response = await request(app)
        .post("/generate-derivatives")
        .set("x-cloudtasks-taskretrycount", "8")
        .send({ mediaId: "456" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("dead_lettered");
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

    it("should return 500 on failure when retries <= 5", async () => {
      vi.mocked(CacheOperations.invalidateCategories).mockRejectedValue(new Error("Cache error"));
      const response = await request(app).post("/invalidate-cache").send({ target: "categories" });
      expect(response.status).toBe(500);
    });

    it("should dead-letter and return 200 when retries > 5", async () => {
      const response = await request(app)
        .post("/invalidate-cache")
        .set("x-cloudtasks-taskretrycount", "6")
        .send({ target: "categories" });
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("dead_lettered");
    });
  });
});
