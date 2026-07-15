import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../server/lib/errors.js";
import { appStorageService } from "../../../server/lib/storage/app-service.js";
import { mediaUploadService } from "../../../server/services/media-upload.service.js";
import { mediaRepository } from "../../../server/services/repositories/index.js";
import { queueMediaProcessing } from "../../../server/services/tasks/media-queue.service.js";
import { webhookService } from "../../../server/services/webhook-service.js";

// Mocks
vi.mock("../../../server/lib/storage/app-service.js", () => ({
  appStorageService: {
    uploadAsset: vi.fn().mockResolvedValue("mocked-url"),
    downloadAsset: vi.fn().mockResolvedValue(Buffer.from("test")),
    deleteAsset: vi.fn().mockResolvedValue(undefined),
    getBucketName: vi.fn().mockReturnValue("test-bucket"),
  },
}));

vi.mock("../../../server/services/repositories/index.js", () => ({
  mediaRepository: {
    createMediaAsset: vi.fn().mockResolvedValue({ id: 1, metadata: {} }),
    updateMediaAsset: vi.fn().mockResolvedValue({ id: 1 }),
    getMediaAsset: vi.fn().mockResolvedValue({ id: 1, storagePath: "test/path" }),
    deleteMediaAsset: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("../../../server/services/tasks/media-queue.service.js", () => ({
  queueMediaProcessing: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../server/services/webhook-service.js", () => ({
  webhookService: {
    trigger: vi.fn(),
  },
}));

vi.mock("../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../server/lib/integrations/gltf-processor.js", () => ({
  isGLTFFile: vi.fn().mockReturnValue(false),
  getGLTFProcessor: vi.fn().mockReturnValue({
    processForUpload: vi
      .fn()
      .mockResolvedValue({ success: true, processedBuffer: Buffer.from("processed") }),
    validateForProductionUpload: vi.fn().mockResolvedValue({ valid: true }),
  }),
}));

describe("MediaUploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initializeUpload", () => {
    it("should initialize a new chunked upload session", async () => {
      const result = await mediaUploadService.initializeUpload(
        "test.txt",
        1024 * 1024 * 5,
        "text/plain",
      ); // 5MB
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty("uploadId");
        expect(result.value).toHaveProperty("chunkSize");
        expect(result.value).toHaveProperty("totalChunks");
      }
    });

    it("should reject files over the size limit", async () => {
      const result = await mediaUploadService.initializeUpload(
        "huge.zip",
        1024 * 1024 * 1024,
        "application/zip",
      ); // 1GB
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(AppError);
        expect(result.error.message).toContain("File size exceeds limit");
      }
    });
  });

  describe("uploadChunk", () => {
    let uploadId: string;
    let chunkSize: number;

    beforeEach(async () => {
      const initResult = await mediaUploadService.initializeUpload(
        "test.txt",
        1024 * 1024 * 2,
        "text/plain",
      );
      if (initResult.isOk()) {
        uploadId = initResult.value.uploadId;
        chunkSize = initResult.value.chunkSize;
      }
    });

    it("should upload a valid chunk", async () => {
      const buffer = Buffer.alloc(chunkSize);
      const result = await mediaUploadService.uploadChunk(uploadId, 0, buffer);
      expect(result.isOk()).toBe(true);
      expect(appStorageService.uploadAsset).toHaveBeenCalled();
    });

    it("should reject chunk if session is not found", async () => {
      const buffer = Buffer.alloc(chunkSize);
      const result = await mediaUploadService.uploadChunk("invalid-id", 0, buffer);
      expect(result.isErr()).toBe(true);
    });

    it("should reject chunk if size exceeds limit", async () => {
      const buffer = Buffer.alloc(chunkSize * 2); // Too large
      const result = await mediaUploadService.uploadChunk(uploadId, 0, buffer);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("exceeds session limit");
      }
    });
  });

  describe("finalizeUpload", () => {
    let uploadId: string;

    beforeEach(async () => {
      const initResult = await mediaUploadService.initializeUpload("test.txt", 4, "text/plain");
      if (initResult.isOk()) {
        uploadId = initResult.value.uploadId;
        const buffer = Buffer.alloc(4);
        await mediaUploadService.uploadChunk(uploadId, 0, buffer);
      }
    });

    it("should finalize upload and create media asset", async () => {
      const result = await mediaUploadService.finalizeUpload(uploadId);
      if (result.isErr()) {
        console.error(result.error);
      }
      expect(result.isOk()).toBe(true);
      expect(appStorageService.downloadAsset).toHaveBeenCalled();
      expect(mediaRepository.createMediaAsset).toHaveBeenCalled();
      expect(queueMediaProcessing).toHaveBeenCalled();
      expect(webhookService.trigger).toHaveBeenCalled();
    });

    it("should fail if chunks are incomplete", async () => {
      const initResult = await mediaUploadService.initializeUpload(
        "incomplete.txt",
        1024 * 1024 * 15,
        "text/plain",
      );
      let newUploadId = "";
      if (initResult.isOk()) {
        newUploadId = initResult.value.uploadId;
        const buffer = Buffer.alloc(initResult.value.chunkSize);
        await mediaUploadService.uploadChunk(newUploadId, 0, buffer);
        // deliberately skipping chunk 1
      }

      const result = await mediaUploadService.finalizeUpload(newUploadId);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Incomplete upload");
      }
    });
  });

  describe("uploadSingleFile", () => {
    it("should upload a single file successfully", async () => {
      const file = {
        originalname: "image.png",
        mimetype: "image/png",
        size: 1024,
        buffer: Buffer.from("image data"),
      } as Express.Multer.File;

      const result = await mediaUploadService.uploadSingleFile(file);
      expect(result.isOk()).toBe(true);
      expect(appStorageService.uploadAsset).toHaveBeenCalled();
      expect(mediaRepository.createMediaAsset).toHaveBeenCalled();
      expect(queueMediaProcessing).toHaveBeenCalled();
    });
  });

  describe("batchDeleteAssets", () => {
    it("should delete multiple assets", async () => {
      const result = await mediaUploadService.batchDeleteAssets(["1", "2"]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.deleted).toBe(2);
      }
      expect(mediaRepository.deleteMediaAsset).toHaveBeenCalledTimes(2);
      expect(appStorageService.deleteAsset).toHaveBeenCalledTimes(2);
    });

    it("should handle rollback if storage deletion fails", async () => {
      vi.mocked(appStorageService.deleteAsset).mockRejectedValueOnce(new Error("Storage fail"));
      const result = await mediaUploadService.batchDeleteAssets(["1"]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.deleted).toBe(0);
        expect(result.value.rolledBack).toBe(1);
      }
      expect(mediaRepository.updateMediaAsset).toHaveBeenCalled();
    });
  });

  describe("batchCreateAssets", () => {
    it("should create multiple assets", async () => {
      const file1 = {
        originalname: "1.png",
        mimetype: "image/png",
        size: 10,
        buffer: Buffer.from("a"),
      } as Express.Multer.File;
      const file2 = {
        originalname: "2.png",
        mimetype: "image/png",
        size: 10,
        buffer: Buffer.from("b"),
      } as Express.Multer.File;

      const result = await mediaUploadService.batchCreateAssets([file1, file2]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
      }
      expect(appStorageService.uploadAsset).toHaveBeenCalledTimes(2);
      expect(mediaRepository.createMediaAsset).toHaveBeenCalledTimes(2);
    });
  });

  describe("uploadBase64", () => {
    it("should upload base64 image", async () => {
      const base64Data =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      const result = await mediaUploadService.uploadBase64(base64Data, "test.png");
      expect(result.isOk()).toBe(true);
      expect(appStorageService.uploadAsset).toHaveBeenCalled();
      expect(mediaRepository.createMediaAsset).toHaveBeenCalled();
    });

    it("should reject invalid base64 format", async () => {
      const result = await mediaUploadService.uploadBase64("invalid-data", "test.png");
      expect(result.isErr()).toBe(true);
    });

    it("should reject unsupported mime type in base64", async () => {
      const result = await mediaUploadService.uploadBase64(
        "data:text/plain;base64,aGVsbG8=",
        "test.txt",
      );
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getUploadProgress & cancelUpload", () => {
    it("should return progress and handle cancellation", async () => {
      const initResult = await mediaUploadService.initializeUpload("test.txt", 100, "text/plain");
      if (initResult.isOk()) {
        const id = initResult.value.uploadId;
        const progress = mediaUploadService.getUploadProgress(id);
        expect(progress.isOk()).toBe(true);
        if (progress.isOk()) {
          expect(progress.value.progress).toBe(0);
        }

        const cancel = mediaUploadService.cancelUpload(id);
        expect(cancel.isOk()).toBe(true);

        const checkAfterCancel = mediaUploadService.getUploadProgress(id);
        expect(checkAfterCancel.isErr()).toBe(true);
      }
    });
  });

  describe("getActiveUploads", () => {
    it("should return list of active uploads", async () => {
      await mediaUploadService.initializeUpload("active1.txt", 100, "text/plain");
      const uploads = mediaUploadService.getActiveUploads();
      expect(uploads.length).toBeGreaterThan(0);
      expect(uploads[0]).toHaveProperty("filename");
    });
  });
});
