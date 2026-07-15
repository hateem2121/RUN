import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/inquiry-service.js", () => ({
  inquiryService: {
    createFromPublicPayload: vi.fn(),
  },
}));

vi.mock("../../../../../server/middleware/rateLimiter.js", () => ({
  writeRateLimiter: vi.fn((_req: any, _res: any, next: any) => next()),
}));

import express from "express";
import inquiriesRouter from "../../../../../server/routes/core/inquiries.js";
import { inquiryService } from "../../../../../server/services/inquiry-service.js";

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
  });
});
