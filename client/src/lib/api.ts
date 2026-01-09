export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  title?: string;
  detail?: string;
  type?: string;
  instance?: string;
  requestId?: string;
  invalidParams?: Record<string, string[]>;

  constructor(
    status: number,
    data: {
      message?: string; // fallback
      title?: string;
      detail?: string;
      type?: string;
      instance?: string;
      requestId?: string;
      "invalid-params"?: Record<string, string[]>;
      retryAfter?: number;
    },
  ) {
    // Prefer 'detail' for the main error message, fallback to 'title' or generic 'message'
    const msg = data.detail || data.title || data.message || "Unknown API Error";
    super(msg);

    this.status = status;
    this.name = "ApiError";
    this.retryAfter = data.retryAfter || 1000;
    if (data.title) this.title = data.title;
    if (data.detail) this.detail = data.detail;
    if (data.type) this.type = data.type;
    if (data.instance) this.instance = data.instance;
    if (data.requestId) this.requestId = data.requestId;
    if (data["invalid-params"]) this.invalidParams = data["invalid-params"];
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
    let errorData: any = {};
    const contentType = res.headers.get("content-type");

    try {
      const text = await res.text();
      if (text) {
        try {
          if (contentType?.includes("application/problem+json") || contentType?.includes("application/json")) {
            errorData = JSON.parse(text);
          } else {
            errorData = { message: text };
          }
        } catch {
          errorData = { message: text };
        }
      }
    } catch {
      // Ignore parsing errors
    }

    // Handle Rate Limit specifically
    if (res.status === 429 && errorData.error?.retryAfter) {
      errorData.retryAfter = errorData.error.retryAfter;
    }

    // Fallback: if 'error' key exists (legacy), lift it up
    if (errorData.error && typeof errorData.error === "object") {
       errorData = { ...errorData, ...errorData.error };
    }

    throw new ApiError(res.status, errorData);
  }

  // Handle empty responses
  if (res.status === 204) {
    return {};
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json") || contentType?.includes("application/problem+json")) {
    return res.json();
  }

  return res.text();
}
