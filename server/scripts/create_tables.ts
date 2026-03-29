import { sql } from "drizzle-orm";
import { db } from "../lib/db/index.js";

async function createTables() {
  try {
    console.log("Creating users table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" character varying(255) PRIMARY KEY,
        "email" character varying(255),
        "email_index" character varying(255),
        "first_name" character varying(255),
        "last_name" character varying(255),
        "profile_image_url" text,
        "is_admin" boolean DEFAULT false NOT NULL,
        "failed_login_attempts" text DEFAULT '0' NOT NULL,
        "lockout_until" timestamp(3),
        "created_at" timestamp(3) DEFAULT now() NOT NULL,
        "updated_at" timestamp(3) DEFAULT now() NOT NULL
      );
    `);
    console.log("Creating blog_categories table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_categories" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "description" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Creating blog_posts table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "content" text NOT NULL,
        "excerpt" text,
        "featured_image_id" integer,
        "category_id" integer REFERENCES "blog_categories"("id"),
        "author_id" character varying(255) NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "is_featured" boolean DEFAULT false NOT NULL,
        "published_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "deleted_at" timestamp,
        "meta_title" text,
        "meta_description" text,
        "canonical_url" text,
        "og_image" text,
        "keywords" text
      );
    `);

    console.log("Inserting a dummy user for foreign key satisfaction...");
    await db.execute(sql`
      INSERT INTO "users" ("id", "first_name", "last_name")
      VALUES ('system', 'System', 'Admin')
      ON CONFLICT ("id") DO NOTHING;
    `);

    console.log("All missing tables created. Ready for test.");
  } catch (e) {
    console.error("Failed to create tables:", e);
  }
}

createTables();
