const ERROR_QUEUE_KEY = "__run_error_queue__";
const MAX_QUEUE_SIZE = 100;

interface ClientError {
  message: string;
  stack?: string;
  componentStack?: string;
  level: "error" | "warn" | "info";
  context?: Record<string, unknown>;
}

interface QueuedError extends ClientError {
  url: string;
  userAgent: string;
  timestamp: string;
  retryCount: number;
}

/**
 * Get queued errors from localStorage
 */
function getErrorQueue(): QueuedError[] {
  try {
    const stored = localStorage.getItem(ERROR_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save error queue to localStorage
 */
function saveErrorQueue(queue: QueuedError[]): void {
  try {
    // Keep only the most recent errors if over limit (FIFO eviction)
    const trimmedQueue = queue.slice(-MAX_QUEUE_SIZE);
    localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(trimmedQueue));
  } catch {
    // localStorage might be full or disabled - silently fail
  }
}

/**
 * Add error to queue for later retry
 */
function queueError(error: QueuedError): void {
  const queue = getErrorQueue();
  queue.push(error);
  saveErrorQueue(queue);
}

/**
 * Remove successfully sent errors from queue
 */
function removeFromQueue(timestamp: string): void {
  const queue = getErrorQueue();
  const filtered = queue.filter((e) => e.timestamp !== timestamp);
  saveErrorQueue(filtered);
}

/**
 * Report a client-side error to the server
 * Falls back to localStorage queue if the API call fails
 */
export async function reportClientError(error: ClientError): Promise<void> {
  const payload: QueuedError = {
    ...error,
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    const response = await fetch("/api/logs/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Queue for retry if server rejected
      queueError(payload);
    }
  } catch {
    // Network error - queue for retry
    queueError(payload);
  }
}

/**
 * Process queued errors - call this on page load and when coming back online
 */
export async function processErrorQueue(): Promise<void> {
  const queue = getErrorQueue();

  if (queue.length === 0) return;

  // Process in order, stop on first failure
  for (const error of queue) {
    try {
      const response = await fetch("/api/logs/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...error,
          retryCount: error.retryCount + 1,
          isRetry: true,
        }),
      });

      if (response.ok) {
        removeFromQueue(error.timestamp);
      } else {
        // Server still rejecting - keep in queue but stop processing
        break;
      }
    } catch {
      // Still offline - stop processing, keep in queue
      break;
    }
  }
}

/**
 * Initialize error reporter
 * Sets up listeners for online events to process queued errors
 */
export function initErrorReporter(): void {
  if (typeof window === "undefined") return;

  // Process queue on page load
  processErrorQueue();

  // Process queue when coming back online
  window.addEventListener("online", () => {
    processErrorQueue();
  });

  // Also process on visibility change (user returns to tab)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      processErrorQueue();
    }
  });
}

/**
 * Get current queue size (for debugging/monitoring)
 */
export function getErrorQueueSize(): number {
  return getErrorQueue().length;
}

/**
 * Clear the error queue (for testing/debugging)
 */
export function clearErrorQueue(): void {
  try {
    localStorage.removeItem(ERROR_QUEUE_KEY);
  } catch {
    // Ignore
  }
}
