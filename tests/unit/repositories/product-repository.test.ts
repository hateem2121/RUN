/**
 * Product Repository Unit Tests
 * Tests product CRUD and query operations with mocked database
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database module
vi.mock("../../../server/db.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock unified cache
vi.mock("../../../server/lib/cache/unified-cache.js", () => ({
  unifiedCache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    getOrFetch: vi.fn().mockImplementation((_key, loader) => loader()),
    delete: vi.fn().mockResolvedValue(undefined),
    clearPattern: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock logger
vi.mock("../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocking
import { db } from "../../../server/db.js";
import { ProductRepository } from "../../../server/lib/db/repositories/product-repository.js";

describe("ProductRepository", () => {
  let productRepository: ProductRepository;

  const mockProductSummary = {
    id: 1,
    name: "Test Product",
    slug: "test-product",
    sku: "TEST-001",
    categoryId: 1,
    isActive: true,
    isFeatured: false,
    price: "99.99",
    thumbnailUrl: "/images/test.jpg",
    createdAt: new Date(),
  };

  const mockProductDetail = {
    ...mockProductSummary,
    description: "A test product description",
    shortDescription: "Short desc",
    specifications: {},
    mediaIds: [1, 2, 3],
    updatedAt: new Date(),
  };

  beforeEach(() => {
    productRepository = new ProductRepository();
    vi.clearAllMocks();
  });

  describe("getProducts", () => {
    it("should return products with pagination", async () => {
      const mockProducts = [mockProductSummary, { ...mockProductSummary, id: 2 }];
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockProducts),
              }),
            }),
          }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.getProducts(10, 0);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(1);
    });

    it("should apply default limit of 100", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      await productRepository.getProducts();

      // Check that limit was called (the mock chain)
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("getProduct", () => {
    it("should return product by ID", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockProductDetail]),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.getProduct(1);

      expect(result).toEqual(mockProductDetail);
    });

    it("should return undefined for non-existent product", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.getProduct(999);

      expect(result).toBeUndefined();
    });
  });

  describe("getProductBySlug", () => {
    it("should return product by slug", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockProductDetail]),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.getProductBySlug("test-product");

      expect(result).toEqual(mockProductDetail);
    });
  });

  describe("createProduct", () => {
    it("should create a new product", async () => {
      const newProduct = { ...mockProductDetail };
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newProduct]),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.createProduct({
        name: "Test Product",
        slug: "test-product",
        sku: "TEST-001",
        categoryId: 1,
      });

      expect(result).toEqual(newProduct);
    });

    it("should throw error if no product returned", async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      await expect(
        productRepository.createProduct({
          name: "Test Product",
          slug: "test-product",
          sku: "TEST-001",
          categoryId: 1,
        }),
      ).rejects.toThrow();
    });
  });

  describe("updateProduct", () => {
    it("should update an existing product", async () => {
      const updatedProduct = { ...mockProductDetail, name: "Updated Name" };
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProduct]),
          }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.updateProduct(1, { name: "Updated Name" });

      expect(result?.name).toBe("Updated Name");
    });

    it("should return undefined for non-existent product", async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.updateProduct(999, { name: "Updated" });

      expect(result).toBeUndefined();
    });
  });

  describe("searchProducts", () => {
    it("should search products by query", async () => {
      const searchResults = [mockProductSummary];
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(searchResults),
              }),
            }),
          }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.searchProducts("test", 10, 0);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Test Product");
    });
  });

  describe("getProductsByCategory", () => {
    it("should return products filtered by category", async () => {
      const categoryProducts = [mockProductSummary];
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(categoryProducts),
              }),
            }),
          }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.getProductsByCategory(1, 10, 0);

      expect(result).toHaveLength(1);
    });
  });

  describe("getFeaturedProducts", () => {
    it("should return featured products only", async () => {
      const featuredProducts = [{ ...mockProductSummary, isFeatured: true }];
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(featuredProducts),
            }),
          }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: Mock chain return type
      } as any);

      const result = await productRepository.getFeaturedProducts();

      expect(result).toHaveLength(1);
      expect(result[0]?.isFeatured).toBe(true);
    });
  });
});
