import type { paths } from "./generated/schema.js";

export interface ClientOptions {
  baseUrl: string;
  apiKey?: string | undefined;
  maxRetries?: number | undefined;
  initialRetryDelay?: number | undefined;
}

export interface RequestOptions extends Omit<RequestInit, "headers"> {
  params?: Record<string, any> | undefined;
  query?: Record<string, any> | undefined;
  headers?: any | undefined;
}

export class RunCMSClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  private maxRetries: number;
  private initialRetryDelay: number;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.maxRetries = options.maxRetries ?? 3;
    this.initialRetryDelay = options.initialRetryDelay ?? 1000;
  }

  /**
   * Internal request handler with retry logic and rate limit handling
   */
  private async request<T>(path: string, options: RequestOptions = {}, attempt = 0): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    // Add query parameters
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const headers = new Headers(options.headers);
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers,
      });

      // Handle Rate Limiting (429)
      if (response.status === 429 && attempt < this.maxRetries) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.getRetryDelay(attempt);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(path, options, attempt + 1);
      }

      // Handle Retries for server errors (5xx)
      if (response.status >= 500 && attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.getRetryDelay(attempt)));
        return this.request<T>(path, options, attempt + 1);
      }

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new RunCMSError(errorData.message || response.statusText, response.status, errorData);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof RunCMSError) throw error;

      // Retry on network errors
      if (attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.getRetryDelay(attempt)));
        return this.request<T>(path, options, attempt + 1);
      }

      throw error;
    }
  }

  private getRetryDelay(attempt: number): number {
    return this.initialRetryDelay * 2 ** attempt;
  }

  // --- API Methods ---

  /**
   * Categories Service
   */
  public get categories() {
    return {
      list: (query?: paths["/categories"]["get"]["parameters"]["query"] | undefined) =>
        this.request<any>("/categories", { query: query as Record<string, any> | undefined }),

      create: (data: any) =>
        this.request<any>("/categories", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    };
  }

  /**
   * Products Service
   */
  public get products() {
    return {
      list: (query?: paths["/products"]["get"]["parameters"]["query"] | undefined) =>
        this.request<any>("/products", { query: query as Record<string, any> | undefined }),

      get: (id: string | number) => this.request<any>(`/products/${id}`),
    };
  }

  /**
   * Media Service
   */
  public get media() {
    return {
      list: (query?: paths["/media"]["get"]["parameters"]["query"] | undefined) =>
        this.request<any>("/media", { query: query as Record<string, any> | undefined }),

      get: (id: string | number) => this.request<any>(`/media/${id}`),
    };
  }

  /**
   * Webhooks Service
   */
  public get webhooks() {
    return {
      list: () => this.request<any>("/webhooks"),

      subscribe: (data: any) =>
        this.request<any>("/webhooks", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    };
  }
}

export class RunCMSError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "RunCMSError";
    this.status = status;
    this.data = data;
  }
}
