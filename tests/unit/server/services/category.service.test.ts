import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheOperations } from "../../../../server/lib/cache/cache-strategies.js";
import { AppError } from "../../../../server/lib/errors.js";
import { categoryService } from "../../../../server/services/category.service.js";
import { productRepository } from "../../../../server/services/repositories/index.js";
import { webhookService } from "../../../../server/services/webhook-service.js";

vi.mock("../../../../server/services/repositories/index.js", () => ({
  productRepository: {
    getCategories: vi.fn(),
    getCategoriesCount: vi.fn(),
    getCategory: vi.fn(),
    getCategoryBySlug: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    restoreCategory: vi.fn(),
    permanentlyDeleteCategory: vi.fn(),
  },
}));

vi.mock("../../../../server/services/webhook-service.js", () => ({
  webhookService: {
    trigger: vi.fn(),
  },
}));

vi.mock("../../../../server/db.js", () => ({
  db: {
    transaction: vi.fn().mockImplementation((cb) => cb()),
  },
}));

vi.mock("../../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateCategories: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../../server/lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn((_name, cb) => cb()),
  DB_CIRCUIT_OPTIONS: {},
}));

vi.mock("../../../../server/lib/resilience/request-timeout.js", () => ({
  withTimeout: vi.fn((promise) => promise),
}));

describe("CategoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should fetch all categories without pagination", async () => {
      const mockCategories = [{ id: 1, name: "Test" }];
      vi.mocked(productRepository.getCategories).mockResolvedValue(mockCategories as any);

      const result = await categoryService.getCategories();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockCategories);
      }
    });

    it("should fetch categories with pagination", async () => {
      const mockCategories = [{ id: 1, name: "Test" }];
      vi.mocked(productRepository.getCategories).mockResolvedValue(mockCategories as any);
      vi.mocked(productRepository.getCategoriesCount).mockResolvedValue(10);

      const result = await categoryService.getCategories(1, 5);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty("data", mockCategories);
        expect(result.value).toHaveProperty("pagination", {
          page: 1,
          limit: 5,
          total: 10,
          pages: 2,
        });
      }
    });

    it("should return error if fetching fails", async () => {
      vi.mocked(productRepository.getCategories).mockRejectedValue(new AppError("Failed"));

      const result = await categoryService.getCategories();

      expect(result.isErr()).toBe(true);
    });
  });

  describe("reorderCategories", () => {
    it("should reorder and invalidate cache", async () => {
      vi.mocked(productRepository.getCategory).mockResolvedValue({ id: 1, isActive: true } as any);
      vi.mocked(productRepository.updateCategory).mockResolvedValue({ id: 1, sortOrder: 1 } as any);

      const result = await categoryService.reorderCategories({
        categories: [{ id: 1, sortOrder: 1 }],
      });

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateCategories).toHaveBeenCalled();
      expect(webhookService.trigger).toHaveBeenCalledWith("category.reordered", { count: 1 });
    });
  });

  describe("getCategoryById", () => {
    it("should fetch by id", async () => {
      vi.mocked(productRepository.getCategory).mockResolvedValue({ id: 1, name: "Test" } as any);
      const result = await categoryService.getCategoryById(1);
      expect(result.isOk()).toBe(true);
    });

    it("should return error if not found", async () => {
      vi.mocked(productRepository.getCategory).mockResolvedValue(null as any);
      const result = await categoryService.getCategoryById(1);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getCategoryBySlug", () => {
    it("should fetch by slug", async () => {
      vi.mocked(productRepository.getCategoryBySlug).mockResolvedValue({
        id: 1,
        slug: "test",
      } as any);
      const result = await categoryService.getCategoryBySlug("test");
      expect(result.isOk()).toBe(true);
    });

    it("should return error if not found", async () => {
      vi.mocked(productRepository.getCategoryBySlug).mockResolvedValue(null as any);
      const result = await categoryService.getCategoryBySlug("test");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("createCategory", () => {
    it("should create category and assign sortOrder", async () => {
      vi.mocked(productRepository.getCategories).mockResolvedValue([{ sortOrder: 5 }] as any);
      vi.mocked(productRepository.createCategory).mockResolvedValue({
        id: 1,
        name: "Test",
        sortOrder: 15,
      } as any);

      const result = await categoryService.createCategory({ name: "Test", slug: "test" });

      expect(result.isOk()).toBe(true);
      expect(productRepository.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 15 }),
      );
    });

    it("should return error if grid position taken", async () => {
      vi.mocked(productRepository.getCategories).mockResolvedValue([
        { id: 1, featuredOnHomepage: true, gridPosition: 1 },
      ] as any);

      const result = await categoryService.createCategory({
        name: "Test",
        slug: "test",
        featuredOnHomepage: true,
        gridPosition: 1,
      });

      expect(result.isErr()).toBe(true);
    });
  });

  describe("updateCategory", () => {
    it("should update category and check circular reference", async () => {
      vi.mocked(productRepository.getCategories).mockResolvedValue([{ id: 2, parentId: 1 }] as any);
      vi.mocked(productRepository.updateCategory).mockResolvedValue({
        id: 1,
        name: "Updated",
      } as any);

      const result = await categoryService.updateCategory(1, { name: "Updated" });

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateCategories).toHaveBeenCalled();
      expect(webhookService.trigger).toHaveBeenCalledWith("category.updated", expect.any(Object));
    });

    it("should prevent circular reference", async () => {
      vi.mocked(productRepository.getCategories).mockResolvedValue([{ id: 2, parentId: 1 }] as any);

      // Update category 1 to have parentId 2 (which already has parentId 1)
      const result = await categoryService.updateCategory(1, { parentId: 2 });

      expect(result.isErr()).toBe(true);
    });
  });

  describe("deleteCategory", () => {
    it("should delete category and trigger webhook", async () => {
      vi.mocked(productRepository.deleteCategory).mockResolvedValue(true as any);
      const result = await categoryService.deleteCategory(1);

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateCategories).toHaveBeenCalled();
      expect(webhookService.trigger).toHaveBeenCalledWith("category.deleted", { id: 1 });
    });
  });

  describe("restoreCategory", () => {
    it("should restore category and trigger webhook", async () => {
      vi.mocked(productRepository.restoreCategory).mockResolvedValue(true as any);
      const result = await categoryService.restoreCategory(1);

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateCategories).toHaveBeenCalled();
      expect(webhookService.trigger).toHaveBeenCalledWith("category.restored", { id: 1 });
    });
  });

  describe("hardDeleteCategory", () => {
    it("should hard delete category and trigger webhook", async () => {
      vi.mocked(productRepository.permanentlyDeleteCategory).mockResolvedValue(true as any);
      const result = await categoryService.hardDeleteCategory(1);

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateCategories).toHaveBeenCalled();
      expect(webhookService.trigger).toHaveBeenCalledWith("category.deleted", {
        id: 1,
        permanent: true,
      });
    });
  });
});
