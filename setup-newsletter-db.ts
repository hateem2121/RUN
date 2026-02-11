import { sql } from "drizzle-orm";
import { db } from "./server/db.js";

async function setup() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
      );
    `);
    process.exit(0);
  } catch (_err) {
    process.exit(1);
  }
}

setup();
