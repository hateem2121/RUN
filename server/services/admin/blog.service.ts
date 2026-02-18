import type {
  BlogCategory,
  BlogPost,
  InsertBlogCategory,
  InsertBlogPost,
} from "../../../shared/schema.js";
import { insertBlogCategorySchema, insertBlogPostSchema } from "../../../shared/schema.js";
import { blogRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { type AuditContext, adminService } from "./admin.service.js";

export class BlogService {
  /**
   * Generates a URL-friendly slug from a title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Get all blog posts with pagination and filters
   */
  async getPosts(
    limit: number = 50,
    offset: number = 0,
    filters?: {
      status?: string;
      categoryId?: number;
      authorId?: string;
      search?: string;
    },
  ) {
    return await blogRepository.getBlogPosts(limit, offset, filters);
  }

  /**
   * Get a single post by ID
   */
  async getPost(id: number) {
    const post = await blogRepository.getBlogPost(id);
    if (!post) {
      throw new Error(`Blog post with ID ${id} not found`);
    }
    return post;
  }

  /**
   * Create a new blog post
   */
  async createPost(audit: AuditContext, data: InsertBlogPost) {
    // Validate data
    const validated = insertBlogPostSchema.parse(data);

    // Generate slug if not provided
    if (!validated.slug) {
      const baseSlug = this.generateSlug(validated.title);
      // Basic collision avoidance
      const existing = await blogRepository.getBlogPostBySlug(baseSlug);
      validated.slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
    }

    // Set author
    validated.authorId = audit.user.id;

    const post = await blogRepository.createBlogPost(validated);

    // Audit log
    await adminService.logAudit({
      action: "CREATE",
      tableName: "blog_posts",
      recordId: post.id.toString(),
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
      newValues: post,
    });

    return post;
  }

  /**
   * Update an existing blog post
   */
  async updatePost(audit: AuditContext, id: number, data: Partial<InsertBlogPost>) {
    const existing = await blogRepository.getBlogPost(id);
    if (!existing) {
      throw new Error(`Blog post with ID ${id} not found`);
    }

    if (data.title && !data.slug && existing.status === "draft") {
      data.slug = this.generateSlug(data.title);
    }

    const post = await blogRepository.updateBlogPost(id, data);

    // Audit log
    await adminService.logAudit({
      action: "UPDATE",
      tableName: "blog_posts",
      recordId: id.toString(),
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
      newValues: data,
      oldValues: existing,
    });

    return post;
  }

  /**
   * Delete a blog post (soft delete)
   */
  async deletePost(audit: AuditContext, id: number) {
    const existing = await blogRepository.getBlogPost(id);
    const success = await blogRepository.deleteBlogPost(id);

    if (success && existing) {
      await adminService.logAudit({
        action: "DELETE",
        tableName: "blog_posts",
        recordId: id.toString(),
        user: audit.user,
        userAgent: audit.userAgent,
        ipAddress: audit.ipAddress,
        metadata: { action: "soft-delete" },
        oldValues: existing,
      });
    }
    return success;
  }

  /**
   * Get all categories
   */
  async getCategories() {
    return await blogRepository.getBlogCategories();
  }

  /**
   * Create category
   */
  async createCategory(audit: AuditContext, data: InsertBlogCategory) {
    const validated = insertBlogCategorySchema.parse(data);
    const category = await blogRepository.createBlogCategory(validated);

    await adminService.logAudit({
      action: "CREATE",
      tableName: "blog_categories",
      recordId: category.id.toString(),
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
      newValues: category,
    });

    return category;
  }
}

export const blogService = new BlogService();
