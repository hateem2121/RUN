import DOMPurify from "isomorphic-dompurify";
import { err, ok, type Result } from "neverthrow";
import {
  type BlogCategory,
  type BlogPost,
  insertBlogCategorySchema,
  insertBlogPostSchema,
  users,
} from "../../shared/index.js";
import { db } from "../db.js";
import { blogRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { removeUndefined } from "../lib/utilities/core-utils.js";

class BlogService {
  /**
   * List blog categories.
   */
  async getBlogCategories(): Promise<Result<BlogCategory[], AppError>> {
    try {
      const categories = await withCircuit(
        "get-blog-categories",
        () => blogRepository.getBlogCategories(),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(categories || []);
    } catch (error) {
      logger.error("[BlogService] Failed to list blog categories", undefined, error as Error);
      return err(new InternalError("Failed to list blog categories", { error }));
    }
  }

  /**
   * Create a blog category.
   */
  async createBlogCategory(data: unknown): Promise<Result<BlogCategory, AppError>> {
    try {
      const validatedData = insertBlogCategorySchema.parse(data);
      const category = await withCircuit(
        "create-blog-category",
        () => blogRepository.createBlogCategory(validatedData),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(category);
    } catch (error) {
      logger.error("[BlogService] Failed to create blog category", undefined, error as Error);
      return err(new InternalError("Failed to create blog category", { error }));
    }
  }

  /**
   * Update a blog category.
   */
  async updateBlogCategory(id: number, data: unknown): Promise<Result<BlogCategory, AppError>> {
    try {
      const validatedData = insertBlogCategorySchema.partial().parse(data);
      const category = await withCircuit(
        "update-blog-category",
        () => blogRepository.updateBlogCategory(id, removeUndefined(validatedData)),
        DB_CIRCUIT_OPTIONS,
      );
      if (!category) return err(new NotFoundError(`Blog category with ID ${id}`));
      return ok(category);
    } catch (error) {
      logger.error("[BlogService] Failed to update blog category", { id }, error as Error);
      return err(new InternalError("Failed to update blog category", { id, error }));
    }
  }

  /**
   * Delete a blog category.
   */
  async deleteBlogCategory(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        "delete-blog-category",
        () => blogRepository.deleteBlogCategory(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!deleted) return err(new NotFoundError(`Blog category with ID ${id}`));
      return ok(true);
    } catch (error) {
      logger.error("[BlogService] Failed to delete blog category", { id }, error as Error);
      return err(new InternalError("Failed to delete blog category", { id, error }));
    }
  }

  /**
   * List blog posts with pagination and filters.
   */
  async getBlogPosts(
    page: number,
    limit: number,
    filters: {
      status?: string;
      categoryId?: number;
      authorId?: string;
      search?: string;
      includeDeleted?: boolean;
    },
  ): Promise<Result<{ posts: BlogPost[]; total: number }, AppError>> {
    try {
      const result = await withCircuit(
        "get-blog-posts",
        () => blogRepository.getBlogPosts(limit, (page - 1) * limit, removeUndefined(filters)),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(result);
    } catch (error) {
      logger.error("[BlogService] Failed to list blog posts", undefined, error as Error);
      return err(new InternalError("Failed to list blog posts", { error }));
    }
  }

  /**
   * Create a blog post with author logic.
   */
  async createBlogPost(data: unknown, userId?: string): Promise<Result<BlogPost, AppError>> {
    try {
      let authorId = userId;
      if (!authorId) {
        const [firstUser] = await withCircuit(
          "get-fallback-author",
          () => db.select().from(users).limit(1),
          DB_CIRCUIT_OPTIONS,
        );
        authorId = firstUser ? firstUser.id : "system";
      }

      const payload = { ...(data as Record<string, unknown>), authorId };
      const validatedData = insertBlogPostSchema.parse(payload);
      if (validatedData.content) {
        validatedData.content = DOMPurify.sanitize(validatedData.content);
      }
      const post = await withCircuit(
        "create-blog-post",
        () => blogRepository.createBlogPost(validatedData),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(post);
    } catch (error) {
      logger.error("[BlogService] Failed to create blog post", undefined, error as Error);
      return err(new InternalError("Failed to create blog post", { error }));
    }
  }

  /**
   * Get blog post by ID.
   */
  async getBlogPostById(id: number): Promise<Result<BlogPost, AppError>> {
    try {
      const post = await withCircuit(
        "get-blog-post-by-id",
        () => blogRepository.getBlogPost(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!post) return err(new NotFoundError(`Blog post with ID ${id}`));
      return ok(post);
    } catch (error) {
      logger.error("[BlogService] Failed to fetch blog post", { id }, error as Error);
      return err(new InternalError("Failed to fetch blog post", { id, error }));
    }
  }

  /**
   * Get blog post by slug.
   */
  async getBlogPostBySlug(slug: string): Promise<Result<BlogPost, AppError>> {
    try {
      const post = await withCircuit(
        "get-blog-post-by-slug",
        () => blogRepository.getBlogPostBySlug(slug),
        DB_CIRCUIT_OPTIONS,
      );
      if (!post) return err(new NotFoundError(`Blog post with slug ${slug}`));
      return ok(post);
    } catch (error) {
      logger.error("[BlogService] Failed to fetch blog post by slug", { slug }, error as Error);
      return err(new InternalError("Failed to fetch blog post by slug", { slug, error }));
    }
  }

  /**
   * Update a blog post.
   */
  async updateBlogPost(id: number, data: unknown): Promise<Result<BlogPost, AppError>> {
    try {
      const validatedData = insertBlogPostSchema.partial().parse(data);
      if (validatedData.content) {
        validatedData.content = DOMPurify.sanitize(validatedData.content);
      }
      const post = await withCircuit(
        "update-blog-post",
        () => blogRepository.updateBlogPost(id, removeUndefined(validatedData)),
        DB_CIRCUIT_OPTIONS,
      );
      if (!post) return err(new NotFoundError(`Blog post with ID ${id}`));
      return ok(post);
    } catch (error) {
      logger.error("[BlogService] Failed to update blog post", { id }, error as Error);
      return err(new InternalError("Failed to update blog post", { id, error }));
    }
  }

  /**
   * Delete a blog post.
   */
  async deleteBlogPost(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        "delete-blog-post",
        () => blogRepository.deleteBlogPost(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!deleted) return err(new NotFoundError(`Blog post with ID ${id}`));
      return ok(true);
    } catch (error) {
      logger.error("[BlogService] Failed to delete blog post", { id }, error as Error);
      return err(new InternalError("Failed to delete blog post", { id, error }));
    }
  }

  /**
   * Restore a blog post.
   */
  async restoreBlogPost(id: number): Promise<Result<boolean, AppError>> {
    try {
      const restored = await withCircuit(
        "restore-blog-post",
        () => blogRepository.restoreBlogPost(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!restored) return err(new NotFoundError(`Blog post with ID ${id}`));
      return ok(true);
    } catch (error) {
      logger.error("[BlogService] Failed to restore blog post", { id }, error as Error);
      return err(new InternalError("Failed to restore blog post", { id, error }));
    }
  }
}

export const blogService = new BlogService();
