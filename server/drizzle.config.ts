import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "../shared/schemas.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL,
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
