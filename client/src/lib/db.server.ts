import { neon } from "@neondatabase/serverless";
import * as schema from "@run-remix/shared"; // Aliased via package.json main
import { drizzle } from "drizzle-orm/neon-http";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema, casing: "snake_case" });
