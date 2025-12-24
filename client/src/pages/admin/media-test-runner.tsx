/**
 * Media Cache Test Runner
 * Automated testing interface for verifying upload/delete cache synchronization
 */

import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, PlayCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type UploadFlowTestResult, UploadFlowValidator } from '@/lib/upload-flow-validator';

export default function MediaTestRunner() {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
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
  } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const validator = new UploadFlowValidator(queryClient);
      const testResults = await validator.executeAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('[TestRunner] Error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Media Cache Test Runner</h1>
        <p className="text-muted-foreground">
          Automated testing for upload/delete cache synchronization and DB/API/UI consistency
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run comprehensive tests to verify cache invalidation and data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runTests}
            disabled={isRunning}
            size="lg"
            className="w-full sm:w-auto"
            data-testid="button-run-tests"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          {/* Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Test Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold" data-testid="text-total-tests">
                    {results.summary.totalTests}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-green-500" data-testid="text-passed-tests">
                    {results.summary.passedTests}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-500" data-testid="text-failed-tests">
                    {results.summary.failedTests}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold" data-testid="text-duration">
                    {results.totalDuration}ms
                  </p>
                </div>
              </div>

              {results.summary.cachePerformance && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Cache Performance Metrics:</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Avg Invalidation</p>
                        <p className="font-mono">{results.summary.cachePerformance.avgInvalidationTime.toFixed(1)}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Refetch</p>
                        <p className="font-mono">{results.summary.cachePerformance.avgRefetchTime.toFixed(1)}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data Consistency</p>
                        <p className="font-mono">{(results.summary.cachePerformance.dataConsistencyRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {results.results.map((result, idx) => (
                    <Card key={idx} className={result.success ? 'border-green-200' : 'border-red-200'}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          Test {idx + 1}
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.duration}ms
                          </Badge>
                        </CardTitle>
                        {result.error && (
                          <p className="text-sm text-red-500 mt-1">{result.error}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {result.steps.map((step, stepIdx) => (
                            <div key={stepIdx} className="flex items-start gap-2 text-sm">
                              {step.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">
                                  {stepIdx + 1}. {step.step}
                                  <span className="text-muted-foreground ml-2">({step.duration}ms)</span>
                                </p>
                                {step.error && (
                                  <p className="text-red-500 mt-1">{step.error}</p>
                                )}
                                {step.data && (
                                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(step.data, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {result.cacheMetrics && (
                          <div className="mt-4 p-3 bg-muted rounded">
                            <p className="font-semibold text-sm mb-2">Cache Metrics:</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Invalidation</p>
                                <p className="font-mono">{result.cacheMetrics.invalidationDuration}ms</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Refetch</p>
                                <p className="font-mono">{result.cacheMetrics.refetchDuration}ms</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Consistency</p>
                                <p className="font-mono">{result.cacheMetrics.dataConsistency ? 'YES' : 'NO'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {!results && !isRunning && (
        <Alert>
          <AlertDescription>
            <p className="font-semibold mb-2">Test Coverage:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Upload → Database Storage → API Retrieval Flow</li>
              <li>Frontend Cache Invalidation After Upload</li>
              <li>Admin Interface Data Refresh Functionality</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
