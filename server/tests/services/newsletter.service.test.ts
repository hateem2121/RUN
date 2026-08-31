import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../lib/errors.js";
import { miscRepository } from "../../services/repositories/index.js";
import { newsletterService } from "../../services/system/newsletter.service.js";

vi.mock("../../services/repositories/index.js", () => ({
  miscRepository: {
    subscribeToNewsletter: vi.fn(),
  },
}));

vi.mock("../../lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn((_name, cb) => cb()),
  DB_CIRCUIT_OPTIONS: {},
}));

describe("NewsletterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribe", () => {
    it("should subscribe successfully", async () => {
      vi.mocked(miscRepository.subscribeToNewsletter).mockResolvedValue(true);

      const result = await newsletterService.subscribe("test@example.com");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should return error on failure", async () => {
      vi.mocked(miscRepository.subscribeToNewsletter).mockRejectedValue(new AppError("Failed"));

      const result = await newsletterService.subscribe("test@example.com");

      expect(result.isErr()).toBe(true);
    });
  });
});
