import { beforeEach, describe, expect, it, vi } from "vitest";
import { footerService } from "../../services/cms/footer.service.js";

// Mock DB
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

vi.mock("../../db.js", () => ({
  db: {
    select: () => ({
      from: (_table: any) => ({
        orderBy: () => ({
          limit: mockLimit,
        }),
        where: mockWhere,
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: mockReturning,
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: mockReturning,
      }),
    }),
  },
}));

vi.mock("../../lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn((_name, cb) => cb()),
  DB_CIRCUIT_OPTIONS: {},
}));

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("FooterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFooterConfig", () => {
    it("returns default configuration fallback when no DB record exists", async () => {
      mockLimit.mockResolvedValue([]);

      const result = await footerService.getFooterConfig();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.companyName).toBe("RUN APPAREL (PVT) LTD");
        expect(result.value.brandText).toBe("RUN APPAREL");
        expect(result.value.certifications).toEqual([]);
      }
    });

    it("populates certificates when certificateIds are present in configuration", async () => {
      const mockConfig = {
        id: 1,
        companyName: "RUN APPAREL (PVT) LTD",
        certificateIds: [101],
      };
      mockLimit.mockResolvedValue([mockConfig]);

      const mockCerts = [
        {
          id: 101,
          name: "GOTS Certified Organic",
          type: "sustainability",
          issuingOrganization: "Global Organic Textile Standard",
          imageId: 50,
          imageUrl: "/certs/gots.svg",
        },
      ];
      mockWhere.mockResolvedValueOnce(mockCerts);

      const mockMedia = [
        {
          id: 50,
          deletedAt: null,
        },
      ];
      mockWhere.mockResolvedValueOnce(mockMedia);

      const result = await footerService.getFooterConfig();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.certifications.length).toBe(1);
        expect(result.value.certifications[0].name).toBe("GOTS Certified Organic");
        expect(result.value.certifications[0].imageUrl).toBe("/api/media/50/content");
      }
    });

    it("returns InternalError when database query throws", async () => {
      mockLimit.mockRejectedValue(new Error("Connection reset"));

      const result = await footerService.getFooterConfig();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.statusCode).toBe(500);
        expect(result.error.message).toBe("Failed to fetch footer configuration");
      }
    });
  });

  describe("updateFooterConfig", () => {
    it("updates existing footer configuration and returns updated record", async () => {
      mockLimit.mockResolvedValue([{ id: 1 }]);
      const updatedMock = {
        id: 1,
        companyName: "RUN APPAREL UPDATED",
        brandTagline: "Engineered for Champions",
      };
      mockReturning.mockResolvedValue([updatedMock]);

      const payload = {
        companyName: "RUN APPAREL UPDATED",
        brandTagline: "Engineered for Champions",
      };

      const result = await footerService.updateFooterConfig(payload);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.companyName).toBe("RUN APPAREL UPDATED");
        expect(result.value.brandTagline).toBe("Engineered for Champions");
      }
    });

    it("returns ValidationError (422) when payload fails schema validation", async () => {
      const invalidPayload = {
        // navigationColumns must be an array of objects
        navigationColumns: "not-an-array",
      };

      const result = await footerService.updateFooterConfig(invalidPayload);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.statusCode).toBe(422);
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });
});
