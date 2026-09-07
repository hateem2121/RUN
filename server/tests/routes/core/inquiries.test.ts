import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/system/inquiry.service.js", () => ({
  inquiryService: {
    createFromPublicPayload: vi.fn(),
  },
}));

vi.mock("../../../services/system/auth.service.js", () => ({
  authService: {
    requireAdmin: vi.fn((_req, _res, next) => next()),
  },
}));

import express from "express";
import inquiriesRouter from "../../../routes/core/inquiries.js";
import { inquiryService } from "../../../services/system/inquiry.service.js";

const app = express();
app.use(express.json());
app.use("/api", inquiriesRouter);
app.use((error: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ error: error.message || "Internal Server Error" });
});

describe("Core Inquiries Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/inquiries", () => {
    it("should submit an inquiry", async () => {
      const mockInquiry = { id: 1, source: "contact" };
      vi.mocked(inquiryService.createFromPublicPayload).mockResolvedValue(ok(mockInquiry as any));

      const response = await request(app)
        .post("/api/inquiries")
        .send({
          contact: {
            name: "Test User",
            email: "test@example.com",
            message: "Test message",
          },
          source: "contact",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(1);
    });

    it("should accept footer lead inquiry with company and projectDescription instead of name and message", async () => {
      const mockInquiry = { id: 2, source: "footer_form" };
      vi.mocked(inquiryService.createFromPublicPayload).mockResolvedValue(ok(mockInquiry as any));

      const response = await request(app)
        .post("/api/inquiries")
        .send({
          contact: {
            company: "Nike Procurement",
            email: "buyer@nike.com",
            projectDescription: "10,000 unit sustainable recycled polyester hoodies",
          },
          items: [],
          source: "footer_form",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(inquiryService.createFromPublicPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            name: "Nike Procurement",
            email: "buyer@nike.com",
            message: "10,000 unit sustainable recycled polyester hoodies",
          }),
        }),
      );
    });

    it("should validate input schema", async () => {
      const response = await request(app)
        .post("/api/inquiries")
        .send({ contact: { name: "Incomplete" } });

      expect(response.status).toBe(400); // zod-express-middleware defaults to 400
    });

    it("should propagate errors from service", async () => {
      vi.mocked(inquiryService.createFromPublicPayload).mockResolvedValue(
        err(new Error("Service Error") as any),
      );

      const response = await request(app)
        .post("/api/inquiries")
        .send({
          contact: {
            name: "Test User",
            email: "test@example.com",
            message: "Test message",
          },
          source: "contact",
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Service Error");
    });

    it("should quietly trap honeypot bot submissions without creating inquiry", async () => {
      const response = await request(app)
        .post("/api/inquiries")
        .send({
          contact: {
            name: "Spam Bot",
            email: "bot@spam.com",
            message: "Buy cheap viagra",
          },
          b_fax_field: "trapped-bot-payload",
          source: "footer_form",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Inquiry received successfully");
      expect(inquiryService.createFromPublicPayload).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/inquiries/upload-techpack & GET /api/inquiries/techpack/:token", () => {
    it("should reject when no file is uploaded", async () => {
      const response = await request(app).post("/api/inquiries/upload-techpack");
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("No tech-pack file provided");
    });

    it("should reject disallowed file extensions", async () => {
      const exeBuffer = Buffer.from("MZ malicious executable");
      const response = await request(app)
        .post("/api/inquiries/upload-techpack")
        .attach("file", exeBuffer, "malware.exe");

      expect(response.status).toBe(400);
      const errText = response.body.message || response.body.error;
      expect(errText).toContain("File type not allowed");
    });

    it("should accept valid PDF tech-pack upload and allow retrieval via token", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 sample tech pack content for testing");
      const uploadRes = await request(app)
        .post("/api/inquiries/upload-techpack")
        .attach("file", pdfBuffer, "sample_techpack.pdf");

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.token).toBeDefined();
      expect(uploadRes.body.name).toBe("sample_techpack.pdf");

      const token = uploadRes.body.token;

      // Now retrieve the uploaded file using the token
      const downloadRes = await request(app).get(`/api/inquiries/techpack/${token}`);
      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers["content-disposition"]).toContain("sample_techpack.pdf");
      expect(downloadRes.body.toString()).toBe("%PDF-1.4 sample tech pack content for testing");
    });

    it("should return 400 for malformed techpack token format", async () => {
      const response = await request(app).get("/api/inquiries/techpack/malformed-token-123");
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid tech-pack token");
    });

    it("should return 404 for validly formatted but nonexistent techpack token", async () => {
      const response = await request(app).get("/api/inquiries/techpack/tp_nonexistent_token_123");
      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Tech-pack not found or expired");
    });
  });
});
