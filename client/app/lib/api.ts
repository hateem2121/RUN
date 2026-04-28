import type { ProblemDetails } from "@run-remix/shared";

/**
 * Extract CSRF token from cookies for Double-Submit Cookie pattern.
 * The server sets csrf_token as a non-httpOnly cookie readable by JS.
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrf_token="))
      ?.split("=")[1] ?? null
  );
}

export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  title?: string;
  detail?: string;
  type?: string;
  instance?: string;
  requestId?: string;
  invalidParams?: Record<string, string[]>;
  code?: string; // Standardized AppError code

  constructor(
    status: number,
    data: Partial<ProblemDetails> & {
      message?: string;
      retryAfter?: number;
      "invalid-params"?: Record<string, string[]>;
      code?: string; // Add code to constructor type
      error?: { code?: string }; // Handle nested error object case
    },
  ) {
    // Prefer 'detail' for the main error message, fallback to 'title' or generic 'message'
    const msg = data.detail || data.title || data.message || "Unknown API Error";
    super(msg);

    this.status = status;
    this.name = "ApiError";
    this.retryAfter = data.retryAfter || 1000;

    // Explicit mappings for ProblemDetails
    if (data.title) {
      this.title = data.title;
    }
    if (data.detail) {
      this.detail = data.detail;
    }
    if (data.type) {
      this.type = data.type;
    }
    if (data.instance) {
      this.instance = data.instance;
    }
    if (data.requestId) {
      this.requestId = data.requestId;
    }

    // Map AppError code (support flattened or nested)
    const code = data.code || data.error?.code;
    if (code) {
      this.code = code;
    }

    // Handle extensions
    if (data["invalid-params"]) {
      this.invalidParams = data["invalid-params"];
    }
  }

  /**
   * Check if this error is retryable (429 Rate Limit, 503 Service Unavailable, 504 Gateway Timeout)
   */
  isRetryable(): boolean {
    return [429, 503, 504].includes(this.status);
  }

  /**
   * Get field errors if this is a validation error (RFC 7807 extension)
   */
  getFieldErrors(): Record<string, string[]> | undefined {
    return this.invalidParams;
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number; // Timeout in milliseconds, defaults to 15000 (15s)
}

/**
 * Enhanced fetch wrapper with:
 * - RFC 7807 Error Parsing
 * - Default Timeout (15s)
 * - Automatic Retry-After handling for 429s
 */
export async function apiRequest<T>(
  endpoint: string,
  { timeout = 15000, ...options }: RequestOptions = {},
): Promise<T> {
  // SSR Support: Prepend localhost for relative URLs on server
  let url = endpoint;
  if (typeof window === "undefined" && url.startsWith("/")) {
    const port = parseInt(process.env.PORT || "5002", 10);
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    url = `${protocol}://localhost:${port}${url}`;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Merge signals if one was provided in options
  if (options.signal) {
    if (options.signal instanceof AbortSignal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }
  }

  // SEC-003: Inject CSRF token on all state-changing requests
  const method = (options.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const csrfHeaders: Record<string, string> = {};
  if (needsCsrf) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      csrfHeaders["x-csrf-token"] = csrfToken;
    }
  }

  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...csrfHeaders,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    clearTimeout(id); // Clear timeout on success

    if (!res.ok) {
      const errorData = await extractErrorBody(res);

      if (res.status === 429 && isErrorObject(errorData)) {
        const retryHeader = res.headers.get("Retry-After");
        if (retryHeader) {
          errorData.retryAfter = parseInt(retryHeader, 10);
        }
      }

      if (isProblemDetails(errorData)) {
        throw new ApiError(res.status, errorData);
      }

      // Fallback for non-standard error bodies
      const fallbackError: Partial<ProblemDetails> & { message: string } = {
        type: "about:blank",
        title: res.statusText || "Unknown Error",
        status: res.status,
        detail: typeof errorData === "string" ? errorData : JSON.stringify(errorData),
        message: typeof errorData === "string" ? errorData : "Unknown Error", // Ensure message exists
      };
      throw new ApiError(res.status, fallbackError);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    // Attempt to parse JSON
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await res.json();
    }
    return (await res.text()) as unknown as T;
  } catch (error) {
    clearTimeout(id); // Ensure clear on error too

    const errObj = error as Record<string, unknown>;
    if (
      error instanceof ApiError ||
      (typeof errObj === "object" && errObj !== null && errObj.name === "ApiError")
    ) {
      throw error;
    }

    // Handle AbortError / Timeout
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, {
        type: "urn:problem:client-timeout",
        title: "Request Timeout",
        status: 408,
        detail: `The request timed out after ${timeout}ms`,
        instance: url,
      });
    }

    // Network errors or other fetch failures
    throw new ApiError(500, {
      type: "urn:problem:network-error",
      title: "Network Error",
      status: 500,
      detail: error instanceof Error ? error.message : "Failed to connect to server",
      instance: url,
    });
  }
}

async function extractErrorBody(res: Response): Promise<unknown> {
  try {
    const contentType = res.headers.get("content-type");
    if (
      contentType &&
      (contentType.includes("application/json") || contentType.includes("application/problem+json"))
    ) {
      return await res.json();
    }
    return await res.text();
  } catch {
    return "Unknown error occurred";
  }
}

function isProblemDetails(data: unknown): data is ProblemDetails {
  const d = data as Record<string, unknown>;
  return (
    typeof data === "object" &&
    data !== null &&
    (typeof d.title === "string" || typeof d.detail === "string")
  );
}

function isErrorObject(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}
