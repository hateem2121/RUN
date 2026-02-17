import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  BlogCategory,
  BlogPost,
  InsertBlogCategory,
  InsertBlogPost,
} from "../../../../shared/schema.js";
import { blogCategories, blogPosts } from "../../../../shared/schema.js";
import { db } from "../../../db.js";
import type { IBlogRepository } from "../../../repositories/storage-interfaces.js";

export class BlogRepository implements IBlogRepository {
  async getBlogPosts(
    limit: number = 50,
    offset: number = 0,
    filters?: {
      status?: string;
      categoryId?: number;
      authorId?: string;
      search?: string;
      includeDeleted?: boolean;
    },
  ): Promise<{ posts: BlogPost[]; total: number }> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(blogPosts.status, filters.status as "draft" | "published" | "archived"));
    }

    if (filters?.categoryId) {
      conditions.push(eq(blogPosts.categoryId, filters.categoryId));
    }

    if (filters?.authorId) {
      conditions.push(eq(blogPosts.authorId, filters.authorId));
    }

    if (!filters?.includeDeleted) {
      conditions.push(sql`${blogPosts.deletedAt} IS NULL`);
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(blogPosts.title, `%${filters.search}%`),
          ilike(blogPosts.content, `%${filters.search}%`),
        ),
      );
    }

    const query = db
      .select()
      .from(blogPosts)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(blogPosts.createdAt));

    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(and(...conditions));

    const [posts, [totalResult]] = await Promise.all([query, totalQuery]);

    return {
      posts: posts as BlogPost[],
      total: Number(totalResult?.count || 0),
    };
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return post as BlogPost | undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return post as BlogPost | undefined;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost as BlogPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost as BlogPost | undefined;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const [deletedPost] = await db
      .update(blogPosts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return !!deletedPost;
  }

  async restoreBlogPost(id: number): Promise<boolean> {
    const [restoredPost] = await db
      .update(blogPosts)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return !!restoredPost;
  }

  async getBlogCategories(): Promise<BlogCategory[]> {
    return await db.select().from(blogCategories).orderBy(desc(blogCategories.name));
  }

  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const [newCategory] = await db.insert(blogCategories).values(category).returning();
    return newCategory as BlogCategory;
  }

  async updateBlogCategory(
    id: number,
    category: Partial<InsertBlogCategory>,
  ): Promise<BlogCategory | undefined> {
    const [updatedCategory] = await db
      .update(blogCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(blogCategories.id, id))
      .returning();
    return updatedCategory as BlogCategory | undefined;
  }

  async deleteBlogCategory(id: number): Promise<boolean> {
    const [deletedCategory] = await db
      .delete(blogCategories)
      .where(eq(blogCategories.id, id))
      .returning();
    return !!deletedCategory;
  }
}
