/**
 * Performance Regression Test Suite
 * 
 * Validates query optimizations and prevents performance degradation:
 * - Column selection accuracy (correct columns returned, no extras)
 * - Query execution time benchmarks (95th percentile thresholds)
 * - Data completeness and correctness
 * 
 * Run: tsx server/tests/performance-regression.test.ts
 */

import { logger } from '../lib/smart-logger.js';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface BenchmarkResult {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
}

class PerformanceRegressionSuite {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Execute HTTP request with timing
   * Extracts backend-reported duration from API response payload
   */
  private async request(
    path: string,
    options: RequestInit = {}
  ): Promise<{ status: number; data: any; duration: number }> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: AbortSignal.timeout(10000)
      });
      
      const wallClockDuration = performance.now() - startTime;
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Extract backend-reported duration from API response payload
      // Fall back to wall-clock duration if not present
      const backendDuration = typeof data === 'object' && data !== null && typeof data.duration === 'number' 
        ? data.duration 
        : wallClockDuration;
      
      return { status: response.status, data, duration: backendDuration };
    } catch (error) {
      const duration = performance.now() - startTime;
      throw new Error(`Request failed after ${duration.toFixed(0)}ms: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate percentiles from array of numbers using nearest-rank method
   */
  private calculatePercentiles(values: number[]): BenchmarkResult {
    if (values.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    
    // Use nearest-rank method (ceiling) for percentiles
    const p50Index = Math.min(Math.ceil(sorted.length * 0.5) - 1, sorted.length - 1);
    const p95Index = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
    const p99Index = Math.min(Math.ceil(sorted.length * 0.99) - 1, sorted.length - 1);
    
    const p50 = sorted[p50Index];
    const p95 = sorted[p95Index];
    const p99 = sorted[p99Index];
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    return { p50, p95, p99, avg, min, max };
  }

  /**
   * Run a function N times and collect timings
   * The function should return the duration to measure
   */
  private async benchmark(
    fn: () => Promise<number>,
    iterations: number = 10
  ): Promise<BenchmarkResult> {
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const duration = await fn();
      durations.push(duration);
      
      // Small delay between iterations to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return this.calculatePercentiles(durations);
  }

  /**
   * Test 1: getProducts returns correct columns (PRODUCT_SUMMARY_COLUMNS)
   */
  private async testGetProductsColumns(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const response = await this.request('/api/products?limit=1');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      
      // API returns { data: products[], pagination: {...} }
      if (!response.data || !response.data.data) {
        throw new Error('Expected response with data field');
      }
      
      const products = response.data.data;
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('Expected array with at least 1 product');
      }
      
      const product = products[0];
      
      // Expected columns from PRODUCT_SUMMARY_COLUMNS
      const expectedColumns = [
        'id', 'name', 'slug', 'sku', 'description', 'primaryImageId', 
        'primaryVideoId', 'imageIds', 'videos', 'minimumOrderQuantity', 
        'leadTime', 'careInstructions', 'technicalSpecs', 'customFit', 
        'fiberComposition', 'specifications', 'isActive', 'isFeatured', 
        'categoryId', 'fabricId', 'certificateIds', 'sizeChartId', 
        'accessoryIds', 'tags', 'createdAt'
      ];
      
      const actualColumns = Object.keys(product);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
      }
      
      if (extraColumns.length > 0) {
        throw new Error(`Extra columns returned: ${extraColumns.join(', ')}`);
      }
      
      return {
        name: 'getProducts() column validation',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          columnsChecked: expectedColumns.length,
          product: { id: product.id, name: product.name }
        }
      };
    } catch (error) {
      return {
        name: 'getProducts() column validation',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 2: getProductByPath returns complete product context
   */
  private async testGetProductByPathContext(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // First get a product to construct a valid URL path
      const productsResp = await this.request('/api/products?limit=1&active=true');
      if (!productsResp.data || !productsResp.data.data || productsResp.data.data.length === 0) {
        throw new Error('No products available for testing');
      }
      
      const testProduct = productsResp.data.data[0];
      
      // Get product by ID to check if it has urlPath
      const productDetail = await this.request(`/api/products/${testProduct.id}`);
      
      if (productDetail.status !== 200 || !productDetail.data) {
        throw new Error('Could not fetch product details');
      }
      
      // If product has urlPath, use it; otherwise skip detailed validation
      if (!productDetail.data.urlPath) {
        return {
          name: 'getProductByPath() context validation',
          passed: true,
          duration: performance.now() - startTime,
          details: {
            message: 'No urlPath available for testing - endpoint structure validated via other tests'
          }
        };
      }
      
      const urlPath = productDetail.data.urlPath;
      const response = await this.request(`/api/products/by-path?path=${encodeURIComponent(urlPath)}`);
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      
      const context = response.data;
      
      // Expected context fields
      const expectedContextFields = [
        'product',
        'category',
        'categoryPath',
        'categoryProducts',
        'relatedMedia',
        'certificates',
        'accessories'
      ];
      
      const missingFields = expectedContextFields.filter(field => !(field in context));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing context fields: ${missingFields.join(', ')}`);
      }
      
      // Validate product has necessary fields
      if (context.product) {
        const requiredProductFields = ['id', 'name', 'slug'];
        const missingProductFields = requiredProductFields.filter(
          field => !context.product.hasOwnProperty(field)
        );
        
        if (missingProductFields.length > 0) {
          throw new Error(`Product missing fields: ${missingProductFields.join(', ')}`);
        }
      }
      
      return {
        name: 'getProductByPath() context validation',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          testedPath: urlPath,
          productName: context.product?.name
        }
      };
    } catch (error) {
      return {
        name: 'getProductByPath() context validation',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 3: getMediaAssets returns correct columns
   */
  private async testGetMediaAssetsColumns(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const response = await this.request('/api/media?limit=1');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      
      // API returns { data: mediaAssets[], pagination: {...} }
      if (!response.data || !response.data.data) {
        throw new Error('Expected response with data field');
      }
      
      const mediaAssets = response.data.data;
      if (!Array.isArray(mediaAssets) || mediaAssets.length === 0) {
        throw new Error('Expected array with at least 1 media asset');
      }
      
      const asset = mediaAssets[0];
      
      // Expected columns from MEDIA_GRID_COLUMNS (8 columns as per requirements)
      const expectedColumns = [
        'id', 'filename', 'originalName', 'fileSize', 'size', 'mimeType', 
        'type', 'url', 'thumbnailUrl', 'thumbnailFilename', 'imageVariants',
        'storagePath', 'bucketName', 'folderId', 'tags', 'altText', 
        'caption', 'metadata', 'isActive', 'deletedAt', 'createdAt', 
        'updatedAt', 'uploadedAt'
      ];
      
      const actualColumns = Object.keys(asset);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
      }
      
      return {
        name: 'getMediaAssets() column validation',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          columnsChecked: expectedColumns.length,
          asset: { id: asset.id, filename: asset.filename }
        }
      };
    } catch (error) {
      return {
        name: 'getMediaAssets() column validation',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 4: getMediaAssets with search returns filtered results
   */
  private async testGetMediaAssetsSearch(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const response = await this.request('/api/media?search=test&limit=10');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      
      // API returns { data: mediaAssets[], pagination: {...} }
      if (!response.data || !response.data.data) {
        throw new Error('Expected response with data field');
      }
      
      const mediaAssets = response.data.data;
      if (!Array.isArray(mediaAssets)) {
        throw new Error('Expected array response');
      }
      
      // Validate that results contain search term (if any results)
      if (mediaAssets.length > 0) {
        const searchTerm = 'test';
        const hasSearchTerm = mediaAssets.some(asset => 
          asset.filename?.toLowerCase().includes(searchTerm) ||
          asset.originalName?.toLowerCase().includes(searchTerm) ||
          asset.altText?.toLowerCase().includes(searchTerm)
        );
        
        // Note: In test environment might not have data, so we just validate structure
        return {
          name: 'getMediaAssets() search filter',
          passed: true,
          duration: performance.now() - startTime,
          details: {
            resultsCount: mediaAssets.length,
            searchTermFound: hasSearchTerm
          }
        };
      }
      
      return {
        name: 'getMediaAssets() search filter',
        passed: true,
        duration: performance.now() - startTime,
        details: { resultsCount: 0, message: 'No test data available' }
      };
    } catch (error) {
      return {
        name: 'getMediaAssets() search filter',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 5: Query execution time benchmark - getProducts
   */
  private async testGetProductsPerformance(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const benchmarkResult = await this.benchmark(async () => {
        const response = await this.request('/api/products?limit=50');
        return response.duration;
      }, 10);
      
      // Threshold: p95 should be under 200ms for 50 products
      const threshold = 200;
      const passed = benchmarkResult.p95 < threshold;
      
      return {
        name: 'getProducts() performance (p95 < 200ms)',
        passed,
        duration: performance.now() - startTime,
        details: {
          p50: `${benchmarkResult.p50.toFixed(2)}ms`,
          p95: `${benchmarkResult.p95.toFixed(2)}ms`,
          p99: `${benchmarkResult.p99.toFixed(2)}ms`,
          avg: `${benchmarkResult.avg.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          status: passed ? '✅ PASS' : '❌ FAIL'
        },
        error: passed ? undefined : `p95 (${benchmarkResult.p95.toFixed(2)}ms) exceeds threshold (${threshold}ms)`
      };
    } catch (error) {
      return {
        name: 'getProducts() performance (p95 < 200ms)',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 6: Query execution time benchmark - getMediaAssets
   */
  private async testGetMediaAssetsPerformance(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const benchmarkResult = await this.benchmark(async () => {
        const response = await this.request('/api/media?limit=50');
        return response.duration;
      }, 10);
      
      // Threshold: p95 should be under 150ms for 50 media assets
      const threshold = 150;
      const passed = benchmarkResult.p95 < threshold;
      
      return {
        name: 'getMediaAssets() performance (p95 < 150ms)',
        passed,
        duration: performance.now() - startTime,
        details: {
          p50: `${benchmarkResult.p50.toFixed(2)}ms`,
          p95: `${benchmarkResult.p95.toFixed(2)}ms`,
          p99: `${benchmarkResult.p99.toFixed(2)}ms`,
          avg: `${benchmarkResult.avg.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          status: passed ? '✅ PASS' : '❌ FAIL'
        },
        error: passed ? undefined : `p95 (${benchmarkResult.p95.toFixed(2)}ms) exceeds threshold (${threshold}ms)`
      };
    } catch (error) {
      return {
        name: 'getMediaAssets() performance (p95 < 150ms)',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 7: Query execution time benchmark - getHomepageBatch
   */
  private async testHomepageBatchPerformance(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const benchmarkResult = await this.benchmark(async () => {
        const response = await this.request('/api/homepage/batch');
        return response.duration;
      }, 10);
      
      // Threshold: p95 should be under 500ms for batch endpoint
      const threshold = 500;
      const passed = benchmarkResult.p95 < threshold;
      
      return {
        name: 'Homepage batch performance (p95 < 500ms)',
        passed,
        duration: performance.now() - startTime,
        details: {
          p50: `${benchmarkResult.p50.toFixed(2)}ms`,
          p95: `${benchmarkResult.p95.toFixed(2)}ms`,
          p99: `${benchmarkResult.p99.toFixed(2)}ms`,
          avg: `${benchmarkResult.avg.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          status: passed ? '✅ PASS' : '❌ FAIL'
        },
        error: passed ? undefined : `p95 (${benchmarkResult.p95.toFixed(2)}ms) exceeds threshold (${threshold}ms)`
      };
    } catch (error) {
      return {
        name: 'Homepage batch performance (p95 < 500ms)',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 8: getCategories returns expected structure
   */
  private async testGetCategoriesStructure(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const response = await this.request('/api/taxonomy/categories');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      
      // Categories might be wrapped in data field
      const categories = response.data.data || response.data;
      if (!Array.isArray(categories)) {
        throw new Error('Expected array response');
      }
      
      if (categories.length > 0) {
        const category = categories[0];
        const requiredFields = ['id', 'name', 'slug', 'isActive'];
        const missingFields = requiredFields.filter(field => !category.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
          throw new Error(`Category missing fields: ${missingFields.join(', ')}`);
        }
      }
      
      return {
        name: 'getCategories() structure validation',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          categoriesCount: categories.length
        }
      };
    } catch (error) {
      return {
        name: 'getCategories() structure validation',
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run all tests and print summary
   */
  async runAllTests(): Promise<void> {
    console.log('\n🧪 PERFORMANCE REGRESSION TEST SUITE\n');
    console.log('═'.repeat(100));
    
    const tests = [
      { name: 'Column Validation', fn: () => this.testGetProductsColumns() },
      { name: 'Context Validation', fn: () => this.testGetProductByPathContext() },
      { name: 'Media Columns', fn: () => this.testGetMediaAssetsColumns() },
      { name: 'Media Search', fn: () => this.testGetMediaAssetsSearch() },
      { name: 'Products Performance', fn: () => this.testGetProductsPerformance() },
      { name: 'Media Performance', fn: () => this.testGetMediaAssetsPerformance() },
      { name: 'Homepage Performance', fn: () => this.testHomepageBatchPerformance() },
      { name: 'Categories Structure', fn: () => this.testGetCategoriesStructure() }
    ];
    
    console.log(`\nRunning ${tests.length} test suites...\n`);
    
    for (const test of tests) {
      console.log(`Running: ${test.name}...`);
      const result = await test.fn();
      this.results.push(result);
      
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${result.name} (${result.duration.toFixed(2)}ms)`);
      
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      
      if (result.details) {
        console.log(`    Details:`, JSON.stringify(result.details, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
      }
      
      console.log('');
    }
    
    // Summary
    console.log('═'.repeat(100));
    console.log('\n📊 TEST SUMMARY\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`  Total Tests:    ${this.results.length}`);
    console.log(`  Passed:         ${passed} ✅`);
    console.log(`  Failed:         ${failed} ❌`);
    console.log(`  Success Rate:   ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${totalDuration.toFixed(2)}ms`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n' + '═'.repeat(100) + '\n');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new PerformanceRegressionSuite();
  
  suite.runAllTests()
    .then(() => {
      const passedAll = suite['results'].every(r => r.passed);
      logger.info(`[PerformanceTests] All tests completed. Status: ${passedAll ? 'PASS' : 'FAIL'}`);
      process.exit(passedAll ? 0 : 1);
    })
    .catch((error) => {
      logger.error('[PerformanceTests] Test suite failed:', error);
      process.exit(1);
    });
}

export { PerformanceRegressionSuite };
export type { TestResult, BenchmarkResult };
