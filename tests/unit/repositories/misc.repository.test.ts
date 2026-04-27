import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { MiscRepository } from "../../../server/lib/db/repositories/misc-repository.js";
import * as encryption from "../../../server/lib/encryption.js";

const { mockUnifiedCache } = vi.hoisted(() => ({
  mockUnifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clearPattern: vi.fn(),
  },
}));

vi.mock("../../../server/db.js", () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    rightJoin: vi.fn().mockReturnThis(),
    fullJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    and: vi.fn(),
    eq: vi.fn(),
    execute: vi.fn(),
    // biome-ignore lint/suspicious/noThenProperty: Mocking a promise
    then: function (this: any, onFullfilled: any) {
      return Promise.resolve(this.__result || []).then(onFullfilled);
    },
    __result: [] as any,
  };
  return { db: chainable };
});

vi.mock("../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn(() => mockUnifiedCache),
  },
}));

vi.mock("../../../server/lib/encryption.js", () => ({
  decrypt: vi.fn((val) => val.split(":").pop()),
  encrypt: vi.fn((val) => `enc:${val}`),
  getBlindIndex: vi.fn((val) => `blind:${val}`),
}));

describe("MiscRepository", () => {
  let repository: MiscRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MiscRepository();
    (db as any).__result = [];
  });

  describe("Fiber Management", () => {
    const mockFibers = [{ id: 1, name: "Fiber A" }];

    it("should return cached fibers if available", async () => {
      vi.mocked(mockUnifiedCache.get).mockResolvedValue(mockFibers);

      const result = await repository.getFibers();

      expect(result).toEqual(mockFibers);
      expect(db.select).not.toHaveBeenCalled();
    });

    it("should fetch from DB on cache miss", async () => {
      vi.mocked(mockUnifiedCache.get).mockResolvedValue(null);
      (db as any).__result = mockFibers;

      const result = await repository.getFibers();

      expect(result).toEqual(mockFibers);
      expect(db.select).toHaveBeenCalled();
      expect(mockUnifiedCache.set).toHaveBeenCalled();
    });
  });

  describe("Inquiry Management", () => {
    it("should decrypt sensitive inquiry data", async () => {
      const mockInquiry = {
        id: 1,
        name: "enc:Hateem",
        email: "enc:hateem@run.com",
        message: "Hello",
      };
      (db as any).__result = [mockInquiry];

      const result = await repository.listInquiries({});

      expect(result.inquiries[0].name).toBe("Hateem");
      expect(result.inquiries[0].email).toBe("hateem@run.com");
      expect(encryption.decrypt).toHaveBeenCalled();
    });
  });
});
