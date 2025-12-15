/**
 * Database Health Verification Script
 * 
 * Purpose: Verify database optimizations and identify slow queries
 * Usage: tsx scripts/verify-database-health.ts
 */

import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

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
    console.log('🔍 Checking database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function checkRequiredIndexes(): Promise<void> {
  console.log('📊 Checking required indexes...\n');

  const requiredIndexes = [
    // Critical indexes for performance
    { table: 'media_assets', index: 'media_hot_query_idx', importance: 'CRITICAL' },
    { table: 'products', index: 'products_hot_query_idx', importance: 'CRITICAL' },
    { table: 'categories', index: 'categories_slug_unique_active', importance: 'CRITICAL' },
    { table: 'sessions', index: 'IDX_session_expire', importance: 'CRITICAL' },
    
    // Product URL index: Either legacy OR covering index must exist (check both)
    { table: 'products', index: 'products_url_path_active_idx', importance: 'LEGACY_OR_COVERING' },
    { table: 'products', index: 'products_url_path_covering_idx', importance: 'LEGACY_OR_COVERING' },
    
    // Optimization indexes (may not exist yet)
    { table: 'fabrics', index: 'fabrics_name_trgm_idx', importance: 'RECOMMENDED' },
    { table: 'accessories', index: 'accessories_name_trgm_idx', importance: 'RECOMMENDED' },
    { table: 'accessories', index: 'accessories_description_trgm_idx', importance: 'RECOMMENDED' },
    { table: 'accessories', index: 'accessories_sku_trgm_idx', importance: 'RECOMMENDED' },
  ];

  const existingIndexes = await db.execute<IndexInfo>(sql`
    SELECT schemaname, tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public'
  `);

  const indexSet = new Set(existingIndexes.rows.map(idx => idx.indexname));

  let missingCount = 0;
  let criticalMissing = 0;
  
  // Special handling for LEGACY_OR_COVERING: Either old or new index must exist
  const hasLegacyUrlIndex = indexSet.has('products_url_path_active_idx');
  const hasCoveringUrlIndex = indexSet.has('products_url_path_covering_idx');
  const urlIndexOk = hasLegacyUrlIndex || hasCoveringUrlIndex;

  for (const { table, index, importance } of requiredIndexes) {
    const exists = indexSet.has(index);
    
    // Special handling for LEGACY_OR_COVERING
    if (importance === 'LEGACY_OR_COVERING') {
      if (index === 'products_url_path_active_idx') {
        const status = hasLegacyUrlIndex ? '✅' : (hasCoveringUrlIndex ? 'ℹ️' : '❌');
        const label = hasLegacyUrlIndex ? 'LEGACY (OK)' : (hasCoveringUrlIndex ? 'REPLACED BY COVERING' : 'MISSING');
        console.log(`${status} ${table}.${index} [${label}]`);
      } else if (index === 'products_url_path_covering_idx') {
        const status = hasCoveringUrlIndex ? '✅' : (hasLegacyUrlIndex ? 'ℹ️' : '❌');
        const label = hasCoveringUrlIndex ? 'COVERING (OPTIMAL)' : (hasLegacyUrlIndex ? 'USE LEGACY' : 'MISSING');
        console.log(`${status} ${table}.${index} [${label}]`);
      }
      
      // Count as critical missing only if NEITHER index exists
      if (!urlIndexOk && !exists) {
        criticalMissing = 1; // Only count once for the pair
      }
      continue;
    }
    
    // Regular index handling
    const status = exists ? '✅' : (importance === 'CRITICAL' ? '❌' : '⚠️');
    const label = importance === 'CRITICAL' ? 'REQUIRED' : 'OPTIONAL';
    
    console.log(`${status} ${table}.${index} [${label}]`);
    
    if (!exists) {
      missingCount++;
      if (importance === 'CRITICAL') {
        criticalMissing++;
      }
    }
  }

  console.log(`\n📋 Index Summary:`);
  console.log(`   Total Indexes Checked: ${requiredIndexes.length}`);
  console.log(`   Missing Indexes: ${missingCount}`);
  console.log(`   Critical Missing: ${criticalMissing}`);

  if (criticalMissing > 0) {
    console.log('\n⚠️  WARNING: Critical indexes are missing! Database performance may be degraded.');
  } else {
    console.log('\n✅ All critical indexes are present');
  }

  console.log('');
}

