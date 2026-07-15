import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../server/db.js";
import { StorageSingleton } from "../../../../../server/lib/storage-singleton.js";
import { BlogRepository } from "../../../../../server/services/repositories/blog-repository.js";

vi.mock("../../../../../server/db.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

describe("BlogRepository", () => {
  let repository: BlogRepository;
  let mockStorageInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new BlogRepository();

    mockStorageInstance = {
      getBlogPosts: vi.fn(),
      getBlogPost: vi.fn(),
      getBlogPostBySlug: vi.fn(),
      createBlogPost: vi.fn(),
      updateBlogPost: vi.fn(),
      deleteBlogPost: vi.fn(),
      restoreBlogPost: vi.fn(),
      getBlogCategories: vi.fn(),
      createBlogCategory: vi.fn(),
      updateBlogCategory: vi.fn(),
      deleteBlogCategory: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);
  });

  describe("when StorageSingleton has instance", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    it("getBlogPosts delegates to StorageSingleton", async () => {
      mockStorageInstance.getBlogPosts.mockResolvedValue({ posts: [], total: 0 });
      await repository.getBlogPosts(10, 0, { status: "published" });
      expect(mockStorageInstance.getBlogPosts).toHaveBeenCalledWith(10, 0, { status: "published" });
    });

    it("getBlogPost delegates to StorageSingleton", async () => {
      mockStorageInstance.getBlogPost.mockResolvedValue({ id: 1 });
      await repository.getBlogPost(1);
      expect(mockStorageInstance.getBlogPost).toHaveBeenCalledWith(1);
    });

    it("getBlogPostBySlug delegates to StorageSingleton", async () => {
      mockStorageInstance.getBlogPostBySlug.mockResolvedValue({ id: 1 });
      await repository.getBlogPostBySlug("slug");
      expect(mockStorageInstance.getBlogPostBySlug).toHaveBeenCalledWith("slug");
    });

    it("createBlogPost delegates to StorageSingleton", async () => {
      const post = { title: "title" } as any;
      mockStorageInstance.createBlogPost.mockResolvedValue({ id: 1 });
      await repository.createBlogPost(post);
      expect(mockStorageInstance.createBlogPost).toHaveBeenCalledWith(post);
    });

    it("updateBlogPost delegates to StorageSingleton", async () => {
      const post = { title: "title" } as any;
      mockStorageInstance.updateBlogPost.mockResolvedValue({ id: 1 });
      await repository.updateBlogPost(1, post);
      expect(mockStorageInstance.updateBlogPost).toHaveBeenCalledWith(1, post);
    });

    it("deleteBlogPost delegates to StorageSingleton", async () => {
      mockStorageInstance.deleteBlogPost.mockResolvedValue(true);
      await repository.deleteBlogPost(1);
      expect(mockStorageInstance.deleteBlogPost).toHaveBeenCalledWith(1);
    });

    it("restoreBlogPost delegates to StorageSingleton", async () => {
      mockStorageInstance.restoreBlogPost.mockResolvedValue(true);
      await repository.restoreBlogPost(1);
      expect(mockStorageInstance.restoreBlogPost).toHaveBeenCalledWith(1);
    });

    it("getBlogCategories delegates to StorageSingleton", async () => {
      mockStorageInstance.getBlogCategories.mockResolvedValue([]);
      await repository.getBlogCategories();
      expect(mockStorageInstance.getBlogCategories).toHaveBeenCalled();
    });

    it("createBlogCategory delegates to StorageSingleton", async () => {
      const cat = { name: "cat" } as any;
      mockStorageInstance.createBlogCategory.mockResolvedValue({ id: 1 });
      await repository.createBlogCategory(cat);
      expect(mockStorageInstance.createBlogCategory).toHaveBeenCalledWith(cat);
    });

    it("updateBlogCategory delegates to StorageSingleton", async () => {
      const cat = { name: "cat" } as any;
      mockStorageInstance.updateBlogCategory.mockResolvedValue({ id: 1 });
      await repository.updateBlogCategory(1, cat);
      expect(mockStorageInstance.updateBlogCategory).toHaveBeenCalledWith(1, cat);
    });

    it("deleteBlogCategory delegates to StorageSingleton", async () => {
      mockStorageInstance.deleteBlogCategory.mockResolvedValue(true);
      await repository.deleteBlogCategory(1);
      expect(mockStorageInstance.deleteBlogCategory).toHaveBeenCalledWith(1);
    });
  });

  describe("when StorageSingleton has no instance (db logic)", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
    });

    // Mock chaining for drizzle
    const createMockDbChain = (result: any) => {
      const chain: any = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(result),
      };
      // For selects that don't call returning
      chain.then = (resolve: any) => resolve(result);
      return chain;
    };

    it("getBlogPosts uses db queries", async () => {
      // getBlogPosts runs two queries with Promise.all
      const mockQueryChain = createMockDbChain([]);
      const mockCountChain = createMockDbChain([{ count: 2 }]);

      vi.mocked(db.select).mockImplementation((opts?: any) => {
        if (opts?.count) {
          return mockCountChain;
        }
        return mockQueryChain;
      });

      const res = await repository.getBlogPosts(10, 0, {
        status: "published",
        categoryId: 1,
        authorId: "abc",
        search: "test",
        includeDeleted: false,
      });

      expect(res.total).toBe(2);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it("getBlogPost uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);

      const res = await repository.getBlogPost(1);
      expect(res).toEqual({ id: 1 });
    });

    it("getBlogPostBySlug uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);

      const res = await repository.getBlogPostBySlug("slug");
      expect(res).toEqual({ id: 1 });
    });

    it("createBlogPost uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.insert).mockReturnValue(chain);

      const res = await repository.createBlogPost({ title: "title" } as any);
      expect(res).toEqual({ id: 1 });
    });

    it("updateBlogPost uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.update).mockReturnValue(chain);

      const res = await repository.updateBlogPost(1, { title: "title" } as any);
      expect(res).toEqual({ id: 1 });
    });

    it("deleteBlogPost uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.update).mockReturnValue(chain);

      const res = await repository.deleteBlogPost(1);
      expect(res).toBe(true);
    });

    it("restoreBlogPost uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.update).mockReturnValue(chain);

      const res = await repository.restoreBlogPost(1);
      expect(res).toBe(true);
    });

    it("getBlogCategories uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);

      const res = await repository.getBlogCategories();
      expect(res).toEqual([{ id: 1 }]);
    });

    it("createBlogCategory uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.insert).mockReturnValue(chain);

      const res = await repository.createBlogCategory({ name: "cat" } as any);
      expect(res).toEqual({ id: 1 });
    });

    it("updateBlogCategory uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.update).mockReturnValue(chain);

      const res = await repository.updateBlogCategory(1, { name: "cat" } as any);
      expect(res).toEqual({ id: 1 });
    });

    it("deleteBlogCategory uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.delete).mockReturnValue(chain);

      const res = await repository.deleteBlogCategory(1);
      expect(res).toBe(true);
    });
  });
});
