import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnifiedCache } from "../../../../../server/lib/cache/unified-cache.js";
import {
  cacheUtils,
  withTransaction,
} from "../../../../../server/services/repositories/shared-utils.js";

vi.mock("../../../../../server/db.js", () => ({
  db: {
    transaction: vi.fn((cb) => cb({} as any)),
  },
}));

vi.mock("../../../../../server/lib/cache/unified-cache.js", () => {
  const mockCache = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clearPattern: vi.fn(),
  };
  return {
    UnifiedCache: {
      getInstance: vi.fn(() => mockCache),
    },
  };
});

vi.mock("../../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SharedUtils", () => {
  const mockCache = UnifiedCache.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withTransaction", () => {
    it("should execute transaction and invalidate cache", async () => {
      const mockOp = vi.fn().mockResolvedValue("success");
      const result = await withTransaction(mockOp, ["test-key"], "testOp");

      expect(result).toBe("success");
      expect(mockCache.clearPattern).toHaveBeenCalledWith("test-key");
    });

    it("should throw error if transaction fails", async () => {
      const mockOp = vi.fn().mockRejectedValue(new Error("tx failed"));

      await expect(withTransaction(mockOp, ["test-key"], "testOp")).rejects.toThrow("tx failed");
      expect(mockCache.clearPattern).not.toHaveBeenCalled();
    });
  });

  describe("cacheUtils", () => {
    it("get should fetch from cache", async () => {
      vi.mocked(mockCache.get).mockResolvedValue("cached");
      const result = await cacheUtils.get("key");
      expect(result).toBe("cached");
    });

    it("get should handle errors", async () => {
      vi.mocked(mockCache.get).mockRejectedValue(new Error());
      const result = await cacheUtils.get("key");
      expect(result).toBeNull();
    });

    it("set should set in cache", async () => {
      await cacheUtils.set("key", "value", 100);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it("delete should remove from cache", async () => {
      await cacheUtils.delete("key");
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it("clearPattern should clear by pattern", async () => {
      await cacheUtils.clearPattern("key*");
      expect(mockCache.clearPattern).toHaveBeenCalled();
    });
  });
});
