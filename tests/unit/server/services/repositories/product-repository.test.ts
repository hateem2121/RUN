import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../server/db.js";
import { UnifiedCache } from "../../../../../server/lib/cache/unified-cache.js";
import { StorageSingleton } from "../../../../../server/lib/storage-singleton.js";
import { ProductRepository } from "../../../../../server/services/repositories/product-repository.js";

vi.mock("../../../../../server/db.js", () => {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    $dynamic: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    prepare: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  };
  chain.then = (resolve: any) => resolve([]);
  return {
    db: {
      select: vi.fn().mockReturnValue(chain),
      insert: vi.fn().mockReturnValue(chain),
      update: vi.fn().mockReturnValue(chain),
      delete: vi.fn().mockReturnValue(chain),
      query: {
        categories: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      transaction: vi.fn((cb: any) =>
        cb({
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
          }),
        }),
      ),
    },
  };
});

vi.mock("../../../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../../../server/lib/cache/unified-cache.js", () => ({
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

vi.mock("../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/db/db-circuit-breaker.js", () => ({
  dbCircuitBreaker: {
    execute: vi.fn(async (fn) => await fn()),
  },
}));

vi.mock("../../../../../server/lib/db/query-performance.js", () => ({
  queryPerformanceMonitor: {
    startQuery: vi.fn(() => ({
      timePhase: vi.fn(async (_name: string, fn: any) => await fn()),
      setCacheHit: vi.fn().mockReturnThis(),
      complete: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock("../../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/repositories/misc-repository.js", () => ({
  MiscRepository: class {
    getFibers = vi.fn().mockResolvedValue([]);
  },
}));

describe("ProductRepository", () => {
  let repository: ProductRepository;
  let mockStorageInstance: any;
  let mockUnifiedCache: any;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ProductRepository();
    mockUnifiedCache = UnifiedCache.getInstance();

    mockStorageInstance = {
      getProductsCursor: vi.fn(),
      getProducts: vi.fn(),
      getProductsSummary: vi.fn(),
      getHomepageFeaturedProducts: vi.fn(),
      getProductsCount: vi.fn(),
      getProductsByCategoryCount: vi.fn(),
      getProductsByTagCount: vi.fn(),
      searchProductsCount: vi.fn(),
      getProduct: vi.fn(),
      getProductsByCategory: vi.fn(),
      getProductBySlug: vi.fn(),
      getProductByPath: vi.fn(),
      getProductsByTag: vi.fn(),
      getRelatedProducts: vi.fn(),
      getActiveProducts: vi.fn(),
      getFeaturedProducts: vi.fn(),
      getFeaturedProductsCount: vi.fn(),
      searchProducts: vi.fn(),
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      deleteProduct: vi.fn(),
      getProductsIncludingDeleted: vi.fn(),
      restoreProduct: vi.fn(),
      permanentlyDeleteProduct: vi.fn(),
      getCategories: vi.fn(),
      getCategory: vi.fn(),
      getCategoryBySlug: vi.fn(),
      getCategoriesCount: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      getDeletedCategories: vi.fn(),
      getCategoriesIncludingDeleted: vi.fn(),
      restoreCategory: vi.fn(),
      permanentlyDeleteCategory: vi.fn(),
      get3DModelMetadata: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);
  });

  describe("when StorageSingleton has instance", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    it("delegates all methods to StorageSingleton", async () => {
      await repository.getProductsCursor(10, 5);
      expect(mockStorageInstance.getProductsCursor).toHaveBeenCalledWith(10, 5);

      await repository.getProductsSummary(10, 0, { cacheStrategy: "bypass" });
      expect(mockStorageInstance.getProductsSummary).toHaveBeenCalledWith(10, 0, {
        cacheStrategy: "bypass",
      });

      await repository.getHomepageFeaturedProducts(5);
      expect(mockStorageInstance.getHomepageFeaturedProducts).toHaveBeenCalledWith(5);

      await repository.getProductCount();
      expect(mockStorageInstance.getProductsCount).toHaveBeenCalled();

      await repository.getProductsByCategoryCount(1);
      expect(mockStorageInstance.getProductsByCategoryCount).toHaveBeenCalledWith(1);

      await repository.getProductsByTagCount("tag");
      expect(mockStorageInstance.getProductsByTagCount).toHaveBeenCalledWith("tag");

      await repository.searchProductsCount("test", { categoryId: 1 });
      expect(mockStorageInstance.searchProductsCount).toHaveBeenCalledWith("test", {
        categoryId: 1,
      });

      await repository.getProduct(1);
      expect(mockStorageInstance.getProduct).toHaveBeenCalledWith(1);

      await repository.getProductsByCategory(1, 10, 0);
      expect(mockStorageInstance.getProductsByCategory).toHaveBeenCalledWith(1, 10, 0);

      await repository.getProductBySlug("slug");
      expect(mockStorageInstance.getProductBySlug).toHaveBeenCalledWith("slug");

      await repository.getProductByPath("path");
      expect(mockStorageInstance.getProductByPath).toHaveBeenCalledWith("path");

      await repository.getProductsByTag("tag", 10, 0);
      expect(mockStorageInstance.getProductsByTag).toHaveBeenCalledWith("tag", 10, 0);

      await repository.getRelatedProducts(1);
      expect(mockStorageInstance.getRelatedProducts).toHaveBeenCalledWith(1);

      await repository.getActiveProducts();
      expect(mockStorageInstance.getActiveProducts).toHaveBeenCalled();

      await repository.getFeaturedProducts(10, 0);
      expect(mockStorageInstance.getFeaturedProducts).toHaveBeenCalledWith(10, 0);

      await repository.getFeaturedProductsCount();
      expect(mockStorageInstance.getFeaturedProductsCount).toHaveBeenCalled();

      await repository.searchProducts("query", { isActive: true }, 10, 0);
      expect(mockStorageInstance.searchProducts).toHaveBeenCalledWith(
        "query",
        { isActive: true },
        10,
        0,
      );

      await repository.createProduct({ name: "p" } as any);
      expect(mockStorageInstance.createProduct).toHaveBeenCalledWith({ name: "p" });

      await repository.updateProduct(1, { name: "u" });
      expect(mockStorageInstance.updateProduct).toHaveBeenCalledWith(1, { name: "u" });

      await repository.deleteProduct(1);
      expect(mockStorageInstance.deleteProduct).toHaveBeenCalledWith(1);

      await repository.getProductsIncludingDeleted(10, 0);
      expect(mockStorageInstance.getProductsIncludingDeleted).toHaveBeenCalledWith(10, 0);

      await repository.restoreProduct(1);
      expect(mockStorageInstance.restoreProduct).toHaveBeenCalledWith(1);

      await repository.permanentlyDeleteProduct(1);
      expect(mockStorageInstance.permanentlyDeleteProduct).toHaveBeenCalledWith(1);

      await repository.getCategories(10, 0);
      expect(mockStorageInstance.getCategories).toHaveBeenCalledWith(10, 0);

      await repository.getCategory(1);
      expect(mockStorageInstance.getCategory).toHaveBeenCalledWith(1);

      await repository.getCategoryBySlug("cat");
      expect(mockStorageInstance.getCategoryBySlug).toHaveBeenCalledWith("cat");

      await repository.getCategoriesCount();
      expect(mockStorageInstance.getCategoriesCount).toHaveBeenCalled();

      await repository.createCategory({ name: "c" } as any);
      expect(mockStorageInstance.createCategory).toHaveBeenCalledWith({ name: "c" });

      await repository.updateCategory(1, { name: "cu" });
      expect(mockStorageInstance.updateCategory).toHaveBeenCalledWith(1, { name: "cu" });

      await repository.deleteCategory(1);
      expect(mockStorageInstance.deleteCategory).toHaveBeenCalledWith(1);

      await repository.getDeletedCategories();
      expect(mockStorageInstance.getDeletedCategories).toHaveBeenCalled();

      await repository.getCategoriesIncludingDeleted(10, 0);
      expect(mockStorageInstance.getCategoriesIncludingDeleted).toHaveBeenCalledWith(10, 0);

      await repository.restoreCategory(1);
      expect(mockStorageInstance.restoreCategory).toHaveBeenCalledWith(1);

      await repository.permanentlyDeleteCategory(1);
      expect(mockStorageInstance.permanentlyDeleteCategory).toHaveBeenCalledWith(1);

      await repository.get3DModelMetadata(1);
      expect(mockStorageInstance.get3DModelMetadata).toHaveBeenCalledWith(1);
    });
  });

  describe("when StorageSingleton has no instance (db logic)", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
    });

    const createMockDbChain = (result: any, returningResult?: any) => {
      const chain: any = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(returningResult || result),
        $dynamic: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        prepare: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(result),
      };
      chain.then = (resolve: any) => resolve(result);
      return chain;
    };

    describe("Product Queries", () => {
      it("getProductsCursor executes db query", async () => {
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 1 }]));
        const res = await repository.getProductsCursor(10, 5);
        expect(res).toEqual([{ id: 1 }]);
      });

      it("getProducts handles cache hit and miss", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce([{ id: 1 }]);
        let res = await repository.getProducts();
        expect(res).toEqual([{ id: 1 }]);

        mockUnifiedCache.get.mockResolvedValueOnce(null);
        vi.mocked(db.select).mockReturnValue(
          createMockDbChain([{ product: { id: 2 }, imageVariants: null }]),
        );
        res = await repository.getProducts();
        expect(res).toEqual([{ id: 2, imageUrl: undefined, imageVariants: null }]);
      });

      it("getProductsSummary bypasses cache when strategy is bypass", async () => {
        vi.mocked(db.select)
          .mockReturnValueOnce(createMockDbChain([{ count: 5 }])) // getProductCount
          .mockReturnValueOnce(createMockDbChain([{ id: 1 }])); // getProductsSummary items

        const res = await repository.getProductsSummary(10, 0, { cacheStrategy: "bypass" });
        expect(res).toEqual({ products: [{ id: 1 }], totalCount: 5 });
        expect(mockUnifiedCache.get).not.toHaveBeenCalledWith(
          expect.stringContaining("products:summary"),
        ); // cache read bypassed
        expect(mockUnifiedCache.set).not.toHaveBeenCalledWith(
          expect.stringContaining("products:summary"),
          expect.any(Object),
          expect.any(Number),
        ); // cache write bypassed
      });

      it("getProductsSummary handles normal cache hit", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce({ products: [{ id: 1 }], totalCount: 1 });
        const res = await repository.getProductsSummary();
        expect(res).toEqual({ products: [{ id: 1 }], totalCount: 1 });
      });

      it("getHomepageFeaturedProducts handles cache miss", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce(null);
        vi.mocked(db.select).mockReturnValue(
          createMockDbChain([{ product: { id: 1, primaryImageId: 2 } }]),
        );
        const res = await repository.getHomepageFeaturedProducts();
        expect(res[0]).toHaveProperty("imageUrl", "/api/media/2/content");
      });

      it("getProductCount caches the result", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce(null);
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ count: 10 }]));
        const count = await repository.getProductCount();
        expect(count).toBe(10);
        expect(mockUnifiedCache.set).toHaveBeenCalled();
      });

      it("invalidateProductCount deletes cache keys", async () => {
        await repository.invalidateProductCount();
        expect(mockUnifiedCache.delete).toHaveBeenCalledWith("products:total_count");
        expect(mockUnifiedCache.invalidate).toHaveBeenCalledWith("^products:count:category:");
      });

      it("getProductByPath handles cache miss and 404 caching", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce(null);
        // db query returns empty -> not found
        vi.mocked(db.select).mockReturnValueOnce(createMockDbChain([]));
        const res = await repository.getProductByPath("missing-path");
        expect(res).toBeNull();
        expect(mockUnifiedCache.set).toHaveBeenCalledWith(
          "product:by-path:missing-path",
          expect.objectContaining({ __notFound: true }),
          10 * 60 * 1000,
        );
      });

      it("getProductByPath handles positive cache miss", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce(null);

        const mockProduct = { id: 1, categoryId: 2, urlPath: "found-path" };

        // Mock multiple parallel queries returning empty except the main product query
        vi.mocked(db.select)
          .mockReturnValueOnce(createMockDbChain([mockProduct])) // product
          .mockReturnValueOnce(createMockDbChain([])) // media
          .mockReturnValueOnce(createMockDbChain([])) // certificates
          .mockReturnValueOnce(createMockDbChain([])) // accessories
          .mockReturnValueOnce(createMockDbChain([])) // categoryProducts
          .mockReturnValueOnce(createMockDbChain([])); // relatedProducts

        const res = await repository.getProductByPath("found-path");
        expect(res).not.toBeNull();
        expect(res?.product.id).toBe(1);
        expect(mockUnifiedCache.set).toHaveBeenCalledWith(
          "product:by-path:found-path",
          res,
          60 * 60 * 1000,
        );
      });

      it("getProductByPath handles negative cache hit", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce({ __notFound: true });
        const res = await repository.getProductByPath("path");
        expect(res).toBeNull();
      });

      it("searchProducts formats and returns products", async () => {
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 1, rank: 0.5 }]));
        const res = await repository.searchProducts("test", {
          categoryId: 1,
          isActive: true,
          isFeatured: true,
        });
        expect(Array.isArray(res)).toBe(true);
      });

      it("getProduct works", async () => {
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 1 }]));
        const res = await repository.getProduct(1);
        expect(res).toBeDefined();
      });

      it("getProductsByCategory works", async () => {
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 1 }]));
        const res = await repository.getProductsByCategory(1);
        expect(Array.isArray(res)).toBe(true);
      });

      it("getProductBySlug works", async () => {
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 1 }]));
        const res = await repository.getProductBySlug("slug");
        expect(res).toBeDefined();
      });

      it("getProductsByTag works", async () => {
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 1 }]));
        const res = await repository.getProductsByTag("tag");
        expect(Array.isArray(res)).toBe(true);
      });

      it("getRelatedProducts fallback if category id missing", async () => {
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ categoryId: null }]));
        const res = await repository.getRelatedProducts(1);
        expect(res).toEqual([]);
      });

      it("getRelatedProducts from relations table", async () => {
        vi.mocked(db.select)
          .mockReturnValueOnce(createMockDbChain([{ categoryId: 1 }])) // source
          .mockReturnValueOnce(createMockDbChain([{ id: 2, relationId: 1, sortOrder: 0 }])); // relations
        const res = await repository.getRelatedProducts(1);
        expect(res).toEqual([{ id: 2 }]);
      });
    });

    describe("Product Mutations", () => {
      it("createProduct throws on failure", async () => {
        vi.mocked(db.insert).mockReturnValue(createMockDbChain([], []));
        await expect(repository.createProduct({ name: "fail" } as any)).rejects.toThrow(
          "Failed to create product",
        );
      });

      it("createProduct works and sets relations", async () => {
        vi.mocked(db.insert).mockReturnValue(createMockDbChain([{ id: 1 }], [{ id: 1 }]));
        const res = await repository.createProduct({ name: "ok", relatedProductIds: [2] } as any);
        expect(res.id).toBe(1);
        expect(mockUnifiedCache.clearPattern).toHaveBeenCalled();
      });

      it("updateProduct handles relatedProductIds", async () => {
        vi.mocked(db.update).mockReturnValue(createMockDbChain([{ id: 1 }], [{ id: 1 }]));
        const txMock: any = {
          update: vi.fn().mockReturnValue(createMockDbChain([{ id: 1 }], [{ id: 1 }])),
          delete: vi.fn().mockReturnValue(createMockDbChain([])),
          insert: vi.fn().mockReturnValue(createMockDbChain([])),
        };
        await repository.updateProduct(1, { relatedProductIds: [2] }, txMock);
        expect(txMock.delete).toHaveBeenCalled();
        expect(txMock.insert).toHaveBeenCalled();
      });

      it("deleteProduct returns success and invalidates cache", async () => {
        vi.mocked(db.update).mockReturnValue(createMockDbChain({ rowCount: 1 }));
        const res = await repository.deleteProduct(1);
        expect(res).toBe(true);
        expect(mockUnifiedCache.clearPattern).toHaveBeenCalled();
      });

      it("restoreProduct works", async () => {
        vi.mocked(db.update).mockReturnValue(createMockDbChain({ rowCount: 1 }));
        const res = await repository.restoreProduct(1);
        expect(res).toBe(true);
      });

      it("permanentlyDeleteProduct works", async () => {
        vi.mocked(db.delete).mockReturnValue(createMockDbChain({ rowCount: 1 }));
        const res = await repository.permanentlyDeleteProduct(1);
        expect(res).toBe(true);
      });
    });

    describe("Category Methods", () => {
      it("getCategories works with cache and db", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce([{ id: 1 }]);
        let res = await repository.getCategories();
        expect(res).toEqual([{ id: 1 }]);

        mockUnifiedCache.get.mockResolvedValueOnce(null);
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 2 }]));
        res = await repository.getCategories(10, 0);
        expect(res).toEqual([{ id: 2 }]);
      });

      it("createCategory throws if no category returned", async () => {
        vi.mocked(db.insert).mockReturnValue(createMockDbChain([], []));
        await expect(repository.createCategory({ name: "fail" } as any)).rejects.toThrow(
          "Failed to create category",
        );
      });

      it("updateCategory invalidates cache", async () => {
        vi.mocked(db.update).mockReturnValue(createMockDbChain([{ id: 1 }], [{ id: 1 }]));
        await repository.updateCategory(1, { name: "updated" });
        expect(mockUnifiedCache.clearPattern).toHaveBeenCalled();
      });

      it("deleteCategory works", async () => {
        vi.mocked(db.update).mockReturnValue(createMockDbChain({ rowCount: 1 }));
        await repository.deleteCategory(1);
        expect(mockUnifiedCache.clearPattern).toHaveBeenCalled();
      });

      it("getDeletedCategories works", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce(null);
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ id: 1 }]));
        const res = await repository.getDeletedCategories();
        expect(res).toEqual([{ id: 1 }]);
      });

      it("restoreCategory works", async () => {
        vi.mocked(db.update).mockReturnValue(createMockDbChain({ rowCount: 1 }));
        const res = await repository.restoreCategory(1);
        expect(res).toBe(true);
      });

      it("permanentlyDeleteCategory works", async () => {
        vi.mocked(db.delete).mockReturnValue(createMockDbChain({ rowCount: 1 }));
        const res = await repository.permanentlyDeleteCategory(1);
        expect(res).toBe(true);
      });
    });

    describe("3D Model Metadata", () => {
      it("get3DModelMetadata returns null if no modelFileId", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce(null);
        vi.mocked(db.select).mockReturnValue(createMockDbChain([{ modelFileId: null }]));
        const res = await repository.get3DModelMetadata(1);
        expect(res).toBeNull();
      });

      it("get3DModelMetadata returns asset if modelFileId exists", async () => {
        mockUnifiedCache.get.mockResolvedValueOnce(null);
        vi.mocked(db.select)
          .mockReturnValueOnce(createMockDbChain([{ modelFileId: 5 }]))
          .mockReturnValueOnce(createMockDbChain([{ id: 5, filename: "model.glb" }]));
        const res = await repository.get3DModelMetadata(1);
        expect(res).toEqual({ id: 5, filename: "model.glb" });
        expect(mockUnifiedCache.set).toHaveBeenCalled();
      });
    });
  });
});
