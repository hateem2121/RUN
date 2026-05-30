import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { mediaAssets } from "./media";
import { users } from "./users";

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    featuredImageId: integer("featured_image_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    categoryId: integer("category_id").references(() => blogCategories.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .default("draft")
      .notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
    // SEO & Social
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    ogImage: text("og_image"),
    keywords: text("keywords"),
  },
  (table) => [
    index("blog_posts_featured_image_id_idx").on(table.featuredImageId),
    index("blog_posts_category_id_idx").on(table.categoryId),
    index("blog_posts_author_id_idx").on(table.authorId),
    index("blog_posts_status_idx").on(table.status),
    index("blog_posts_deleted_at_idx").on(table.deletedAt),
  ],
);

export const insertBlogCategorySchema = createInsertSchema(blogCategories);
export const selectBlogCategorySchema = createSelectSchema(blogCategories);
export const insertBlogPostSchema = createInsertSchema(blogPosts);
export const selectBlogPostSchema = createSelectSchema(blogPosts);

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = typeof blogCategories.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
