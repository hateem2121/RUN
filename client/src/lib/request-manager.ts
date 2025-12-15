/**
 * FORENSIC INVESTIGATION - Phase 4: Frontend Request Manager
 * Manages fetch requests with abort capability to prevent connection exhaustion
 */

interface RequestOptions extends Omit<RequestInit, "priority"> {
  priority?: "high" | "low" | "auto";
  timeout?: number;
}

class FrontendRequestManager {
  private activeRequests = new Map<string, AbortController>();
  private requestCounts = {
    active: 0,
    completed: 0,
    aborted: 0,
    failed: 0,
  };

  /**
   * Make a fetch request with automatic abort management
   */
  async fetch(url: string, options: RequestOptions = {}): Promise<Response> {
    const { priority = "auto", timeout = 30000, signal: externalSignal, ...fetchOptions } = options;

    // Create AbortController for this request
    const controller = new AbortController();
    const requestKey = `${options.method || "GET"}:${url}`;

    // Store controller for potential cancellation
    this.activeRequests.set(requestKey, controller);
    this.requestCounts.active++;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.requestCounts.aborted++;
    }, timeout);

    // Listen to external abort signal if provided
    if (externalSignal) {
      externalSignal.addEventListener("abort", () => {
        controller.abort();
        this.requestCounts.aborted++;
      });
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.activeRequests.delete(requestKey);
      this.requestCounts.active--;
      this.requestCounts.completed++;

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestKey);
      this.requestCounts.active--;

      if (error instanceof Error && error.name === "AbortError") {
        this.requestCounts.aborted++;
      } else {
        this.requestCounts.failed++;
      }

      throw error;
    }
  }

  /**
   * Cancel all active requests (e.g., on navigation)
   */
  cancelAll() {
    for (const [key, controller] of this.activeRequests.entries()) {
      controller.abort();
      console.log(`[RequestManager] Cancelled request: ${key}`);
    }
    this.activeRequests.clear();
    this.requestCounts.active = 0;
  }

  /**
   * Cancel requests matching a pattern
   */
  cancel(pattern: string | RegExp) {
    const keysToCancel: string[] = [];

    for (const key of this.activeRequests.keys()) {
      const matches = typeof pattern === "string" ? key.includes(pattern) : pattern.test(key);

      if (matches) {
        keysToCancel.push(key);
      }
    }

    for (const key of keysToCancel) {
      const controller = this.activeRequests.get(key);
      controller?.abort();
      this.activeRequests.delete(key);
      this.requestCounts.active--;
      console.log(`[RequestManager] Cancelled request: ${key}`);
    }
  }

  /**
   * Get request statistics
   */
  getStats() {
    return {
      ...this.requestCounts,
      activeRequests: Array.from(this.activeRequests.keys()),
    };
  }

  /**
   * Check if request manager is healthy
   */
  isHealthy() {
    const tooManyActive = this.requestCounts.active > 20;
    const highFailureRate =
      this.requestCounts.failed / (this.requestCounts.completed + this.requestCounts.failed || 1) >
      0.2;

    return !tooManyActive && !highFailureRate;
  }
}

// Export singleton instance
export const requestManager = new FrontendRequestManager();

// Auto-cancel on navigation
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    requestManager.cancelAll();
  });

  // Cancel on React Router navigation (if using)
  window.addEventListener("popstate", () => {
    requestManager.cancelAll();
  });
}
