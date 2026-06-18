import type { Accessory, Certificate, Fabric, Fiber, SizeChart } from "@shared/index";
import { useQuery } from "@tanstack/react-query";

type ResourceType = "certificate" | "accessory" | "sizechart" | "fabric" | "fiber" | "all";

interface BatchResponse {
  certificates?: Certificate[];
  accessories?: Accessory[];
  sizeCharts?: SizeChart[];
  fabrics?: Fabric[];
  fibers?: Fiber[];
}

export function useResourceBatch(types: ResourceType[] | "all", activeOnly: boolean = false) {
  const typeString = types === "all" ? "all" : types.join(",");

  // Build URL with query parameters
  const params = new URLSearchParams();
  params.set("types", typeString);
  if (activeOnly) {
    params.set("active", "true");
  }
  const apiUrl = `/api/resources/batch?${params}`;

  const { data, status, error } = useQuery<BatchResponse>({
    queryKey: [apiUrl],
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  return {
    certificates: data?.certificates || [],
    accessories: data?.accessories || [],
    sizeCharts: data?.sizeCharts || [],
    fabrics: data?.fabrics || [],
    fibers: data?.fibers || [],
    isLoading: status === "pending",
    error,
  };
}
