import type { ProblemDetails } from "@run-remix/shared";

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
    if (data.title) this.title = data.title;
    if (data.detail) this.detail = data.detail;
    if (data.type) this.type = data.type;
    if (data.instance) this.instance = data.instance;
    if (data.requestId) this.requestId = data.requestId;

    // Map AppError code (support flattened or nested)
    const code = data.code || data.error?.code;
    if (code) this.code = code;

    // Handle extensions
    if (data["invalid-params"]) this.invalidParams = data["invalid-params"];
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
    const port = parseInt(process.env.PORT || "5002");
    url = `http://localhost:${port}${url}`;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Merge signals if one was provided in options
  if (options.signal) {
    if (options.signal instanceof AbortSignal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }
  }

  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    clearTimeout(id); // Clear timeout on success

    if (!res.ok) {
      const errorData = (await extractErrorBody(res)) as any;

      if (res.status === 429 && typeof errorData === "object" && errorData !== null) {
        const retryHeader = res.headers.get("Retry-After");
        if (retryHeader) {
          errorData.retryAfter = parseInt(retryHeader, 10);
        }
      }

      if (isProblemDetails(errorData)) {
        throw new ApiError(res.status, errorData);
      }

      // Fallback for non-standard error bodies
      const fallbackError: any = {
        type: "about:blank",
        title: res.statusText || "Unknown Error",
        status: res.status,
        detail: typeof errorData === "string" ? errorData : JSON.stringify(errorData),
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

    if (error instanceof ApiError || (error as any)?.name === "ApiError") {
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

function isProblemDetails(data: any): data is ProblemDetails {
  return (
    typeof data === "object" &&
    data !== null &&
    (typeof data.title === "string" || typeof data.detail === "string")
  );
}
