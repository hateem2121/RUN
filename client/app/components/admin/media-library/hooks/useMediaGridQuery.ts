import type { MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCacheInvalidationListener } from "@/hooks/useCacheInvalidation";
import { createMediaQueryKey } from "@/lib/media-query-keys";
import { batchFetchMediaContent } from "@/lib/queryClient";
import { useMediaLibrary } from "../MediaLibraryContextEnhanced";

interface MediaGridQueryResult {
  displayAssets: MediaAsset[];
  pagination: {
    totalPages: number;
    total: number;
    page: number;
    limit: number;
  };
  batchContent: Record<number, string> | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useMediaGridQuery(): MediaGridQueryResult {
  const { state, setTotalPages } = useMediaLibrary();

  // Event-driven cache invalidation
  useCacheInvalidationListener("media:");

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (state.searchTerm) params.append("search", state.searchTerm);
    if (state.selectedType && state.selectedType !== "all")
      params.append("type", state.selectedType);
    params.append("sortBy", state.sortBy);
    params.append("sortOrder", state.sortOrder);
    params.append("page", String(state.currentPage));
    params.append("limit", "24");
    params.append("nocache", "true");
    return params;
  };

  const params = buildQueryParams();
  const apiUrl = `/api/media?${params.toString()}`;

  const queryKey = createMediaQueryKey.paginated({
    page: state.currentPage,
    limit: 24,
    search: state.searchTerm,
    type: state.selectedType,
  });

  const {
    data: mediaResponse,
    status,
    error,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const timeoutId = setTimeout(() => {}, 30000);
      try {
        const response = await fetch(apiUrl, { signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        const err = error as Error;
        if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
          return {
            success: false,
            data: [],
            pagination: { page: 1, totalPages: 0, totalCount: 0 },
          };
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    select: (data) => {
      const dataRecord = data as Record<string, unknown>;
      if (!dataRecord || !dataRecord.data || !Array.isArray(dataRecord.data)) {
        return data;
      }
      const filteredAssets = dataRecord.data.filter((asset: unknown) => {
        if (typeof asset !== "object" || asset === null) return true;
        return !(asset as Record<string, unknown>).deletedAt;
      });
      const metaObj = (dataRecord.meta || {}) as Record<string, unknown>;
      return {
        ...dataRecord,
        data: filteredAssets,
        meta: { ...metaObj, total: filteredAssets.length },
      };
    },
    retry: (failureCount, error) => {
      const err = error as Error & { code?: string };
      const isAbortError =
        err?.name === "AbortError" ||
        err?.message?.includes("aborted") ||
        err?.message?.includes("cancelled") ||
        err?.code === "ABORT_ERR";

      if (isAbortError) return false;
      if (err?.message?.includes("429")) return failureCount < 3;
      if (err?.message?.includes("Failed to fetch media: 4")) return false;
      if (error instanceof TypeError && error.message === "Failed to fetch")
        return failureCount < 2;
      if (err?.message?.includes("Failed to fetch media: 5")) return failureCount < 2;
      return false;
    },
    retryDelay: (attemptIndex, error) => {
      const err = error as Error & {
        response?: { headers?: { get?: (key: string) => string | null } };
      };
      const retryAfter = err?.response?.headers?.get?.("Retry-After");

      if (retryAfter) {
        const retrySeconds = Number.parseInt(retryAfter, 10);
        if (!Number.isNaN(retrySeconds)) return retrySeconds * 1000;
      }

      if (err?.message?.includes("429")) {
        return Math.min(2000 * 2 ** attemptIndex, 10000);
      }
      return Math.min(1000 * 2 ** attemptIndex, 5000);
    },
  });

  const isLoading = status === "pending";

  // ─── Response Parsing & Pagination ─────────────────────────────────────────────

  const response = mediaResponse as Record<string, unknown> | undefined;
  const responseData = response?.data as Record<string, unknown> | unknown[] | undefined;
  const displayAssets =
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData &&
    Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData)
        ? responseData
        : [];

  const metaRaw = (
    responseData && typeof responseData === "object" && "meta" in responseData
      ? responseData.meta
      : response?.meta
  ) as { pages?: number; total?: number; page?: number; limit?: number } | undefined;

  const paginationRaw = (
    responseData && typeof responseData === "object" && "pagination" in responseData
      ? responseData.pagination
      : response?.pagination
  ) as { totalPages?: number; total?: number; page?: number; limit?: number } | undefined;

  const total = metaRaw?.total || paginationRaw?.total || 0;
  const limit = metaRaw?.limit || paginationRaw?.limit || 24;
  const calculatedTotalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const pagination = {
    totalPages: metaRaw?.pages || paginationRaw?.totalPages || calculatedTotalPages,
    total: total,
    page: metaRaw?.page || paginationRaw?.page || 1,
    limit: limit,
  };

  useEffect(() => {
    if (pagination.totalPages && pagination.totalPages !== state.totalPages) {
      setTotalPages(pagination.totalPages);
    }
  }, [pagination.totalPages, state.totalPages, setTotalPages]);

  // ─── Batch Signed URL Fetching ─────────────────────────────────────────────────

  const { data: batchContent } = useQuery({
    queryKey: ["media-batch", displayAssets.map((a: MediaAsset) => a.id).join(",")],
    queryFn: async () => {
      if (displayAssets.length === 0) return {};
      const ids = displayAssets.map((a: MediaAsset) => a.id);
      const results = await batchFetchMediaContent(ids);

      const urlMap: Record<number, string> = {};
      for (const result of results) {
        if (result.success && result.url) {
          urlMap[result.id] = result.url;
        }
      }
      return urlMap;
    },
    enabled: displayAssets.length > 0,
    staleTime: 45 * 60 * 1000,
    refetchOnMount: true,
  });

  return {
    displayAssets,
    pagination,
    batchContent,
    isLoading,
    error: error as Error | null,
  };
}
