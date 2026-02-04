import { useQuery } from "@tanstack/react-query";
import type { HomepageBatchResponse } from "../components/homepage/types";

const FETCH_STALE_TIME = 1000 * 60 * 5; // 5 minutes (L1 cache on server is 3min)

/**
 * useHomepageData - Fetches aggregated data for the homepage
 * Uses /api/homepage-batch which returns hero, slogans, sections, settings, products, and categories
 */
export function useHomepageData() {
  return useQuery<HomepageBatchResponse>({
    queryKey: ["homepage", "batch"],
    queryFn: async () => {
      const response = await fetch("/api/homepage-batch");
      if (!response.ok) {
        throw new Error("Failed to fetch homepage batch data");
      }
      return response.json();
    },
    staleTime: FETCH_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
