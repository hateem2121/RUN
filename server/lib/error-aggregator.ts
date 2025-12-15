// Error Aggregation System - Phase 3 Observability
// Collects, aggregates, and exposes error metrics for monitoring

interface ErrorEntry {
  id: string;
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'rate_limit' | 'internal' | 'database' | 'external_service';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  path: string;
  method: string;
  ip?: string;
  userAgent?: string;
  stack?: string;
}

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByPath: Record<string, number>;
  recentErrors: ErrorEntry[];
  errorRate: {
    last5Min: number;
    last15Min: number;
    last1Hour: number;
  };
  topErrors: Array<{
    path: string;
    count: number;
    lastOccurred: string;
  }>;
}

class ErrorAggregator {
  private errors: ErrorEntry[] = [];
  private readonly maxErrors = 500; // Keep last 500 errors

  /**
   * Record an error for aggregation
   */
  recordError(error: ErrorEntry): void {
    // Add to circular buffer
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest
    }
  }

  /**
   * Get aggregated error metrics
   */
  getMetrics(): ErrorMetrics {
    const now = Date.now();
    const fiveMinAgo = now - 5 * 60 * 1000;
    const fifteenMinAgo = now - 15 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Count errors by type and severity
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByPath: Record<string, number> = {};

    let last5Min = 0;
    let last15Min = 0;
    let last1Hour = 0;

    for (const err of this.errors) {
      const timestamp = new Date(err.timestamp).getTime();

      // Count by type
      errorsByType[err.type] = (errorsByType[err.type] || 0) + 1;

      // Count by severity
      errorsBySeverity[err.severity] = (errorsBySeverity[err.severity] || 0) + 1;

      // Count by path
      const pathKey = `${err.method} ${err.path}`;
      errorsByPath[pathKey] = (errorsByPath[pathKey] || 0) + 1;

      // Time window counts
      if (timestamp >= fiveMinAgo) last5Min++;
      if (timestamp >= fifteenMinAgo) last15Min++;
      if (timestamp >= oneHourAgo) last1Hour++;
    }

    // Compute top 10 error paths from current buffer (not stale counts)
    const pathCounts = new Map<string, number>();
    for (const err of this.errors) {
      const pathKey = `${err.method} ${err.path}`;
      pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);
    }

    const topErrors = Array.from(pathCounts.entries())
      .map(([path, count]) => {
        // Find most recent error for this path
        const recentError = [...this.errors]
          .reverse()
          .find(e => `${e.method} ${e.path}` === path);
        return {
          path,
          count,
          lastOccurred: recentError?.timestamp || new Date().toISOString()
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get last 50 errors for dashboard display
    const recentErrors = this.errors.slice(-50).reverse();

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsBySeverity,
      errorsByPath,
      recentErrors,
      errorRate: {
        last5Min,
        last15Min,
        last1Hour
      },
      topErrors
    };
  }

  /**
   * Clear all aggregated errors (for testing or reset)
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get errors filtered by criteria
   */
  getErrorsFiltered(filters: {
    type?: string;
    severity?: string;
    since?: Date;
    limit?: number;
  }): ErrorEntry[] {
    let filtered = [...this.errors];

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters.since) {
      const sinceTime = filters.since.getTime();
      filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= sinceTime);
    }

    // Reverse to show newest first
    filtered.reverse();

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }
}

// Singleton instance
export const errorAggregator = new ErrorAggregator();
