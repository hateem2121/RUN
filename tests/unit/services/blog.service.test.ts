import { beforeEach, describe, expect, it, vi } from "vitest";
import { blogRepository } from "../../../server/lib/db/repositories/index.js";
import { InternalError, NotFoundError } from "../../../server/lib/errors.js";
import { blogService } from "../../../server/services/blog.service.js";

// Mock the repository
vi.mock("../../../server/lib/db/repositories/index.js", () => ({
  blogRepository: {
    getBlogCategories: vi.fn(),
    createBlogCategory: vi.fn(),
    updateBlogCategory: vi.fn(),
    deleteBlogCategory: vi.fn(),
  },
}));

// Mock the circuit breaker to just run the function
vi.mock("../../../server/lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn(async (_name, fn) => {
    return await fn();
  }),
  DB_CIRCUIT_OPTIONS: {},
}));

describe("BlogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBlogCategories", () => {
    it("returns categories successfully", async () => {
      const mockCategories = [{ id: 1, name: "Tech" }];
      vi.mocked(blogRepository.getBlogCategories).mockResolvedValue(mockCategories as any);

      const result = await blogService.getBlogCategories();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockCategories);
      }
    });

    it("handles errors gracefully", async () => {
      vi.mocked(blogRepository.getBlogCategories).mockRejectedValue(new Error("DB Error"));

      const result = await blogService.getBlogCategories();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InternalError);
      }
    });
  });

  describe("deleteBlogCategory", () => {
    it("deletes a category successfully", async () => {
      vi.mocked(blogRepository.deleteBlogCategory).mockResolvedValue(true);

      const result = await blogService.deleteBlogCategory(1);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("returns NotFoundError if category doesn't exist", async () => {
      vi.mocked(blogRepository.deleteBlogCategory).mockResolvedValue(false);

      const result = await blogService.deleteBlogCategory(999);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });
});
