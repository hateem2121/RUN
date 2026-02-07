
import { useQuery } from "@tanstack/react-query";
import type {
  HomepageFeaturedProductsSettings,
  HomepageHero,
  HomepageProcessCard,
  HomepageSection,
  HomepageSlogan,
} from "@shared/schema";

interface HomepageBatchResponse {
  hero: { result: HomepageHero | undefined; timestamp: string };
  slogans: { result: HomepageSlogan[]; timestamp: string };
  sections: { result: HomepageSection[]; timestamp: string };
  featuredProductsSettings: { result: HomepageFeaturedProductsSettings | undefined; timestamp: string };
  // Products and Categories are also returned but might not be needed for Admin editing unless implemented later
}

export function useAdminHomepageData() {
  const { data: batchData, isLoading, refetch } = useQuery<HomepageBatchResponse>({
    queryKey: ["homepage-batch"],
    queryFn: async () => {
      const response = await fetch("/api/homepage-batch?refresh=1"); // Force refresh for admin
      if (!response.ok) {
        throw new Error("Failed to fetch homepage data");
      }
      return response.json();
    },
  });

  // We also need process cards which are separate
  const { data: processCards, isLoading: isLoadingProcessCards, refetch: refetchProcessCards } = useQuery<HomepageProcessCard[]>({
    queryKey: ["homepage-process-cards-admin"],
    queryFn: async () => {
      const response = await fetch("/api/homepage-process-cards/admin?refresh=1");
      if (!response.ok) {
        throw new Error("Failed to fetch process cards");
      }
      return response.json();
    },
  });

  return {
    isLoading: isLoading || isLoadingProcessCards,
    hero: batchData?.hero.result,
    slogans: batchData?.slogans.result || [],
    sections: batchData?.sections.result || [],
    featuredSettings: batchData?.featuredProductsSettings.result,
    processCards: processCards || [],
    refetch: () => {
      refetch();
      refetchProcessCards();
    },
  };
}
