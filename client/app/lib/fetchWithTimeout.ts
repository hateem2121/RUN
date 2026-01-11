/**
 * Global fetch timeout utility
 *
 * Provides consistent timeout behavior for all fetch requests.
 * Uses AbortSignal.timeout() for clean cancellation.
 */

export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Fetch with automatic timeout.
 * If the request takes longer than timeoutMs, it will be aborted.
 *
 * @param url - The URL to fetch
 * @param options - Standard RequestInit options
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns Promise<Response>
 *
 * @example
 * // Basic usage
 * const response = await fetchWithTimeout("/api/products");
 *
 * // With custom timeout
 * const response = await fetchWithTimeout("/api/products", {}, 5000);
 *
 * // Combine with existing abort signal
 * const controller = new AbortController();
 * const response = await fetchWithTimeout("/api/products", { signal: controller.signal });
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  // Create timeout signal
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  // If caller provided their own signal, combine them
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  try {
    const response = await fetch(url, { ...options, signal });
    return response;
  } catch (error) {
    // Enhance timeout errors with more context
    if (error instanceof Error && error.name === "TimeoutError") {
      const enhancedError = new Error(
        `Request to ${typeof url === "string" ? url : url.toString()} timed out after ${timeoutMs}ms`
      );
      enhancedError.name = "TimeoutError";
      // Original error available via instanceof check if needed
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

/**
 * Check if an error is an abort error (user cancelled)
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "DOMException")
  );
}
