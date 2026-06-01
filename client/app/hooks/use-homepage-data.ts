import type { HomepageBatchResponse } from "@shared/types/homepage";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryKeys } from "../lib/queryClient";

const FETCH_STALE_TIME = 1000 * 60 * 5; // 5 minutes (L1 cache on server is 3min)

/**
 * useHomepageData - Fetches aggregated data for the homepage
 * Uses /api/homepage-batch which returns hero, slogans, sections, settings, products, and categories
 */
export function useHomepageData() {
  return useQuery<HomepageBatchResponse>({
    queryKey: queryKeys.homepage.batch(),
    queryFn: () => apiRequest<HomepageBatchResponse>(queryKeys.homepage.batch()[0]),
    staleTime: FETCH_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
