/**
 * Database Health Verification Script
 *
 * Purpose: Verify database optimizations and identify slow queries
 * Usage: tsx scripts/verify-database-health.ts
 */

import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

interface IndexInfo extends Record<string, unknown> {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface SlowQuery extends Record<string, unknown> {
  query: string;
  calls: number;
  mean_exec_time: number;
  total_exec_time: number;
}

interface TableStats extends Record<string, unknown> {
  table_name: string;
  row_count: number;
  total_size: string;
  index_size: string;
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkRequiredIndexes(): Promise<void> {
  const requiredIndexes = [
    // Critical indexes for performance
    {
      table: "media_assets",
      index: "media_hot_query_idx",
      importance: "CRITICAL",
    },
    {
      table: "products",
      index: "products_hot_query_idx",
      importance: "CRITICAL",
    },
    {
      table: "categories",
      index: "categories_slug_unique_active",
      importance: "CRITICAL",
    },
    { table: "sessions", index: "IDX_session_expire", importance: "CRITICAL" },

    // Product URL index: Either legacy OR covering index must exist (check both)
    {
      table: "products",
      index: "products_url_path_active_idx",
      importance: "LEGACY_OR_COVERING",
    },
    {
      table: "products",
      index: "products_url_path_covering_idx",
      importance: "LEGACY_OR_COVERING",
    },

    // Optimization indexes (may not exist yet)
    {
      table: "fabrics",
      index: "fabrics_name_trgm_idx",
      importance: "RECOMMENDED",
    },
    {
      table: "accessories",
      index: "accessories_name_trgm_idx",
      importance: "RECOMMENDED",
    },
    {
      table: "accessories",
      index: "accessories_description_trgm_idx",
      importance: "RECOMMENDED",
    },
    {
      table: "accessories",
      index: "accessories_sku_trgm_idx",
      importance: "RECOMMENDED",
    },
  ];

  const existingIndexes = await db.execute<IndexInfo>(sql`
    SELECT schemaname, tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public'
  `);

  const indexSet = new Set(existingIndexes.rows.map((idx) => idx.indexname));

  let missingCount = 0;
  let criticalMissing = 0;

  // Special handling for LEGACY_OR_COVERING: Either old or new index must exist
  const hasLegacyUrlIndex = indexSet.has("products_url_path_active_idx");
  const hasCoveringUrlIndex = indexSet.has("products_url_path_covering_idx");
  const urlIndexOk = hasLegacyUrlIndex || hasCoveringUrlIndex;

  for (const { table, index, importance } of requiredIndexes) {
    const exists = indexSet.has(index);

    // Special handling for LEGACY_OR_COVERING
    if (importance === "LEGACY_OR_COVERING") {
      if (index === "products_url_path_active_idx") {
        const status = hasLegacyUrlIndex ? "✅" : hasCoveringUrlIndex ? "ℹ️" : "❌";
        const label = hasLegacyUrlIndex
          ? "LEGACY (OK)"
          : hasCoveringUrlIndex
            ? "REPLACED BY COVERING"
            : "MISSING";
      } else if (index === "products_url_path_covering_idx") {
        const status = hasCoveringUrlIndex ? "✅" : hasLegacyUrlIndex ? "ℹ️" : "❌";
        const label = hasCoveringUrlIndex
          ? "COVERING (OPTIMAL)"
          : hasLegacyUrlIndex
            ? "USE LEGACY"
            : "MISSING";
      }

      // Count as critical missing only if NEITHER index exists
      if (!urlIndexOk && !exists) {
        criticalMissing = 1; // Only count once for the pair
      }
      continue;
    }

    // Regular index handling
    const status = exists ? "✅" : importance === "CRITICAL" ? "❌" : "⚠️";
    const label = importance === "CRITICAL" ? "REQUIRED" : "OPTIONAL";

    if (!exists) {
      missingCount++;
      if (importance === "CRITICAL") {
        criticalMissing++;
      }
    }
  }

  if (criticalMissing > 0) {
  } else {
  }
}

async function checkPgTrgmExtension(): Promise<void> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
      ) as installed
    `);

    const installed = result.rows[0]?.installed;

    if (installed) {
    } else {
    }
  } catch (error) {}
}

async function analyzeTableStats(): Promise<void> {
  try {
    const stats = await db.execute<TableStats>(sql`
      SELECT 
        schemaname || '.' || tablename as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    for (const row of stats.rows) {
      const tableName = (row.table_name || "unknown").padEnd(26);
      const _rowCount = String(row.row_count || 0).padStart(8);
      const _totalSize = (row.total_size || "N/A").padStart(10);
      const _indexSize = (row.index_size || "N/A").padStart(10);
    }
  } catch (error) {}
}

async function checkSlowQueries(): Promise<void> {
  try {
    // Check if pg_stat_statements is available
    const extensionCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      ) as installed
    `);

    if (!extensionCheck.rows[0]?.installed) {
      return;
    }

    // Get slow queries (mean execution time > 500ms)
    const slowQueries = await db.execute<SlowQuery>(sql`
      SELECT 
        LEFT(query, 100) as query,
        calls,
        mean_exec_time,
        total_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 500
        AND query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%pg_indexes%'
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);

    if (slowQueries.rows.length === 0) {
      return;
    }

    for (const row of slowQueries.rows) {
      const _queryExcerpt = (row.query || "").substring(0, 55).padEnd(55);
      const _calls = String(row.calls || 0).padStart(5);
      const _avgTime = (row.mean_exec_time?.toFixed(2) || "N/A").padStart(8);
      const _totalTime = (row.total_exec_time?.toFixed(2) || "N/A").padStart(10);
    }
  } catch (error) {}
}

async function verifyNEONPooler(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL || "";
  const hasPooler = databaseUrl.includes("-pooler");

  if (hasPooler) {
  } else {
  }
}

async function testQueryPerformance(): Promise<void> {
  const tests = [
    {
      name: "Simple SELECT",
      query: sql`SELECT 1`,
      threshold: 10,
    },
    {
      name: "Media Assets Count",
      query: sql`SELECT COUNT(*) FROM media_assets WHERE deleted_at IS NULL`,
      threshold: 50,
    },
    {
      name: "Products Count",
      query: sql`SELECT COUNT(*) FROM products WHERE deleted_at IS NULL`,
      threshold: 50,
    },
    {
      name: "Categories List",
      query: sql`SELECT COUNT(*) FROM categories WHERE deleted_at IS NULL`,
      threshold: 30,
    },
  ];

  for (const test of tests) {
    const startTime = performance.now();
    try {
      await db.execute(test.query);
      const duration = performance.now() - startTime;
      const _status = duration < test.threshold ? "✅" : "⚠️";
    } catch (error) {}
  }
}

async function generateHealthReport(): Promise<void> {
  const connectionOk = await checkDatabaseConnection();
  if (!connectionOk) {
    process.exit(1);
  }

  await verifyNEONPooler();
  await checkPgTrgmExtension();
  await checkRequiredIndexes();
  await analyzeTableStats();
  await testQueryPerformance();
  await checkSlowQueries();
}

// Run the health check
generateHealthReport()
  .then(() => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
