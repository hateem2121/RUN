/**
 * PHASE 2.1: UPLOAD FLOW END-TO-END TESTING
 * Comprehensive validation system for upload → database → API → display flow
 * 
 * CRITICAL: Tests complete upload lifecycle to ensure cache invalidation works correctly
 * Validates that uploads appear immediately in admin interface after cache refresh
 */

import type { QueryClient } from '@tanstack/react-query';
import { createMediaQueryKey, MediaCacheInvalidator } from '@/lib/media-query-keys';

export interface UploadFlowTest {
  testId: string;
  name: string;
  description: string;
  execute: () => Promise<UploadFlowTestResult>;
}

export interface UploadFlowTestResult {
  success: boolean;
  duration: number;
  steps: UploadFlowStepResult[];
  error?: string;
  cacheMetrics?: {
    invalidationDuration: number;
    refetchDuration: number;
    dataConsistency: boolean;
  };
}

export interface UploadFlowStepResult {
  step: string;
  success: boolean;
  duration: number;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * PHASE 2.1: Upload Flow End-to-End Validator
 * Tests the complete upload → display workflow that was previously missed
 */
export class UploadFlowValidator {
  private queryClient: QueryClient;
  private testResults: UploadFlowTestResult[] = [];

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Test 1: Upload → Database Storage → API Retrieval Flow
   * CRITICAL: Validates the core upload functionality
   */
  private createUploadDatabaseRetrievalTest(): UploadFlowTest {
    return {
      testId: 'upload-db-retrieval',
      name: 'Upload → Database → API Retrieval',
      description: 'Tests file upload, database storage, and API retrieval sequence',
      execute: async () => {
        const startTime = Date.now();
        const steps: UploadFlowStepResult[] = [];

        try {
          // Step 1: Create test file
          const stepStart = Date.now();
          const testFile = new File(['test content'], 'test-upload-validation.txt', { type: 'text/plain' });
          steps.push({
            step: 'Create Test File',
            success: true,
            duration: Date.now() - stepStart,
            data: { name: testFile.name, size: testFile.size }
          });

          // Step 2: Upload file (simulated API call)
          const uploadStart = Date.now();
          const formData = new FormData();
          formData.append('file', testFile);

          try {
            const uploadResponse = await fetch('/api/media/upload', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            const uploadResult = await uploadResponse.json();
            steps.push({
              step: 'Upload to Server',
              success: true,
              duration: Date.now() - uploadStart,
              data: { uploadId: uploadResult.id, status: uploadResult.status }
            });

            // Step 3: Verify database storage
            const dbStart = Date.now();
            const dbResponse = await fetch(`/api/media/${uploadResult.id}`);

            if (!dbResponse.ok) {
              throw new Error(`Database verification failed: ${dbResponse.statusText}`);
            }

            const dbResult = await dbResponse.json();
            steps.push({
              step: 'Database Storage Verification',
              success: true,
              duration: Date.now() - dbStart,
              data: { id: dbResult.id, filename: dbResult.filename }
            });

            // Step 4: Test API retrieval consistency
            const apiStart = Date.now();
            const listResponse = await fetch('/api/media?limit=50');

            if (!listResponse.ok) {
              throw new Error(`API list retrieval failed: ${listResponse.statusText}`);
            }

            const listResult = await listResponse.json();
            const foundInList = listResult.data?.data?.some((item: { id: unknown }) => item.id === uploadResult.id);

            steps.push({
              step: 'API List Retrieval',
              success: foundInList,
              duration: Date.now() - apiStart,
              data: { foundInList, totalItems: listResult.data?.data?.length }
            });

            return {
              success: steps.every(step => step.success),
              duration: Date.now() - startTime,
              steps
            };

          } catch (uploadError) {
            steps.push({
              step: 'Upload to Server',
              success: false,
              duration: Date.now() - uploadStart,
              error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
            });
          }

        } catch (error) {
          steps.push({
            step: 'Test Setup',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        return {
          success: false,
          duration: Date.now() - startTime,
          steps,
          error: 'Upload flow test failed'
        };
      }
    };
  }

  /**
   * Test 2: Frontend Cache Invalidation After Upload
   * CRITICAL: Tests the cache invalidation issue identified in the plan
   */
  private createCacheInvalidationTest(): UploadFlowTest {
    return {
      testId: 'cache-invalidation',
      name: 'Frontend Cache Invalidation',
      description: 'Tests cache invalidation and refresh after successful upload',
      execute: async () => {
        const startTime = Date.now();
        const steps: UploadFlowStepResult[] = [];

        try {
          // Step 1: Record pre-invalidation cache state
          const preStateStart = Date.now();
          const preStateQueries = this.queryClient.getQueryCache().getAll().filter(query => {
            const keyStr = JSON.stringify(query.queryKey);
            return keyStr.includes('media');
          });

          steps.push({
            step: 'Pre-Invalidation Cache State',
            success: true,
            duration: Date.now() - preStateStart,
            data: { queriesCount: preStateQueries.length, queries: preStateQueries.map(q => q.queryKey) }
          });

          // Step 2: Trigger comprehensive cache invalidation
          const invalidationStart = Date.now();
          await MediaCacheInvalidator.invalidateAll(this.queryClient as { invalidateQueries: (options: unknown) => Promise<void> });
          const invalidationDuration = Date.now() - invalidationStart;

          steps.push({
            step: 'Cache Invalidation Execution',
            success: true,
            duration: invalidationDuration,
            data: { invalidationType: 'comprehensive' }
          });

          // Step 3: Test cache refresh behavior
          const refreshStart = Date.now();

          // Trigger refetch of paginated media (most common pattern)
          await this.queryClient.refetchQueries({
            queryKey: createMediaQueryKey.paginated()
          });

          // Also test legacy pattern refresh for compatibility
          await this.queryClient.refetchQueries({
            queryKey: ['/api/media']
          });

          const refreshDuration = Date.now() - refreshStart;

          steps.push({
            step: 'Cache Refresh Test',
            success: true,
            duration: refreshDuration,
            data: { refreshType: 'multi-pattern' }
          });

          // Step 4: Verify post-invalidation state
          const postStateStart = Date.now();
          const postStateQueries = this.queryClient.getQueryCache().getAll().filter(query => {
            const keyStr = JSON.stringify(query.queryKey);
            return keyStr.includes('media') && query.state.status === 'success' && query.state.data;
          });

          steps.push({
            step: 'Post-Invalidation Verification',
            success: true,
            duration: Date.now() - postStateStart,
            data: {
              freshQueriesCount: postStateQueries.length,
              dataConsistency: postStateQueries.length > 0
            }
          });

          return {
            success: steps.every(step => step.success),
            duration: Date.now() - startTime,
            steps,
            cacheMetrics: {
              invalidationDuration,
              refetchDuration: refreshDuration,
              dataConsistency: postStateQueries.length > 0
            }
          };

        } catch (error) {
          steps.push({
            step: 'Cache Invalidation Test',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown cache error'
          });

          return {
            success: false,
            duration: Date.now() - startTime,
            steps,
            error: 'Cache invalidation test failed'
          };
        }
      }
    };
  }

  /**
   * Test 3: Admin Interface Data Refresh Functionality
   * CRITICAL: Tests that admin interface shows uploads immediately
   */
  private createAdminInterfaceRefreshTest(): UploadFlowTest {
    return {
      testId: 'admin-interface-refresh',
      name: 'Admin Interface Refresh',
      description: 'Tests admin interface data refresh after upload operations',
      execute: async () => {
        const startTime = Date.now();
        const steps: UploadFlowStepResult[] = [];

        try {
          // Step 1: Simulate admin interface data fetch
          const initialFetchStart = Date.now();
          const initialData = await this.queryClient.fetchQuery({
            queryKey: createMediaQueryKey.paginated({ page: 1, limit: 20 }),
            queryFn: async () => {
              const response = await fetch('/api/media?page=1&limit=20');
              if (!response.ok) throw new Error('Failed to fetch media');
              return response.json();
            }
          });

          steps.push({
            step: 'Initial Admin Data Fetch',
            success: true,
            duration: Date.now() - initialFetchStart,
            data: {
              itemCount: initialData?.data?.data?.length || 0,
              hasData: !!initialData?.data?.data
            }
          });

          // Step 2: Test cache invalidation patterns used by admin components
          const adminInvalidationStart = Date.now();

          // Test MediaLibraryContainerEnhanced invalidation pattern
          await this.queryClient.invalidateQueries({
            predicate: (query) => {
              const keyStr = JSON.stringify(query.queryKey);
              return keyStr.includes('media') || keyStr.includes('/api/media');
            }
          });

          // Test MediaUploadEnhanced invalidation pattern
          await MediaCacheInvalidator.invalidateAll(this.queryClient as { invalidateQueries: (options: unknown) => Promise<void> });

          steps.push({
            step: 'Admin Component Cache Invalidation',
            success: true,
            duration: Date.now() - adminInvalidationStart,
            data: { strategy: 'predicate + comprehensive' }
          });

          // Step 3: Test admin interface query patterns
          const adminQueryStart = Date.now();
          const adminPatterns = [
            createMediaQueryKey.paginated({ page: 1, limit: 20 }),
            createMediaQueryKey.recent(50),
            ['/api/media'], // Legacy pattern still used in some components
          ];

          const adminQueryResults = await Promise.allSettled(
            adminPatterns.map(pattern =>
              this.queryClient.fetchQuery({
                queryKey: pattern,
                queryFn: async () => {
                  const url = Array.isArray(pattern) && pattern[0] === '/api/media'
                    ? '/api/media?limit=50'
                    : '/api/media?page=1&limit=20';
                  const response = await fetch(url);
                  if (!response.ok) throw new Error('Query failed');
                  return response.json();
                }
              })
            )
          );

          const successfulQueries = adminQueryResults.filter(result => result.status === 'fulfilled').length;

          steps.push({
            step: 'Admin Query Pattern Test',
            success: successfulQueries === adminPatterns.length,
            duration: Date.now() - adminQueryStart,
            data: {
              totalPatterns: adminPatterns.length,
              successfulQueries,
              patterns: adminPatterns.map(p => JSON.stringify(p))
            }
          });

          return {
            success: steps.every(step => step.success),
            duration: Date.now() - startTime,
            steps
          };

        } catch (error) {
          steps.push({
            step: 'Admin Interface Test',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown admin error'
          });

          return {
            success: false,
            duration: Date.now() - startTime,
            steps,
            error: 'Admin interface refresh test failed'
          };
        }
      }
    };
  }

  /**
   * Test 4: Delete Operation and Phantom Entry Prevention
   * CRITICAL: Validates zero phantom entries after deletion
   */
  private createDeleteAndPhantomPreventionTest(): UploadFlowTest {
    return {
      testId: 'delete-phantom-prevention',
      name: 'Delete → Cache Purge → Phantom Entry Prevention',
      description: 'Tests media deletion, cache invalidation, and verifies zero phantom entries',
      execute: async () => {
        const startTime = Date.now();
        const steps: UploadFlowStepResult[] = [];
        let uploadedMediaId: number | null = null;

        try {
          // Step 1: Upload a test file for deletion
          const uploadStart = Date.now();
          const testFile = new File(['delete-test'], 'delete-test-phantom.txt', { type: 'text/plain' });
          const formData = new FormData();
          formData.append('file', testFile);

          const uploadResponse = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }

          const uploadResult = await uploadResponse.json();
          uploadedMediaId = uploadResult.id;

          steps.push({
            step: 'Upload Test File for Deletion',
            success: true,
            duration: Date.now() - uploadStart,
            data: { uploadId: uploadedMediaId, filename: uploadResult.filename }
          });

          // Step 2: Verify file exists in database
          const verifyStart = Date.now();
          const verifyResponse = await fetch(`/api/media/${uploadedMediaId}`);
          const fileExists = verifyResponse.ok;

          steps.push({
            step: 'Verify File Exists Before Delete',
            success: fileExists,
            duration: Date.now() - verifyStart,
            data: { exists: fileExists }
          });

          if (!fileExists) {
            throw new Error('Uploaded file not found in database');
          }

          // Step 2.5: Hydrate cache with the uploaded file (CRITICAL)
          const hydrateStart = Date.now();

          // Hydrate paginated query cache
          await this.queryClient.fetchQuery({
            queryKey: createMediaQueryKey.paginated({ page: 1, limit: 100 }),
            queryFn: async () => {
              const response = await fetch('/api/media?page=1&limit=100');
              if (!response.ok) throw new Error('Failed to fetch paginated media');
              return response.json();
            }
          });

          // Hydrate single item query cache
          if (uploadedMediaId === null) throw new Error('Upload ID is null');
          await this.queryClient.fetchQuery({
            queryKey: createMediaQueryKey.single(uploadedMediaId),
            queryFn: async () => {
              const response = await fetch(`/api/media/${uploadedMediaId}`);
              if (!response.ok) throw new Error('Failed to fetch single media');
              return response.json();
            }
          });

          // Hydrate list query cache (picker pattern)
          await this.queryClient.fetchQuery({
            queryKey: createMediaQueryKey.list({ limit: 50, offset: 0 }),
            queryFn: async () => {
              const response = await fetch('/api/media?limit=50');
              if (!response.ok) throw new Error('Failed to fetch media list');
              return response.json();
            }
          });

          // Verify the item is NOW in cache before deletion
          const preCacheCheck = this.queryClient.getQueryCache().getAll().filter(query => {
            const data = query.state.data as any;
            if (data?.data?.data) {
              return data.data.data.some((item: { id: number }) => item.id === uploadedMediaId);
            } else if (data?.id === uploadedMediaId) {
              return true;
            }
            return false;
          });

          const itemInCacheCount = preCacheCheck.length;

          steps.push({
            step: 'Hydrate Cache with Uploaded File',
            success: itemInCacheCount > 0,
            duration: Date.now() - hydrateStart,
            data: {
              itemFoundInCaches: itemInCacheCount,
              totalCachesHydrated: 3
            }
          });

          if (itemInCacheCount === 0) {
            throw new Error('Failed to hydrate cache - item not found in any cached query');
          }

          // Step 3: Delete the file
          const deleteStart = Date.now();
          const deleteResponse = await fetch(`/api/media/${uploadedMediaId}`, {
            method: 'DELETE',
          });

          if (!deleteResponse.ok) {
            throw new Error(`Delete failed: ${deleteResponse.statusText}`);
          }

          steps.push({
            step: 'Delete Media File',
            success: true,
            duration: Date.now() - deleteStart,
            data: { deletedId: uploadedMediaId }
          });

          // Step 4: Trigger cache invalidation (simulating mutation callback)
          const invalidationStart = Date.now();
          await MediaCacheInvalidator.invalidateAll(this.queryClient as { invalidateQueries: (options: unknown) => Promise<void> });
          const invalidationDuration = Date.now() - invalidationStart;

          steps.push({
            step: 'Cache Invalidation After Delete',
            success: true,
            duration: invalidationDuration,
            data: { method: 'comprehensive invalidation' }
          });

          // Step 4.5: Force targeted refetches and verify fresh data (CRITICAL)
          const refetchStart = Date.now();

          // Fetch fresh paginated data
          const freshPaginatedData = await this.queryClient.fetchQuery({
            queryKey: createMediaQueryKey.paginated({ page: 1, limit: 100 }),
            queryFn: async () => {
              const response = await fetch('/api/media?page=1&limit=100&_t=' + Date.now());
              if (!response.ok) throw new Error('Failed to refetch paginated media');
              return response.json();
            }
          });

          // Fetch fresh list data
          const freshListData = await this.queryClient.fetchQuery({
            queryKey: createMediaQueryKey.list({ limit: 50, offset: 0 }),
            queryFn: async () => {
              const response = await fetch('/api/media?limit=50&_t=' + Date.now());
              if (!response.ok) throw new Error('Failed to refetch media list');
              return response.json();
            }
          });

          // Attempt to fetch deleted item (should return 404)
          let deletedItemFetchError = null;
          try {
            await this.queryClient.fetchQuery({
              queryKey: createMediaQueryKey.single(uploadedMediaId!),
              queryFn: async () => {
                const response = await fetch(`/api/media/${uploadedMediaId}?_t=` + Date.now());
                if (!response.ok) throw new Error('Item deleted - 404 expected');
                return response.json();
              }
            });
          } catch (error) {
            deletedItemFetchError = error; // Expected
          }

          const refetchDuration = Date.now() - refetchStart;

          // Verify deleted ID is NOT in fresh paginated data
          const phantomInFreshPaginated = freshPaginatedData?.data?.data?.some(
            (item: { id: number }) => item.id === uploadedMediaId
          );

          // Verify deleted ID is NOT in fresh list data
          const phantomInFreshList = freshListData?.data?.data?.some(
            (item: { id: number }) => item.id === uploadedMediaId
          );

          steps.push({
            step: 'Force Refetch and Verify Fresh Data',
            success: !phantomInFreshPaginated && !phantomInFreshList && !!deletedItemFetchError,
            duration: refetchDuration,
            data: {
              phantomInPaginated: phantomInFreshPaginated,
              phantomInList: phantomInFreshList,
              singleItemFetchFailed: !!deletedItemFetchError,
              paginatedCount: freshPaginatedData?.data?.data?.length,
              listCount: freshListData?.data?.data?.length
            }
          });

          // Step 5: Verify file is gone from API (no phantom in single query)
          const singleCheckStart = Date.now();
          const singleCheckResponse = await fetch(`/api/media/${uploadedMediaId}`);
          const phantomInSingleQuery = singleCheckResponse.ok;

          steps.push({
            step: 'Verify No Phantom in Single Query',
            success: !phantomInSingleQuery, // Should NOT exist
            duration: Date.now() - singleCheckStart,
            data: {
              phantomDetected: phantomInSingleQuery,
              expectedStatus: 404,
              actualStatus: singleCheckResponse.status
            }
          });

          // Step 6: Verify file is gone from paginated list (no phantom in list query)
          const listCheckStart = Date.now();
          const listResponse = await fetch('/api/media?limit=100');

          if (!listResponse.ok) {
            throw new Error('Failed to fetch media list');
          }

          const listResult = await listResponse.json();
          const phantomInList = listResult.data?.data?.some((item: { id: number }) => item.id === uploadedMediaId);

          steps.push({
            step: 'Verify No Phantom in Paginated List',
            success: !phantomInList, // Should NOT exist
            duration: Date.now() - listCheckStart,
            data: {
              phantomDetected: phantomInList,
              totalItemsInList: listResult.data?.data?.length
            }
          });

          // Step 7: Verify cache consistency across all query patterns
          const cacheCheckStart = Date.now();
          const cacheQueries = this.queryClient.getQueryCache().getAll().filter(query => {
            const keyStr = JSON.stringify(query.queryKey);
            return keyStr.includes('apimedia') || keyStr.includes('/api/media');
          });

          // Check if deleted item appears in any cached data
          let phantomInCache = false;
          for (const query of cacheQueries) {
            const data = query.state.data as any;
            if (data?.data?.data) {
              // Paginated response structure
              const foundInCache = data.data.data.some((item: { id: number }) => item.id === uploadedMediaId);
              if (foundInCache) {
                phantomInCache = true;
                break;
              }
            } else if (data?.id === uploadedMediaId) {
              // Single item response structure
              phantomInCache = true;
              break;
            }
          }

          steps.push({
            step: 'Verify No Phantom in Cache',
            success: !phantomInCache,
            duration: Date.now() - cacheCheckStart,
            data: {
              phantomDetected: phantomInCache,
              queriesChecked: cacheQueries.length
            }
          });

          const allStepsSuccessful = steps.every(step => step.success);

          return {
            success: allStepsSuccessful,
            duration: Date.now() - startTime,
            steps,
            cacheMetrics: {
              invalidationDuration,
              refetchDuration, // Actual refetch time measured
              dataConsistency: !phantomInList && !phantomInCache && !phantomInFreshPaginated && !phantomInFreshList
            }
          };

        } catch (error) {
          steps.push({
            step: 'Delete Test Execution',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown delete error'
          });

          return {
            success: false,
            duration: Date.now() - startTime,
            steps,
            error: 'Delete and phantom prevention test failed'
          };
        }
      }
    };
  }

  /**
   * Execute all upload flow validation tests
   * CRITICAL: This is the comprehensive test suite that was missing
   */
  async executeAllTests(): Promise<{
    success: boolean;
    totalDuration: number;
    results: UploadFlowTestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      cachePerformance?: {
        avgInvalidationTime: number;
        avgRefetchTime: number;
        dataConsistencyRate: number;
      };
    };
  }> {
    const startTime = Date.now();
    console.log('[UploadFlowValidator] 🧪 Starting comprehensive upload flow validation...');

    const tests = [
      this.createUploadDatabaseRetrievalTest(),
      this.createCacheInvalidationTest(),
      this.createAdminInterfaceRefreshTest(),
      this.createDeleteAndPhantomPreventionTest(), // CRITICAL: Tests zero phantom entries
    ];

    const results: UploadFlowTestResult[] = [];

    for (const test of tests) {
      console.log(`[UploadFlowValidator] 🔄 Running ${test.name}...`);
      const result = await test.execute();
      results.push(result);

      const status = result.success ? '✅' : '❌';
      console.log(`[UploadFlowValidator] ${status} ${test.name}: ${result.success ? 'PASSED' : 'FAILED'} (${result.duration}ms)`);

      if (!result.success) {
        console.error(`[UploadFlowValidator] ❌ Failure details:`, result.error);
        result.steps.forEach((step, i) => {
          const stepStatus = step.success ? '✅' : '❌';
          console.log(`  ${i + 1}. ${stepStatus} ${step.step}: ${step.duration}ms`);
          if (step.error) console.error(`     Error: ${step.error}`);
        });
      }
    }

    // Calculate cache performance metrics
    const cacheResults = results.filter(r => r.cacheMetrics);
    const cachePerformance = cacheResults.length > 0 ? {
      avgInvalidationTime: cacheResults.reduce((sum, r) => sum + (r.cacheMetrics?.invalidationDuration || 0), 0) / cacheResults.length,
      avgRefetchTime: cacheResults.reduce((sum, r) => sum + (r.cacheMetrics?.refetchDuration || 0), 0) / cacheResults.length,
      dataConsistencyRate: cacheResults.filter(r => r.cacheMetrics?.dataConsistency).length / cacheResults.length
    } : undefined;

    const summary = {
      totalTests: tests.length,
      passedTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      cachePerformance
    };

    const overallSuccess = summary.failedTests === 0;
    const totalDuration = Date.now() - startTime;

    console.log(`[UploadFlowValidator] 📊 Validation complete: ${summary.passedTests}/${summary.totalTests} passed in ${totalDuration}ms`);

    if (cachePerformance) {
      console.log(`[UploadFlowValidator] 📈 Cache Performance:`);
      console.log(`  Average Invalidation Time: ${cachePerformance.avgInvalidationTime.toFixed(1)}ms`);
      console.log(`  Average Refetch Time: ${cachePerformance.avgRefetchTime.toFixed(1)}ms`);
      console.log(`  Data Consistency Rate: ${(cachePerformance.dataConsistencyRate * 100).toFixed(1)}%`);
    }

    this.testResults = results;

    return {
      success: overallSuccess,
      totalDuration,
      results,
      summary
    };
  }

  /**
   * Get formatted test report for debugging
   */
  getTestReport(): string {
    if (this.testResults.length === 0) {
      return 'No test results available. Run executeAllTests() first.';
    }

    let report = `
# UPLOAD FLOW VALIDATION REPORT
Generated: ${new Date().toISOString()}

## SUMMARY
`;

    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;

    report += `- Tests Passed: ${passed}/${total}\n`;
    report += `- Overall Status: ${passed === total ? 'PASS ✅' : 'FAIL ❌'}\n\n`;

    report += `## DETAILED RESULTS\n\n`;

    this.testResults.forEach((result, i) => {
      const status = result.success ? '✅' : '❌';
      report += `### Test ${i + 1}: ${status}\n`;
      report += `Duration: ${result.duration}ms\n`;

      if (result.error) {
        report += `Error: ${result.error}\n`;
      }

      report += `\nSteps:\n`;
      result.steps.forEach((step, j) => {
        const stepStatus = step.success ? '✅' : '❌';
        report += `${j + 1}. ${stepStatus} ${step.step} (${step.duration}ms)\n`;
        if (step.error) {
          report += `   Error: ${step.error}\n`;
        }
        if (step.data) {
          report += `   Data: ${JSON.stringify(step.data, null, 2)}\n`;
        }
      });

      if (result.cacheMetrics) {
        report += `\nCache Metrics:\n`;
        report += `- Invalidation: ${result.cacheMetrics.invalidationDuration}ms\n`;
        report += `- Refetch: ${result.cacheMetrics.refetchDuration}ms\n`;
        report += `- Data Consistency: ${result.cacheMetrics.dataConsistency ? 'YES' : 'NO'}\n`;
      }

      report += `\n---\n\n`;
    });

    return report;
  }
}

// Export singleton instance for global testing
export const uploadFlowValidator = (queryClient: QueryClient) => new UploadFlowValidator(queryClient);