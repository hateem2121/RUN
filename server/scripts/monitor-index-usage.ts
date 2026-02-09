/**
 * Index Usage Monitoring Script
 *
 * Tracks PostgreSQL index usage statistics to identify:
 * - Unused indexes (idx_scan = 0)
 * - Most and least used indexes
 * - Index size and efficiency metrics
 *
 * Usage: tsx server/scripts/monitor-index-usage.ts
 */

import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { logger } from "../lib/monitoring/logger.js";

interface IndexUsageStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
  index_size: string;
  index_size_bytes: number;
}

interface IndexUsageSummary {
  totalIndexes: number;
  unusedIndexes: IndexUsageStats[];
  mostUsedIndexes: IndexUsageStats[];
  leastUsedIndexes: IndexUsageStats[];
  totalIndexSize: string;
  unusedIndexSize: string;
}

export class IndexUsageMonitor {
  /**
   * Get all unused indexes (idx_scan = 0, excluding primary keys)
   */
  async getUnusedIndexes(): Promise<IndexUsageStats[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexrelname as indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          pg_relation_size(indexrelid) as index_size_bytes
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan = 0
          AND indexrelname NOT LIKE '%_pkey'
        ORDER BY pg_relation_size(indexrelid) DESC;
      `);

      return result.rows as unknown as IndexUsageStats[];
    } catch (error) {
      logger.error("[IndexMonitor] Failed to get unused indexes:", error);
      throw error;
    }
  }

  /**
   * Get top N most-used indexes
   */
  async getMostUsedIndexes(limit: number = 10): Promise<IndexUsageStats[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexrelname as indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          pg_relation_size(indexrelid) as index_size_bytes
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND indexrelname NOT LIKE '%_pkey'
        ORDER BY idx_scan DESC
        LIMIT ${limit};
      `);

      return result.rows as unknown as IndexUsageStats[];
    } catch (error) {
      logger.error("[IndexMonitor] Failed to get most-used indexes:", error);
      throw error;
    }
  }

  /**
   * Get top N least-used indexes (excluding completely unused)
   */
  async getLeastUsedIndexes(limit: number = 10): Promise<IndexUsageStats[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexrelname as indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          pg_relation_size(indexrelid) as index_size_bytes
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan > 0
          AND indexrelname NOT LIKE '%_pkey'
        ORDER BY idx_scan ASC
        LIMIT ${limit};
      `);

      return result.rows as unknown as IndexUsageStats[];
    } catch (error) {
      logger.error("[IndexMonitor] Failed to get least-used indexes:", error);
      throw error;
    }
  }

  /**
   * Get total index count and size across all tables
   */
  async getTotalIndexStats(): Promise<{
    totalCount: number;
    total: string;
    totalBytes: number;
  }> {
    try {
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_count,
          pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_size,
          SUM(pg_relation_size(indexrelid)) as total_bytes
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND indexrelname NOT LIKE '%_pkey';
      `);

      const row = result.rows[0] as any;
      return {
        totalCount: parseInt(row.total_count, 10) || 0,
        total: row.total_size,
        totalBytes: parseInt(row.total_bytes, 10) || 0,
      };
    } catch (error) {
      logger.error("[IndexMonitor] Failed to get total index stats:", error);
      throw error;
    }
  }

  /**
   * Generate comprehensive index usage summary
   */
  async generateSummary(): Promise<IndexUsageSummary> {
    try {
      const [unusedIndexes, mostUsedIndexes, leastUsedIndexes, totalStats] = await Promise.all([
        this.getUnusedIndexes(),
        this.getMostUsedIndexes(10),
        this.getLeastUsedIndexes(10),
        this.getTotalIndexStats(),
      ]);

      const unusedSize = unusedIndexes.reduce((sum, idx) => sum + idx.index_size_bytes, 0);

      return {
        totalIndexes: totalStats.totalCount,
        unusedIndexes,
        mostUsedIndexes,
        leastUsedIndexes,
        totalIndexSize: totalStats.total,
        unusedIndexSize: this.formatBytes(unusedSize),
      };
    } catch (error) {
      logger.error("[IndexMonitor] Failed to generate summary:", error);
      throw error;
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Print formatted report to console
   */
  async printReport(): Promise<void> {
    const summary = await this.generateSummary();

    // Unused Indexes
    if (summary.unusedIndexes.length > 0) {
      for (const _idx of summary.unusedIndexes) {
      }
    } else {
    }

    for (const _idx of summary.mostUsedIndexes) {
    }

    for (const _idx of summary.leastUsedIndexes) {
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new IndexUsageMonitor();

  monitor
    .printReport()
    .then(() => {
      logger.info("[IndexMonitor] Report generated successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("[IndexMonitor] Failed to generate report:", error);
      process.exit(1);
    });
}

export type { IndexUsageStats, IndexUsageSummary };
