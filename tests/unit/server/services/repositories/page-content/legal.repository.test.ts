import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../../server/db.js";
import { StorageSingleton } from "../../../../../../server/lib/storage-singleton.js";
import { legalRepository } from "../../../../../../server/services/repositories/page-content/legal.repository.js";

vi.mock("../../../../../../server/db.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn((cb) =>
      cb({
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
        }),
      }),
    ),
  },
}));

vi.mock("../../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

vi.mock("../../../../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../../../../server/middleware/ssr-cache.js", () => ({
  invalidateHtmlCache: vi.fn(),
}));

vi.mock("../../../../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      clearPattern: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe("LegalRepository", () => {
  const repository = legalRepository;
  let mockStorageInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorageInstance = {
      getLegalPolicies: vi.fn(),
      getLegalPolicyBySlug: vi.fn(),
      getLegalPolicy: vi.fn(),
      createLegalPolicy: vi.fn(),
      updateLegalPolicy: vi.fn(),
      deleteLegalPolicy: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);
  });

  describe("when StorageSingleton has instance", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    it("getLegalPolicies delegates", async () => {
      await repository.getLegalPolicies();
      expect(mockStorageInstance.getLegalPolicies).toHaveBeenCalled();
    });

    it("getLegalPolicyBySlug delegates", async () => {
      await repository.getLegalPolicyBySlug("slug");
      expect(mockStorageInstance.getLegalPolicyBySlug).toHaveBeenCalled();
    });

    it("getLegalPolicy delegates", async () => {
      await repository.getLegalPolicy(1);
      expect(mockStorageInstance.getLegalPolicy).toHaveBeenCalled();
    });

    it("createLegalPolicy delegates", async () => {
      await repository.createLegalPolicy({} as any);
      expect(mockStorageInstance.createLegalPolicy).toHaveBeenCalled();
    });

    it("updateLegalPolicy delegates", async () => {
      await repository.updateLegalPolicy(1, {});
      expect(mockStorageInstance.updateLegalPolicy).toHaveBeenCalled();
    });

    it("deleteLegalPolicy delegates", async () => {
      await repository.deleteLegalPolicy(1);
      expect(mockStorageInstance.deleteLegalPolicy).toHaveBeenCalled();
    });
  });

  describe("when StorageSingleton has no instance (db logic)", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
    });

    const createMockDbChain = (result: any) => {
      const chain: any = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(result),
        $dynamic: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => resolve(result);
      return chain;
    };

    it("getLegalPolicies uses db queries", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getLegalPolicies();
      expect(db.select).toHaveBeenCalled();
    });

    it("getLegalPolicyBySlug uses db queries", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getLegalPolicyBySlug("test-slug");
      expect(db.select).toHaveBeenCalled();
    });

    it("getLegalPolicy uses db queries", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getLegalPolicy(1);
      expect(db.select).toHaveBeenCalled();
    });

    it("createLegalPolicy uses db", async () => {
      const chain = createMockDbChain([{ id: 1, slug: "test" }]);
      vi.mocked(db.insert).mockReturnValue(chain);
      await repository.createLegalPolicy({} as any);
      expect(db.insert).toHaveBeenCalled();
    });

    it("updateLegalPolicy uses db", async () => {
      const chainUpdate = createMockDbChain([{ id: 1, slug: "test" }]);
      vi.mocked(db.update).mockReturnValue(chainUpdate);
      await repository.updateLegalPolicy(1, { title: "test" });
      expect(db.update).toHaveBeenCalled();
    });

    it("deleteLegalPolicy uses db", async () => {
      const chainGet = createMockDbChain([{ id: 1, slug: "test" }]);
      vi.mocked(db.select).mockReturnValue(chainGet);
      const chainDelete = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.delete).mockReturnValue(chainDelete);
      await repository.deleteLegalPolicy(1);
      expect(db.delete).toHaveBeenCalled();
    });
  });
});
