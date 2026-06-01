import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHomepageData } from "../use-homepage-data";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useHomepageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return data successfully", async () => {
    const mockData = {
      hero: { title: "Test Hero" },
      slogans: [],
      sections: [],
      products: [],
      categories: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "content-type" ? "application/json" : null),
      },
      json: async () => mockData,
    });

    const { result } = renderHook(() => useHomepageData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith("/api/homepage-batch", expect.any(Object));
  });

  it("should throw error when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: {
        get: (name: string) => (name === "content-type" ? "application/json" : null),
      },
      json: async () => ({
        detail: "Failed to fetch homepage batch data",
      }),
    });

    const { result } = renderHook(() => useHomepageData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch homepage batch data");
  });
});
