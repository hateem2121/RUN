export class ApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter || 1000;
    this.name = "ApiError";
  }
}

export async function apiRequest(
  urlOrOptions:
    | string
    | {
        url: string;
        method?: string;
        body?: any;
        headers?: Record<string, string>;
      },
  options?: { method?: string; body?: any; headers?: Record<string, string> },
): Promise<any> {
  let url: string;
  let method: string;
  let body: any;
  let headers: Record<string, string>;

  if (typeof urlOrOptions === "string") {
    url = urlOrOptions;
    method = options?.method || "GET";
    body = options?.body;
    headers = options?.headers || {};
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method || "GET";
    body = urlOrOptions.body;
    headers = urlOrOptions.headers || {};
  }

  // SSR Support: Prepend localhost for relative URLs on server
  if (typeof window === "undefined" && url.startsWith("/")) {
    const port = process.env.PORT || 5001;
    url = `http://localhost:${port}${url}`;
  }

  const isFormData = body instanceof FormData;
  const finalHeaders = { ...headers };

  if (!isFormData && body) {
    finalHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body as BodyInit,
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    let retryAfter: number | undefined;

    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          errorMessage = json.message || json.error?.message || errorMessage;

          // Handle Rate Limit Error specifically
          if (res.status === 429 && json.error?.retryAfter) {
            retryAfter = json.error.retryAfter;
          }
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // Ignore parsing errors
    }

    throw new ApiError(errorMessage, res.status, retryAfter);
  }

  // Handle empty responses
  if (res.status === 204) {
    return {};
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }

  return res.text();
}
