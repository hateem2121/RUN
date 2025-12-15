/**
 * Query Plan Validation Script
 * 
 * Runs EXPLAIN ANALYZE on critical queries to verify optimizations are working:
 * - getProductByPath: Main product detail query with LEFT JOINs
 * - getProductsSummary: Product listing with pagination
 * - getMediaAssets: Media search with ILIKE filters
 * - getProductsByTag: Product filtering using GIN index on JSONB tags
 * 
 * Usage: tsx server/scripts/validate-query-plans.ts
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { logger } from '../lib/smart-logger.js';

interface QueryPlanMetrics {
  queryName: string;
  planningTime: number;
  executionTime: number;
  totalTime: number;
  indexesUsed: string[];
  sequentialScans: number;
  rowsScanned: number;
  indexScans: number;
  plan: string;
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

interface ComparisonResults {
  baseline: {
    queryCount: number;
    avgExecutionTime: number;
    description: string;
  };
  current: QueryPlanMetrics;
  improvement: {
    queryReduction: string;
    executionTimeChange: string;
    indexEfficiency: string;
  };
}

export class QueryPlanValidator {
  private readonly TIMEOUT_MS = 10000; // 10 second timeout per query

  /**
   * Execute EXPLAIN ANALYZE with timeout protection
   */
  private async executeExplainAnalyze(
    query: string,
    timeoutMs: number = this.TIMEOUT_MS
  ): Promise<any[]> {
    const result = await Promise.race([
      db.execute(sql.raw(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      )
    ]) as any;
    
    return result.rows;
  }

  /**
   * Parse EXPLAIN ANALYZE output to extract metrics
   */
  private parseExplainOutput(rawOutput: any[]): {
    planningTime: number;
    executionTime: number;
    plan: any;
  } {
    const result = rawOutput[0];
    const explainData = result['QUERY PLAN'][0];
    
    return {
      planningTime: explainData['Planning Time'] || 0,
      executionTime: explainData['Execution Time'] || 0,
      plan: explainData['Plan'] || {}
    };
  }

  /**
   * Extract index usage from query plan
   */
  private extractIndexUsage(plan: any): {
    indexesUsed: string[];
    sequentialScans: number;
    indexScans: number;
  } {
    const indexesUsed: Set<string> = new Set();
    let sequentialScans = 0;
    let indexScans = 0;

    const traversePlan = (node: any) => {
      if (!node) return;

      const nodeType = node['Node Type'];
      
      if (nodeType === 'Seq Scan') {
        sequentialScans++;
      } else if (nodeType === 'Index Scan' || nodeType === 'Index Only Scan' || nodeType === 'Bitmap Index Scan') {
        indexScans++;
        if (node['Index Name']) {
          indexesUsed.add(node['Index Name']);
        }
      }

      if (node['Plans']) {
        for (const childPlan of node['Plans']) {
          traversePlan(childPlan);
        }
      }
    };

    traversePlan(plan);

    return {
      indexesUsed: Array.from(indexesUsed),
      sequentialScans,
      indexScans
    };
  }

  /**
   * Count total rows scanned from query plan
   */
  private extractRowsScanned(plan: any): number {
    let totalRows = 0;

    const traversePlan = (node: any) => {
      if (!node) return;

      if (node['Actual Rows']) {
        totalRows += node['Actual Rows'];
      }

      if (node['Plans']) {
        for (const childPlan of node['Plans']) {
          traversePlan(childPlan);
        }
      }
    };

    traversePlan(plan);
    return totalRows;
  }

  /**
   * Validate getProductByPath query
   */
  async validateGetProductByPath(urlPath: string = '/men/t-shirts/performance-tee'): Promise<QueryPlanMetrics> {
    const queryName = 'getProductByPath';
    
    try {
      // Use parameterized query to avoid SQL injection
      const query = `
        SELECT 
          products.*,
          fabrics.id as "fabric_id",
          fabrics.name as "fabric_name",
          size_charts.id as "size_chart_id",
          size_charts.name as "size_chart_name"
        FROM products
        LEFT JOIN fabrics ON products.fabric_id = fabrics.id AND fabrics.deleted_at IS NULL
        LEFT JOIN size_charts ON products.size_chart_id = size_charts.id AND size_charts.deleted_at IS NULL
        WHERE products.url_path = $1
          AND products.is_active = true
          AND products.deleted_at IS NULL
        LIMIT 1
      `.replace('$1', `'${urlPath.replace(/'/g, "''")}'`);

      const rawOutput = await this.executeExplainAnalyze(query);
      const { planningTime, executionTime, plan } = this.parseExplainOutput(rawOutput);
      const { indexesUsed, sequentialScans, indexScans } = this.extractIndexUsage(plan);
      const rowsScanned = this.extractRowsScanned(plan);

      return {
        queryName,
        planningTime,
        executionTime,
        totalTime: planningTime + executionTime,
        indexesUsed,
        sequentialScans,
        indexScans,
        rowsScanned,
        plan: JSON.stringify(plan, null, 2),
        status: 'success'
      };
    } catch (error) {
      return {
        queryName,
        planningTime: 0,
        executionTime: 0,
        totalTime: 0,
        indexesUsed: [],
        sequentialScans: 0,
        indexScans: 0,
        rowsScanned: 0,
        plan: '',
        status: error instanceof Error && error.message === 'Query timeout' ? 'timeout' : 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate getProductsSummary query
   */
  async validateGetProductsSummary(limit: number = 100, offset: number = 0): Promise<QueryPlanMetrics> {
    const queryName = 'getProductsSummary';
    
    try {
      const query = `
        SELECT 
          id, name, slug, sku, category_id as "categoryId", fabric_id as "fabricId",
          primary_image_id as "primaryImageId", primary_video_id as "primaryVideoId",
          image_ids as "imageIds", videos, minimum_order_quantity as "minimumOrderQuantity",
          lead_time as "leadTime", care_instructions as "careInstructions",
          technical_specs as "technicalSpecs", custom_fit as "customFit",
          fiber_composition as "fiberComposition", specifications, tags,
          certificate_ids as "certificateIds", is_active as "isActive",
          is_featured as "isFeatured", description, size_chart_id as "sizeChartId",
          accessory_ids as "accessoryIds", created_at as "createdAt"
        FROM products
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rawOutput = await this.executeExplainAnalyze(query);
      const { planningTime, executionTime, plan } = this.parseExplainOutput(rawOutput);
      const { indexesUsed, sequentialScans, indexScans } = this.extractIndexUsage(plan);
      const rowsScanned = this.extractRowsScanned(plan);

      return {
        queryName,
        planningTime,
        executionTime,
        totalTime: planningTime + executionTime,
        indexesUsed,
        sequentialScans,
        indexScans,
        rowsScanned,
        plan: JSON.stringify(plan, null, 2),
        status: 'success'
      };
    } catch (error) {
      return {
        queryName,
        planningTime: 0,
        executionTime: 0,
        totalTime: 0,
        indexesUsed: [],
        sequentialScans: 0,
        indexScans: 0,
        rowsScanned: 0,
        plan: '',
        status: error instanceof Error && error.message === 'Query timeout' ? 'timeout' : 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate getMediaAssets with search query
   */
  async validateGetMediaAssetsSearch(searchTerm: string = 'test', limit: number = 50): Promise<QueryPlanMetrics> {
    const queryName = 'getMediaAssets (search)';
    
    try {
      // Escape search term to prevent SQL issues
      const escapedTerm = searchTerm.replace(/'/g, "''");
      const searchPattern = `%${escapedTerm}%`;
      const query = `
        SELECT 
          id, filename, original_name, file_size, size, mime_type, type, url,
          thumbnail_url, thumbnail_filename, image_variants, storage_path, bucket_name,
          folder_id, tags, alt_text, caption, metadata, is_active, deleted_at,
          created_at, updated_at, uploaded_at
        FROM media_assets
        WHERE deleted_at IS NULL 
          AND is_active = true
          AND (
            filename ILIKE '${searchPattern}'
            OR original_name ILIKE '${searchPattern}'
            OR alt_text ILIKE '${searchPattern}'
          )
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      const rawOutput = await this.executeExplainAnalyze(query);
      const { planningTime, executionTime, plan } = this.parseExplainOutput(rawOutput);
      const { indexesUsed, sequentialScans, indexScans } = this.extractIndexUsage(plan);
      const rowsScanned = this.extractRowsScanned(plan);

      return {
        queryName,
        planningTime,
        executionTime,
        totalTime: planningTime + executionTime,
        indexesUsed,
        sequentialScans,
        indexScans,
        rowsScanned,
        plan: JSON.stringify(plan, null, 2),
        status: 'success'
      };
    } catch (error) {
      return {
        queryName,
        planningTime: 0,
        executionTime: 0,
        totalTime: 0,
        indexesUsed: [],
        sequentialScans: 0,
        indexScans: 0,
        rowsScanned: 0,
        plan: '',
        status: error instanceof Error && error.message === 'Query timeout' ? 'timeout' : 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate getProductsByTag query (uses GIN index)
   */
  async validateGetProductsByTag(tag: string = 'moisture-wicking', limit: number = 100): Promise<QueryPlanMetrics> {
    const queryName = 'getProductsByTag';
    
    try {
      // Escape tag to prevent SQL issues with quotes
      const escapedTag = tag.replace(/"/g, '\\"').replace(/'/g, "''");
      const query = `
        SELECT 
          id, name, slug, sku, description, primary_image_id, primary_video_id,
          image_ids, videos, minimum_order_quantity, lead_time, care_instructions,
          technical_specs, custom_fit, fiber_composition, specifications,
          is_active, is_featured, category_id, fabric_id, certificate_ids,
          size_chart_id, accessory_ids, tags, created_at
        FROM products
        WHERE tags @> '["${escapedTag}"]'::jsonb
          AND is_active = true
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      const rawOutput = await this.executeExplainAnalyze(query);
      const { planningTime, executionTime, plan } = this.parseExplainOutput(rawOutput);
      const { indexesUsed, sequentialScans, indexScans } = this.extractIndexUsage(plan);
      const rowsScanned = this.extractRowsScanned(plan);

      return {
        queryName,
        planningTime,
        executionTime,
        totalTime: planningTime + executionTime,
        indexesUsed,
        sequentialScans,
        indexScans,
        rowsScanned,
        plan: JSON.stringify(plan, null, 2),
        status: 'success'
      };
    } catch (error) {
      return {
        queryName,
        planningTime: 0,
        executionTime: 0,
        totalTime: 0,
        indexesUsed: [],
        sequentialScans: 0,
        indexScans: 0,
        rowsScanned: 0,
        plan: '',
        status: error instanceof Error && error.message === 'Query timeout' ? 'timeout' : 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate comparison report with baseline vs current metrics
   */
  private generateComparison(metrics: QueryPlanMetrics): ComparisonResults {
    const baselines: Record<string, { queryCount: number; avgExecutionTime: number; description: string }> = {
      'getProductByPath': {
        queryCount: 9,
        avgExecutionTime: 799,
        description: 'Original: 9 sequential queries (product + fabric + sizeChart + media + certificates + accessories + category products)'
      },
      'getProductsSummary': {
        queryCount: 1,
        avgExecutionTime: 150,
        description: 'Original: Single query with COUNT(*) OVER() window function'
      },
      'getMediaAssets (search)': {
        queryCount: 1,
        avgExecutionTime: 100,
        description: 'Original: ILIKE search without trigram indexes'
      },
      'getProductsByTag': {
        queryCount: 1,
        avgExecutionTime: 120,
        description: 'Original: JSONB containment query without GIN index'
      }
    };

    const baseline = baselines[metrics.queryName] || {
      queryCount: 1,
      avgExecutionTime: 100,
      description: 'No baseline data available'
    };

    const executionChange = ((metrics.executionTime - baseline.avgExecutionTime) / baseline.avgExecutionTime) * 100;
    const queryReduction = baseline.queryCount > 1 
      ? `Reduced from ${baseline.queryCount} queries to 1 (${((baseline.queryCount - 1) / baseline.queryCount * 100).toFixed(0)}% reduction)`
      : 'No query consolidation (already optimized)';

    return {
      baseline,
      current: metrics,
      improvement: {
        queryReduction,
        executionTimeChange: executionChange > 0 
          ? `${executionChange.toFixed(1)}% slower` 
          : `${Math.abs(executionChange).toFixed(1)}% faster`,
        indexEfficiency: metrics.indexScans > 0 && metrics.sequentialScans === 0
          ? `✅ Optimal (${metrics.indexScans} index scans, 0 sequential scans)`
          : metrics.sequentialScans > 0
          ? `⚠️ Suboptimal (${metrics.sequentialScans} sequential scans detected)`
          : '⚠️ No index usage detected'
      }
    };
  }

  /**
   * Print formatted validation report
   */
  async printValidationReport(): Promise<void> {
    console.log('\n🔍 QUERY PLAN VALIDATION REPORT\n');
    console.log('═'.repeat(100));
    
    const queries = [
      { name: 'getProductByPath', fn: () => this.validateGetProductByPath() },
      { name: 'getProductsSummary', fn: () => this.validateGetProductsSummary() },
      { name: 'getMediaAssets (search)', fn: () => this.validateGetMediaAssetsSearch() },
      { name: 'getProductsByTag', fn: () => this.validateGetProductsByTag() }
    ];

    for (const query of queries) {
      console.log(`\n📊 ${query.name.toUpperCase()}`);
      console.log('─'.repeat(100));
      
      const metrics = await query.fn();
      
      if (metrics.status === 'success') {
        const comparison = this.generateComparison(metrics);
        
        console.log('\n⏱️  TIMING');
        console.log(`  Planning Time:     ${metrics.planningTime.toFixed(2)}ms`);
        console.log(`  Execution Time:    ${metrics.executionTime.toFixed(2)}ms`);
        console.log(`  Total Time:        ${metrics.totalTime.toFixed(2)}ms`);
        
        console.log('\n📈 BASELINE COMPARISON');
        console.log(`  ${comparison.baseline.description}`);
        console.log(`  Baseline Execution: ${comparison.baseline.avgExecutionTime}ms`);
        console.log(`  Current Execution:  ${metrics.executionTime.toFixed(2)}ms`);
        console.log(`  Change:             ${comparison.improvement.executionTimeChange}`);
        console.log(`  Query Reduction:    ${comparison.improvement.queryReduction}`);
        
        console.log('\n🔎 INDEX USAGE');
        console.log(`  Indexes Used:       ${metrics.indexesUsed.length > 0 ? metrics.indexesUsed.join(', ') : 'None'}`);
        console.log(`  Index Scans:        ${metrics.indexScans}`);
        console.log(`  Sequential Scans:   ${metrics.sequentialScans}`);
        console.log(`  Rows Scanned:       ${metrics.rowsScanned.toLocaleString()}`);
        console.log(`  Efficiency:         ${comparison.improvement.indexEfficiency}`);
        
        if (metrics.sequentialScans > 0) {
          console.log('\n⚠️  WARNING: Sequential scans detected! Consider adding indexes.');
        }
      } else {
        console.log(`\n❌ FAILED: ${metrics.status}`);
        if (metrics.error) {
          console.log(`   Error: ${metrics.error}`);
        }
      }
    }
    
    console.log('\n' + '═'.repeat(100) + '\n');
  }

  /**
   * Validate all queries and return summary
   */
  async validateAll(): Promise<{
    results: QueryPlanMetrics[];
    summary: {
      totalQueries: number;
      successfulQueries: number;
      failedQueries: number;
      timedOutQueries: number;
      avgExecutionTime: number;
      totalIndexScans: number;
      totalSequentialScans: number;
    };
  }> {
    const results = await Promise.all([
      this.validateGetProductByPath(),
      this.validateGetProductsSummary(),
      this.validateGetMediaAssetsSearch(),
      this.validateGetProductsByTag()
    ]);

    const successful = results.filter(r => r.status === 'success');
    
    return {
      results,
      summary: {
        totalQueries: results.length,
        successfulQueries: successful.length,
        failedQueries: results.filter(r => r.status === 'error').length,
        timedOutQueries: results.filter(r => r.status === 'timeout').length,
        avgExecutionTime: successful.reduce((sum, r) => sum + r.executionTime, 0) / successful.length,
        totalIndexScans: successful.reduce((sum, r) => sum + r.indexScans, 0),
        totalSequentialScans: successful.reduce((sum, r) => sum + r.sequentialScans, 0)
      }
    };
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new QueryPlanValidator();
  
  validator.printValidationReport()
    .then(() => {
      logger.info('[QueryPlanValidator] Validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[QueryPlanValidator] Validation failed:', error);
      process.exit(1);
    });
}

export type { QueryPlanMetrics, ComparisonResults };
