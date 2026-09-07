import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InternalError } from "../../../lib/errors.js";

// Mock dependencies
vi.mock("../../../services/system/auth.service.js", () => ({
  authService: {
    requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
  },
}));

vi.mock("../../../middleware/rate-limit-tiers.js", () => ({
  apiTier: vi.fn((_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../../lib/cache/unified-cache.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/cache/unified-cache.js")>();
  return {
    ...actual,
    unifiedCache: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock("../../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../services/cms/footer.service.js", () => ({
  footerService: {
    getFooterConfig: vi.fn(),
    updateFooterConfig: vi.fn(),
  },
}));

import { unifiedCache } from "../../../lib/cache/unified-cache.js";
import footerRouter from "../../../routes/utilities/footer-config.js";
import { footerService } from "../../../services/cms/footer.service.js";

describe("Footer Configuration Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api", footerRouter);
  });

  describe("GET /api/footer", () => {
    it("returns cached config when present in unifiedCache", async () => {
      const cachedData = {
        companyName: "RUN APPAREL CACHED",
        brandText: "RUN APPAREL",
      };
      vi.mocked(unifiedCache.get).mockResolvedValue(cachedData);

      const res = await request(app).get("/api/footer");

      expect(res.status).toBe(200);
      expect(res.headers["x-cache-hit"]).toBe("true");
      expect(res.body.companyName).toBe("RUN APPAREL CACHED");
      expect(footerService.getFooterConfig).not.toHaveBeenCalled();
    });

    it("queries service on cache miss, populates cache with seconds TTL, and returns 200", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValue(null);
      const serviceData = {
        companyName: "RUN APPAREL DB",
        brandText: "RUN APPAREL",
        certifications: [],
      };
      vi.mocked(footerService.getFooterConfig).mockResolvedValue(ok(serviceData as any));

      const res = await request(app).get("/api/footer");

      expect(res.status).toBe(200);
      expect(res.body.companyName).toBe("RUN APPAREL DB");
      expect(unifiedCache.set).toHaveBeenCalledWith("footer:config", serviceData, 3600);
    });

    it("returns error status code when service fails", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValue(null);
      vi.mocked(footerService.getFooterConfig).mockResolvedValue(
        err(new InternalError("Database unreachable")),
      );

      const res = await request(app).get("/api/footer");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Database unreachable");
    });
  });

  describe("PATCH /api/admin/footer", () => {
    it("updates footer config, invalidates cache, and returns 200", async () => {
      const updatedData = {
        id: 1,
        companyName: "UPDATED RUN APPAREL",
      };
      vi.mocked(footerService.updateFooterConfig).mockResolvedValue(ok(updatedData as any));

      const res = await request(app)
        .patch("/api/admin/footer")
        .send({ companyName: "UPDATED RUN APPAREL" });

      expect(res.status).toBe(200);
      expect(res.body.companyName).toBe("UPDATED RUN APPAREL");
      expect(unifiedCache.delete).toHaveBeenCalledWith("footer:config");
    });
  });
});