async function checkPgTrgmExtension(): Promise<void> {
  console.log('🔧 Checking pg_trgm extension...\n');

  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
      ) as installed
    `);

    const installed = result.rows[0]?.installed;

    if (installed) {
      console.log('✅ pg_trgm extension is installed');
      console.log('   → Full-text search indexes are available\n');
    } else {
      console.log('⚠️  pg_trgm extension is NOT installed');
      console.log('   → Run: CREATE EXTENSION pg_trgm;');
      console.log('   → Required for search optimization (see 001_add_search_indexes.sql)\n');
    }
  } catch (error) {
    console.error('❌ Failed to check pg_trgm extension:', error);
  }
}

async function analyzeTableStats(): Promise<void> {
  console.log('📈 Analyzing table statistics...\n');

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

    console.log('Top 10 Largest Tables:\n');
    console.log('Table Name                  | Rows     | Total Size | Index Size');
    console.log('----------------------------|----------|------------|------------');

    for (const row of stats.rows) {
      const tableName = (row.table_name || 'unknown').padEnd(26);
      const rowCount = String(row.row_count || 0).padStart(8);
      const totalSize = (row.total_size || 'N/A').padStart(10);
      const indexSize = (row.index_size || 'N/A').padStart(10);
      
      console.log(`${tableName} | ${rowCount} | ${totalSize} | ${indexSize}`);
    }

    console.log('');
  } catch (error) {
    console.error('❌ Failed to analyze table stats:', error);
  }
}

async function checkSlowQueries(): Promise<void> {
  console.log('🐌 Checking for slow queries (requires pg_stat_statements)...\n');

  try {
    // Check if pg_stat_statements is available
    const extensionCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      ) as installed
    `);

    if (!extensionCheck.rows[0]?.installed) {
      console.log('⚠️  pg_stat_statements extension not installed');
      console.log('   → Slow query tracking is unavailable');
      console.log('   → Contact NEON support to enable pg_stat_statements\n');
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
      console.log('✅ No slow queries detected (all queries <500ms average)\n');
      return;
    }

    console.log('⚠️  Slow Queries Detected (>500ms average):\n');
    console.log('Query Excerpt                                              | Calls | Avg Time | Total Time');
    console.log('-----------------------------------------------------------|-------|----------|------------');

    for (const row of slowQueries.rows) {
      const queryExcerpt = (row.query || '').substring(0, 55).padEnd(55);
      const calls = String(row.calls || 0).padStart(5);
      const avgTime = (row.mean_exec_time?.toFixed(2) || 'N/A').padStart(8);
      const totalTime = (row.total_exec_time?.toFixed(2) || 'N/A').padStart(10);
      
      console.log(`${queryExcerpt} | ${calls} | ${avgTime}ms | ${totalTime}ms`);
    }

    console.log('\n⚠️  Action Required: Investigate slow queries and add indexes\n');
  } catch (error) {
    console.log('ℹ️  pg_stat_statements not available (NEON may not support it)\n');
  }
}

async function verifyNEONPooler(): Promise<void> {
  console.log('🔌 Verifying NEON Pooler configuration...\n');

  const databaseUrl = process.env.DATABASE_URL || '';
  const hasPooler = databaseUrl.includes('-pooler');

  if (hasPooler) {
    console.log('✅ DATABASE_URL includes "-pooler" suffix');
    console.log('   → Connection pooling is enabled');
    console.log('   → Optimal for high-traffic scenarios\n');
  } else {
    console.log('⚠️  DATABASE_URL does NOT include "-pooler" suffix');
    console.log('   → Connection pooling may not be optimal');
    console.log('   → Risk: Connection limits during traffic spikes');
    console.log('   → Update DATABASE_URL to include -pooler:');
    console.log('     postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db\n');
  }
}

async function testQueryPerformance(): Promise<void> {
  console.log('⚡ Testing query performance...\n');

  const tests = [
    {
      name: 'Simple SELECT',
      query: sql`SELECT 1`,
      threshold: 10,
    },
    {
      name: 'Media Assets Count',
      query: sql`SELECT COUNT(*) FROM media_assets WHERE deleted_at IS NULL`,
      threshold: 50,
    },
    {
      name: 'Products Count',
      query: sql`SELECT COUNT(*) FROM products WHERE deleted_at IS NULL`,
      threshold: 50,
    },
    {
      name: 'Categories List',
      query: sql`SELECT COUNT(*) FROM categories WHERE deleted_at IS NULL`,
      threshold: 30,
    },
  ];

  for (const test of tests) {
    const startTime = performance.now();
    try {
      await db.execute(test.query);
      const duration = performance.now() - startTime;
      const status = duration < test.threshold ? '✅' : '⚠️';
      
      console.log(`${status} ${test.name}: ${duration.toFixed(2)}ms (threshold: ${test.threshold}ms)`);
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('');
}

async function generateHealthReport(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              DATABASE HEALTH CHECK REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const connectionOk = await checkDatabaseConnection();
  if (!connectionOk) {
    console.log('❌ Cannot proceed - database connection failed\n');
    process.exit(1);
  }

  await verifyNEONPooler();
  await checkPgTrgmExtension();
  await checkRequiredIndexes();
  await analyzeTableStats();
  await testQueryPerformance();
  await checkSlowQueries();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    REPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📚 Next Steps:\n');
  console.log('1. Review DATABASE_HEALTH_CHECK_REPORT.md for detailed analysis');
  console.log('2. Apply recommended migrations from migrations/optimizations/');
  console.log('3. Run this script again to verify improvements\n');

  console.log('💡 Optimization Migrations:\n');
  console.log('   → migrations/optimizations/001_add_search_indexes.sql');
  console.log('   → migrations/optimizations/002_add_covering_index.sql\n');
}

// Run the health check
generateHealthReport()
  .then(() => {
    console.log('✅ Health check completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
