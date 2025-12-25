// @ts-nocheck
/**
 * PHASE 2C: Integration Test Suite
 *
 * Validates all critical flows to ensure no regressions from performance optimizations
 */

import { logger } from "../lib/smart-logger";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class IntegrationTestSuite {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = "http://localhost:5000") {
    this.baseUrl = baseUrl;
  }

  /**
   * Execute HTTP request with timeout
   */
  private async request(
    path: string,
    options: RequestInit = {},
  ): Promise<{ status: number; data: any; duration: number }> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const duration = performance.now() - startTime;
      const contentType = response.headers.get("content-type");

      let data;
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return { status: response.status, data, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      throw new Error(
        `Request failed after ${duration.toFixed(0)}ms: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Test 1: Homepage Load
   */
  private async testHomepageLoad(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Test homepage batch endpoint (critical path)
      const batch = await this.request("/api/homepage/batch");

      if (batch.status !== 200) {
        throw new Error(`Expected 200, got ${batch.status}`);
      }

      // Validate response structure (batch returns {hero: {result: ...}, slogans: {result: ...}, ...})
      const requiredKeys = [
        "hero",
        "slogans",
        "sections",
        "featuredProductsSettings",
        "processCards",
      ];
      for (const key of requiredKeys) {
        if (!(key in batch.data)) {
          throw new Error(`Missing required key: ${key}`);
        }
      }

      // Test individual homepage endpoints
      const endpoints = [
        "/api/homepage/hero",
        "/api/homepage/slogans",
        "/api/homepage/process-cards",
      ];

      const endpointResults = await Promise.all(
        endpoints.map(async (endpoint) => {
          const res = await this.request(endpoint);
          return { endpoint, status: res.status, duration: res.duration };
        }),
      );

      const allPassed = endpointResults.every((r) => r.status === 200);
      const avgDuration =
        endpointResults.reduce((sum, r) => sum + r.duration, 0) / endpointResults.length;

      if (!allPassed) {
        throw new Error("Some homepage endpoints failed");
      }

      return {
        name: "Homepage Load",
        passed: true,
        duration: performance.now() - startTime,
        details: {
          batchResponse: batch.duration.toFixed(0) + "ms",
          endpoints: endpointResults.map((r) => `${r.endpoint}: ${r.duration.toFixed(0)}ms`),
          avgEndpointDuration: avgDuration.toFixed(0) + "ms",
        },
      };
    } catch (error) {
      return {
        name: "Homepage Load",
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test 2: Product Browsing
   */
  private async testProductBrowsing(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Test products list endpoint
      const products = await this.request("/api/products");

      if (products.status !== 200) {
        throw new Error(`Products endpoint failed: ${products.status}`);
      }

      if (!products.data.data || !Array.isArray(products.data.data)) {
        throw new Error("Products response missing data array");
      }

      // Test categories endpoint
      const categories = await this.request("/api/categories");

      if (categories.status !== 200) {
        throw new Error(`Categories endpoint failed: ${categories.status}`);
      }

      // Categories returns a direct array
      if (!Array.isArray(categories.data)) {
        throw new Error("Categories response not an array");
      }

      // Test product detail (if products exist)
      let productDetailDuration = 0;
      if (products.data.data.length > 0) {
        const firstProduct = products.data.data[0];
        const detail = await this.request(`/api/products/${firstProduct.id}`);
        productDetailDuration = detail.duration;

        if (detail.status !== 200) {
          throw new Error(`Product detail failed: ${detail.status}`);
        }
      }

      return {
        name: "Product Browsing",
        passed: true,
        duration: performance.now() - startTime,
        details: {
          productsCount: products.data.data.length,
          productsResponseTime: products.duration.toFixed(0) + "ms",
          categoriesCount: categories.data.length,
          categoriesResponseTime: categories.duration.toFixed(0) + "ms",
          productDetailResponseTime: productDetailDuration
            ? productDetailDuration.toFixed(0) + "ms"
            : "N/A",
        },
      };
    } catch (error) {
      return {
        name: "Product Browsing",
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test 3: Media Operations
   */
  private async testMediaOperations(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Test media list endpoint
      const media = await this.request("/api/media");

      if (media.status !== 200) {
        throw new Error(`Media endpoint failed: ${media.status}`);
      }

      if (!media.data.success || !Array.isArray(media.data.data)) {
        throw new Error("Media response invalid structure");
      }

      // Test media content retrieval (if media exists)
      let contentTestPassed = true;
      let contentDuration = 0;

      if (media.data.data.length > 0) {
        const firstMedia = media.data.data[0];
        const content = await this.request(`/api/media/${firstMedia.id}/content`);
        contentDuration = content.duration;
        contentTestPassed = content.status === 200;
      }

      return {
        name: "Media Operations",
        passed: true,
        duration: performance.now() - startTime,
        details: {
          mediaCount: media.data.data.length,
          mediaListResponseTime: media.duration.toFixed(0) + "ms",
          contentRetrievalTest: contentTestPassed ? "Passed" : "Failed",
          contentResponseTime: contentDuration ? contentDuration.toFixed(0) + "ms" : "N/A",
        },
      };
    } catch (error) {
      return {
        name: "Media Operations",
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test 4: Cache Performance
   */
  private async testCachePerformance(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Get cache metrics
      const metrics = await this.request("/api/metrics/cache");

      if (metrics.status !== 200) {
        throw new Error(`Cache metrics endpoint failed: ${metrics.status}`);
      }

      const { metrics: cacheMetrics, healthScore, status: cacheStatus } = metrics.data;

      // Validate cache is healthy
      if (healthScore < 50) {
        throw new Error(`Cache health score too low: ${healthScore}`);
      }

      // Test cache hit rate
      if (cacheMetrics.hitRate < 50) {
        throw new Error(`Cache hit rate too low: ${cacheMetrics.hitRate}%`);
      }

      return {
        name: "Cache Performance",
        passed: true,
        duration: performance.now() - startTime,
        details: {
          hitRate: cacheMetrics.hitRate.toFixed(1) + "%",
          healthScore: healthScore,
          status: cacheStatus,
          totalHits: cacheMetrics.totalHits,
          totalMisses: cacheMetrics.totalMisses,
          avgResponseTime: cacheMetrics.avgResponseTime.toFixed(0) + "ms",
        },
      };
    } catch (error) {
      return {
        name: "Cache Performance",
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test 5: Database Performance
   */
  private async testDatabasePerformance(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Get database metrics
      const metrics = await this.request("/api/metrics/database");

      if (metrics.status !== 200) {
        throw new Error(`Database metrics endpoint failed: ${metrics.status}`);
      }

      const { healthy, legacy } = metrics.data;

      // Validate database is healthy
      if (!healthy) {
        throw new Error("Database reported as unhealthy");
      }

      // Check average response time
      if (legacy.avgResponseTime > 1000) {
        throw new Error(`Database avg response time too high: ${legacy.avgResponseTime}ms`);
      }

      return {
        name: "Database Performance",
        passed: true,
        duration: performance.now() - startTime,
        details: {
          healthy: healthy,
          avgResponseTime: legacy.avgResponseTime.toFixed(0) + "ms",
          totalQueries: legacy.totalQueries,
          slowQueries: legacy.slowQueries,
        },
      };
    } catch (error) {
      return {
        name: "Database Performance",
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test 6: System Health
   */
  private async testSystemHealth(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Get overall system metrics
      const metrics = await this.request("/api/metrics");

      if (metrics.status !== 200) {
        throw new Error(`Metrics endpoint failed: ${metrics.status}`);
      }

      const { health } = metrics.data;

      // Validate overall health
      if (health.overall < 60) {
        throw new Error(`System health too low: ${health.overall}`);
      }

      // Check individual components
      const issues = [];
      if (!health.cache.healthy) issues.push("cache");
      if (!health.database.healthy) issues.push("database");
      if (!health.http.healthy) issues.push("http");
      if (!health.system.healthy) issues.push("system");

      if (issues.length > 0) {
        throw new Error(`Unhealthy components: ${issues.join(", ")}`);
      }

      return {
        name: "System Health",
        passed: true,
        duration: performance.now() - startTime,
        details: {
          overallHealth: health.overall,
          status: health.status,
          cacheHealth: health.cache.score,
          databaseAvgResponseTime: health.database.avgResponseTime.toFixed(0) + "ms",
          httpAvgLatency: health.http.avgLatency.toFixed(0) + "ms",
          memoryUsage: health.system.memoryUsage + "%",
        },
      };
    } catch (error) {
      return {
        name: "System Health",
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    logger.info("\n" + "=".repeat(70));
    logger.info("🧪 PHASE 2C: INTEGRATION TEST SUITE");
    logger.info("=".repeat(70));
    logger.info("Testing critical flows for regressions...\n");

    const tests = [
      () => this.testHomepageLoad(),
      () => this.testProductBrowsing(),
      () => this.testMediaOperations(),
      () => this.testCachePerformance(),
      () => this.testDatabasePerformance(),
      () => this.testSystemHealth(),
    ];

    for (const test of tests) {
      const result = await test();
      this.results.push(result);
      this.logResult(result);
    }

    this.printSummary();
  }

  /**
   * Log individual test result
   */
  private logResult(result: TestResult): void {
    const icon = result.passed ? "✅" : "❌";
    const status = result.passed ? "PASS" : "FAIL";

    logger.info(`${icon} ${result.name}: ${status} (${result.duration.toFixed(0)}ms)`);

    if (result.passed && result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        logger.info(`   - ${key}: ${value}`);
      });
    }

    if (!result.passed && result.error) {
      logger.info(`   ❌ Error: ${result.error}`);
    }

    logger.info("");
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    logger.info("=".repeat(70));
    logger.info("📊 TEST SUMMARY");
    logger.info("=".repeat(70));
    logger.info(`Total Tests:     ${total}`);
    logger.info(`Passed:          ${passed} ✅`);
    logger.info(`Failed:          ${failed} ${failed > 0 ? "❌" : ""}`);
    logger.info(`Success Rate:    ${((passed / total) * 100).toFixed(1)}%`);
    logger.info(`Total Duration:  ${totalDuration.toFixed(0)}ms`);
    logger.info("");

    if (failed > 0) {
      logger.info("❌ FAILED TESTS:");
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          logger.info(`   - ${r.name}: ${r.error}`);
        });
      logger.info("");
    }

    const verdict =
      failed === 0
        ? "✅ ALL TESTS PASSED - No regressions detected"
        : `⚠️  ${failed} TEST(S) FAILED - Review required`;

    logger.info(verdict);
    logger.info("=".repeat(70) + "\n");
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new IntegrationTestSuite();
  await suite.runAll();

  // Exit with appropriate code
  const hasFailures = suite["results"].some((r) => !r.passed);
  process.exit(hasFailures ? 1 : 0);
}

export { IntegrationTestSuite };
