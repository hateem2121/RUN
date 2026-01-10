import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, ApiError } from "../../client/app/lib/api";

describe("apiRequest Timeout Hardening", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
    // Reset any previous mocks
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should timeout after default 15000ms if server hangs", async () => {
    // Mock fetch to hang but respect signal
    (global.fetch as any).mockImplementation((url: string, options: any) => {
        return new Promise((resolve, reject) => {
            const signal = options?.signal;
            if (signal) {
                if (signal.aborted) {
                    const error = new DOMException("The user aborted a request.", "AbortError");
                    return reject(error);
                }
                signal.addEventListener("abort", () => {
                    const error = new DOMException("The user aborted a request.", "AbortError");
                    reject(error);
                });
            }
        });
    });

    const promise = apiRequest("/test-endpoint");

    // Fast-forward time
    vi.advanceTimersByTime(15001);

    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
        status: 408,
        type: "urn:problem:client-timeout",
        detail: "The request timed out after 15000ms"
    });
  });

  it("should respect custom timeout", async () => {
    // Mock fetch to hang but respect signal
    (global.fetch as any).mockImplementation((url: string, options: any) => {
        return new Promise((resolve, reject) => {
            const signal = options?.signal;
            if (signal) {
                if (signal.aborted) {
                    const error = new DOMException("The user aborted a request.", "AbortError");
                    return reject(error);
                }
                signal.addEventListener("abort", () => {
                    const error = new DOMException("The user aborted a request.", "AbortError");
                    reject(error);
                });
            }
        });
    });

    // Local override 5000ms
    const promise = apiRequest("/custom-timeout", { timeout: 5000 });

    // Advance 5001ms
    vi.advanceTimersByTime(5001);

    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
        status: 408,
        detail: "The request timed out after 5000ms"
    });
  });

  it("should not timeout if request completes in time", async () => {
    (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true })
    });

    const promise = apiRequest("/success");
    
    // Advance partially
    vi.advanceTimersByTime(1000);
    
    await expect(promise).resolves.toEqual({ success: true });
  });

  it("should handle 429 Retry-After naturally (error propagation)", async () => {
    (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 
            "content-type": "application/problem+json",
            "retry-after": "5"
        }),
        json: async () => ({ title: "Too Many Requests", detail: "Slow down" })
    });

    const promise = apiRequest("/rate-limit");
    
    try {
        await promise;
    } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(429);
        // Verify our fix worked
        expect(err.retryAfter).toBe(5);
    }
  });
  
  it("should propagate Zod validation errors (invalid-params) correctly", async () => {
    (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/problem+json" }),
        json: async () => ({
            type: "urn:problem:validation-error",
            title: "Validation Error",
            status: 400,
            "invalid-params": { "email": ["Invalid email format"] }
        })
    });

    const promise = apiRequest("/validate");

    try {
        await promise;
    } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(400);
        expect(err.invalidParams).toEqual({ "email": ["Invalid email format"] });
    }
  });
});
