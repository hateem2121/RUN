import { describe, expect, it } from "vitest";
import { blogCategories, blogPosts } from "../../../../shared/schemas/blog.js";

describe("Blog Schemas", () => {
  describe("blogCategories", () => {
    it("should define an onUpdate function for updatedAt that returns a Date", () => {
      const onUpdateFn = blogCategories.updatedAt.onUpdateFn;
      expect(onUpdateFn).toBeDefined();
      if (onUpdateFn) {
        expect(onUpdateFn()).toBeInstanceOf(Date);
      }
    });
  });

  describe("blogPosts", () => {
    it("should define an onUpdate function for updatedAt that returns a Date", () => {
      const onUpdateFn = blogPosts.updatedAt.onUpdateFn;
      expect(onUpdateFn).toBeDefined();
      if (onUpdateFn) {
        expect(onUpdateFn()).toBeInstanceOf(Date);
      }
    });

    it("should have relation fields defined", () => {
      // Just accessing these to ensure the definition functions are executed
      expect(blogPosts.categoryId).toBeDefined();
      expect(blogPosts.featuredImageId).toBeDefined();
      expect(blogPosts.authorId).toBeDefined();
    });
  });
});
