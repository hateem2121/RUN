import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

interface CacheOptions {
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

const DEFAULT_OPTIONS: CacheOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false
};

export function useCachedResources<T>(
  key: string | string[],
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const queryKey = Array.isArray(key) ? key : [key];
  
  return useQuery<T>({
    queryKey,
    queryFn: fetcher,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.gcTime,
    refetchOnWindowFocus: mergedOptions.refetchOnWindowFocus,
  });
}

// Helper to prefetch resources
export function usePrefetchResources() {
  const prefetch = useCallback(async (keys: string[]) => {
    const promises = keys.map(key => 
      fetch(key).then(res => res.json()).catch(() => null)
    );
    await Promise.all(promises);
  }, []);
  
  return { prefetch };
}