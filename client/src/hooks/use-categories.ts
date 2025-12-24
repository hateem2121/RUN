import { useQuery } from "@tanstack/react-query";
import { categoriesResponseSchema } from "@/lib/schemas/categories";
import { validatedApiRequest } from "@/lib/validated-api";

export const CATEGORIES_QUERY_KEY = ["/api/categories"];

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => validatedApiRequest("/api/categories", categoriesResponseSchema),
    staleTime: 60 * 1000, // 1 minute
  });
}
