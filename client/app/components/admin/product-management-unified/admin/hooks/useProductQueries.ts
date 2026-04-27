import { ADMIN_MEDIA_QUERIES, buildMediaApiParams } from "@shared/api-constants";
import type {
  Accessory,
  Category,
  Certificate,
  Fabric,
  Fiber,
  MediaAsset,
  Product,
  SizeChart,
} from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { createMediaQueryKey } from "@/lib/media-query-keys";

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type MediaApiResponse =
  | { success: true; data: { data: MediaAsset[] } }
  | { success: true; data: MediaAsset[] }
  | MediaAsset[];

export function useProductQueries(isOpen: boolean, isCustomizationOpen: boolean) {
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isOpen,
  });

  const { data: fabrics = [], isLoading: isLoadingFabrics } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isOpen,
  });

  const { data: fibers = [], isLoading: isLoadingFibers } = useQuery<Fiber[]>({
    queryKey: ["/api/fibers"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: isOpen,
  });

  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: isOpen,
  });

  const { data: accessories = [], isLoading: isLoadingAccessories } = useQuery<Accessory[]>({
    queryKey: ["/api/accessories"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: isOpen,
  });

  const { data: sizeCharts = [], isLoading: isLoadingSizeCharts } = useQuery<SizeChart[]>({
    queryKey: ["/api/size-charts"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: isOpen,
  });

  const { data: productsResponse } = useQuery<{
    data: Product[];
    pagination?: PaginationMeta;
  }>({
    queryKey: ["/api/products"],
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!(isOpen && isCustomizationOpen),
  });

  const allProducts = Array.isArray((productsResponse as { data?: unknown })?.data)
    ? (productsResponse as { data: Product[] }).data
    : [];

  const { data: mediaAssets = [], isLoading: isLoadingMedia } = useQuery<MediaAsset[]>({
    queryKey: createMediaQueryKey.list({ limit: 100 }),
    queryFn: async () => {
      const response = await fetch(
        `/api/media?${buildMediaApiParams(ADMIN_MEDIA_QUERIES.MAX_ASSETS)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch media assets");
      }
      return response.json();
    },
    select: (data: MediaApiResponse): MediaAsset[] => {
      if (typeof data === "object" && "success" in data && data.success) {
        if ("data" in data.data && Array.isArray(data.data.data)) {
          return data.data.data;
        } else if (Array.isArray(data.data)) {
          return data.data;
        }
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isOpen,
  });

  const isLoadingAny =
    isLoadingCategories ||
    isLoadingFabrics ||
    isLoadingFibers ||
    isLoadingCertificates ||
    isLoadingAccessories ||
    isLoadingSizeCharts ||
    isLoadingMedia;

  return {
    categories,
    fabrics,
    fibers,
    certificates,
    accessories,
    sizeCharts,
    allProducts,
    mediaAssets,
    isLoadingAny,
  };
}
