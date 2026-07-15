import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../server/lib/errors.js";
import { webhookRepository } from "../../../../server/services/repositories/index.js";
import { webhookService } from "../../../../server/services/webhook-service.js";

vi.mock("../../../../server/services/repositories/index.js", () => ({
  webhookRepository: {
    getWebhookSubscriptions: vi.fn(),
    logWebhookDelivery: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn((_name, cb) => cb()),
  DB_CIRCUIT_OPTIONS: {},
  EXTERNAL_API_CIRCUIT_OPTIONS: {},
}));

vi.mock("../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("WebhookService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as any;
  });

  describe("trigger", () => {
    it("should return early if no subscriptions", async () => {
      vi.mocked(webhookRepository.getWebhookSubscriptions).mockResolvedValue([]);

      const result = await webhookService.trigger("product.created" as any, {} as any);

      expect(result.isOk()).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should deliver to active subscriptions for the event", async () => {
      vi.mocked(webhookRepository.getWebhookSubscriptions).mockResolvedValue([
        {
          id: 1,
          url: "https://test.com/webhook",
          secret: "test-secret",
          events: ["product.created"] as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      } as any);

      const result = await webhookService.trigger("product.created" as any, {} as any);

      expect(result.isOk()).toBe(true);
      // Delivery is backgrounded, but we wait for event loop to process it
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(global.fetch).toHaveBeenCalledWith("https://test.com/webhook", expect.any(Object));
      expect(webhookRepository.logWebhookDelivery).toHaveBeenCalled();
    });

    it("should handle fetch failure without crashing", async () => {
      vi.mocked(webhookRepository.getWebhookSubscriptions).mockResolvedValue([
        {
          id: 1,
          url: "https://test.com/webhook",
          secret: "test-secret",
          events: ["product.created"] as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const result = await webhookService.trigger("product.created" as any, {} as any);

      expect(result.isOk()).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(webhookRepository.logWebhookDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          responseStatus: 0,
          deliveredAt: null,
        }),
      );
    });

    it("should return error if getWebhookSubscriptions throws AppError", async () => {
      const err = new AppError("Test error", 500, "INTERNAL");
      vi.mocked(webhookRepository.getWebhookSubscriptions).mockRejectedValue(err);

      const result = await webhookService.trigger("product.created" as any, {} as any);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(err);
      }
    });

    it("should return error if getWebhookSubscriptions throws generic error", async () => {
      vi.mocked(webhookRepository.getWebhookSubscriptions).mockRejectedValue(new Error("Unknown"));

      const result = await webhookService.trigger("product.created" as any, {} as any);

      expect(result.isErr()).toBe(true);
    });
  });
});
