import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleUploadError, validateMagicNumbers } from "../../../../server/lib/multer-optimized";

// Mock DOMPurify as it's used for SVG validation
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: vi.fn((str) => str),
  },
}));

describe("Multer Optimized", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { files: [], file: undefined } as any;
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    next = vi.fn();
  });

  describe("validateMagicNumbers", () => {
    // Helper to create a mock file
    const createMockFile = (mimetype: string, originalname: string, bufferBytes: number[]) =>
      ({
        mimetype,
        originalname,
        buffer: Buffer.from(bufferBytes),
        size: bufferBytes.length,
        fieldname: "file",
      }) as Express.Multer.File;

    it("should allow valid JPEG files", () => {
      req.file = createMockFile("image/jpeg", "test.jpg", [0xff, 0xd8, 0xff, 0x00]);
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject invalid JPEG files", () => {
      req.file = createMockFile("image/jpeg", "test.jpg", [0x00, 0x00, 0x00, 0x00]);
      validateMagicNumbers(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("File signature mismatch"),
        }),
      );
    });

    it("should allow valid PNG files", () => {
      req.file = createMockFile(
        "image/png",
        "test.png",
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      );
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow valid GLB files", () => {
      req.file = createMockFile("model/gltf-binary", "model.glb", [0x67, 0x6c, 0x54, 0x46]);
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow valid PDF files", () => {
      req.file = createMockFile("application/pdf", "doc.pdf", [0x25, 0x50, 0x44, 0x46]);
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow valid SVG files and sanitize them", () => {
      req.file = createMockFile(
        "image/svg+xml",
        "icon.svg",
        Buffer.from("<svg></svg>").toJSON().data,
      );
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow unknown mimetypes (no known signature)", () => {
      req.file = createMockFile("application/x-unknown", "unknown.ext", [0x01, 0x02, 0x03]);
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should check file extension signatures for octet-stream files", () => {
      req.file = createMockFile(
        "application/octet-stream",
        "test.png",
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      );
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should reject octet-stream files with wrong signature for extension", () => {
      req.file = createMockFile("application/octet-stream", "test.png", [0x00, 0x00, 0x00]); // Not a PNG
      validateMagicNumbers(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should allow octet-stream chunk files without signature validation", () => {
      req.file = createMockFile("application/octet-stream", "chunk-123", [0x00, 0x00, 0x00]);
      validateMagicNumbers(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should reject files exceeding their size limit", () => {
      // Image limit is 25MB
      const largeBuffer = Buffer.alloc(26 * 1024 * 1024, 0);
      // Need valid JPEG header to pass signature check
      largeBuffer[0] = 0xff;
      largeBuffer[1] = 0xd8;
      largeBuffer[2] = 0xff;

      req.file = {
        mimetype: "image/jpeg",
        originalname: "huge.jpg",
        buffer: largeBuffer,
        size: largeBuffer.length,
        fieldname: "file",
      } as any;

      validateMagicNumbers(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Size exceeds"),
        }),
      );
    });
  });

  describe("handleUploadError", () => {
    it("should handle LIMIT_FILE_SIZE error", () => {
      const error = new multer.MulterError("LIMIT_FILE_SIZE");
      handleUploadError(error, req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle LIMIT_FILE_COUNT error", () => {
      const error = new multer.MulterError("LIMIT_FILE_COUNT");
      handleUploadError(error, req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Too many files"),
        }),
      );
    });

    it("should handle LIMIT_UNEXPECTED_FILE error", () => {
      const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
      handleUploadError(error, req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle custom file type allowed error", () => {
      const error = new Error("File type not allowed: text/html");
      handleUploadError(error, req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "File type not allowed: text/html",
        }),
      );
    });

    it("should pass other errors to next", () => {
      const error = new Error("Unknown error");
      handleUploadError(error, req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
