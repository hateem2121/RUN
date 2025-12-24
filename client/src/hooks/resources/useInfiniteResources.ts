import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

interface ResourceSearchParams {
  search?: string;
  type?: string;
  active?: boolean;
  limit?: number;
}

export function useInfiniteResources({
  search = "",
  type = "all",
  active,
  limit = 20,
}: ResourceSearchParams) {
  const debouncedSearch = useDebounce(search, 300);

  return useInfiniteQuery({
    queryKey: ["/api/resources/search", debouncedSearch, type, active, limit],
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("type", type);
      params.set("limit", limit.toString());
      params.set("offset", pageParam.toString());
      if (active !== undefined) params.set("active", active.toString());

      const response = await fetch(`/api/resources/search?${params}`);
      if (!response.ok) throw new Error("Failed to search resources");
      return response.json();
    },
    getNextPageParam: (lastPage: any) => {
      const nextOffset = lastPage.offset + lastPage.limit;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 10000,
    gcTime: 30000,
  });
}
