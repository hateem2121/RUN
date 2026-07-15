import { beforeEach, describe, expect, it, vi } from "vitest";
import { contactService } from "../../../../server/services/contact.service.js";
import { miscRepository } from "../../../../server/services/repositories/index.js";

vi.mock("../../../../server/services/repositories/index.js", () => ({
  miscRepository: {
    getContactPageConfiguration: vi.fn(),
    createContactPageConfiguration: vi.fn(),
    updateContactPageConfiguration: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn((_name, cb) => cb()),
  DB_CIRCUIT_OPTIONS: {},
}));

describe("ContactService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getContactPageConfiguration", () => {
    it("should fetch configuration", async () => {
      const mockConfig = { id: 1, email: "test@test.com" };
      vi.mocked(miscRepository.getContactPageConfiguration).mockResolvedValue(mockConfig as any);

      const result = await contactService.getContactPageConfiguration();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockConfig);
      }
    });

    it("should return error if not found", async () => {
      vi.mocked(miscRepository.getContactPageConfiguration).mockResolvedValue(null as any);
      const result = await contactService.getContactPageConfiguration();
      expect(result.isErr()).toBe(true);
    });
  });

  describe("createContactPageConfiguration", () => {
    it("should create configuration", async () => {
      const mockConfig = { id: 1 };
      vi.mocked(miscRepository.createContactPageConfiguration).mockResolvedValue(mockConfig as any);

      const result = await contactService.createContactPageConfiguration({} as any);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("updateContactPageConfiguration", () => {
    it("should update configuration", async () => {
      const mockConfig = { id: 1 };
      vi.mocked(miscRepository.updateContactPageConfiguration).mockResolvedValue(mockConfig as any);

      const result = await contactService.updateContactPageConfiguration(1, {} as any);

      expect(result.isOk()).toBe(true);
    });

    it("should return error if not found", async () => {
      vi.mocked(miscRepository.updateContactPageConfiguration).mockResolvedValue(null as any);
      const result = await contactService.updateContactPageConfiguration(1, {} as any);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getBusinessLocations", () => {
    it("should return hardcoded locations", async () => {
      const result = await contactService.getBusinessLocations();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });
  });
});
