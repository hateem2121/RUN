/**
 * Global fetch timeout utility with RFC 9457 Problem Details support
 *
 * Provides consistent timeout behavior for all fetch requests.
 * Uses AbortSignal.timeout() for clean cancellation.
 * Parses error responses as Problem Details format.
 */

import type { TypedProblemDetails } from "@run-remix/shared";

export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Error thrown for HTTP error responses
 * Contains parsed Problem Details if available
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly problemDetails?: TypedProblemDetails | undefined;
  public readonly retryAfter?: number;

  constructor(status: number, message: string, problemDetails?: TypedProblemDetails | undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.problemDetails = problemDetails;

    // Extract Retry-After if present (for 429 responses)
    if (problemDetails?.code === "RATE_LIMIT_EXCEEDED") {
      const retryAfter = (problemDetails as any)?.retryAfter;
      if (typeof retryAfter === "number") {
        this.retryAfter = retryAfter;
      }
    }
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    return [429, 503, 504].includes(this.status);
  }

  /**
   * Get field errors if this is a validation error
   */
  getFieldErrors(): Record<string, string[]> | undefined {
    if (this.status === 400 && this.problemDetails) {
      return (this.problemDetails as any)["invalid-params"];
    }
    return undefined;
  }
}

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
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Fetch with automatic timeout and error response handling.
 * Throws HttpError for non-2xx responses with parsed Problem Details.
 *
 * @param url - The URL to fetch
 * @param options - Standard RequestInit options
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns Promise<Response> - Only returns for successful responses
 * @throws {HttpError} For non-2xx HTTP responses
 * @throws {Error} For timeout or network errors
 */
export async function fetchWithTimeoutAndErrors(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    let problemDetails: TypedProblemDetails | undefined;

    const contentType = response.headers.get("content-type");
    if (
      contentType?.includes("application/problem+json") ||
      contentType?.includes("application/json")
    ) {
      try {
        problemDetails = await response.json();
      } catch {
        // Ignore JSON parse errors
      }
    }

    const message =
      problemDetails?.detail || problemDetails?.title || `HTTP ${response.status}`;

    throw new HttpError(response.status, message, problemDetails);
  }

  return response;
}

/**
 * Convenience method for JSON requests with full error handling
 */
export async function fetchJson<T>(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const response = await fetchWithTimeoutAndErrors(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  }, timeoutMs);
  return response.json();
}

/**
 * Convenience method for POST requests with JSON body
 */
export async function postJson<T, B = unknown>(
  url: string | URL,
  body: B,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return fetchJson<T>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  }, timeoutMs);
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

/**
 * Check if an error is an HTTP error
 */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
