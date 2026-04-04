import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL must be set in production");
}

if (!process.env.DATABASE_URL) {
  console.warn("[Drizzle] ⚠️ DATABASE_URL is not set. Database operations will fail.");
}

export default defineConfig({
  out: "./migrations",
  schema: "../shared/schemas/index.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost/dummy",
  },
  tablesFilter: [
    "!pg_stat_statements",
    "!pg_stat_statements_info",
    "!local_cache",
    "!neon_lfc_stats",
    "!neon_backend_perf_counters",
    "!neon_perf_counters",
    "!neon_stat_file_cache",
  ],
});
