import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchParams {
  search: string;
  type?: string;
  limit?: number;
  offset?: number;
  active?: boolean;
}

interface SearchResponse {
  // biome-ignore lint/suspicious/noExplicitAny: Generic search data type
  data: any[];
  total: number;
  limit: number;
  offset: number;
}

export function useServerSearch({
  search,
  type = "all",
  limit = 20,
  offset = 0,
  active,
}: SearchParams) {
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ["/api/resources/search", debouncedSearch, type, limit, offset, active],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("type", type);
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      if (active !== undefined) params.set("active", active.toString());

      const response = await fetch(`/api/resources/search?${params}`);
      if (!response.ok) throw new Error("Failed to search resources");
      return response.json();
    },
    enabled: debouncedSearch.length >= 2, // Only search with 2+ characters
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 30000, // Keep in cache for 30 seconds
  });

  return {
    searchResults: data?.data || [],
    totalResults: data?.total || 0,
    isSearching: isLoading,
    error,
    isDebouncing: search !== debouncedSearch,
  };
}
