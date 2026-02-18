import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Enable connection caching for serverless environments (Neon)
// This reduces latency on cold starts by caching the connection setup
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, {
  schema,
  casing: "snake_case",
});
