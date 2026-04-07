import type {
  InsertHomepageFeaturedProductsSettings,
  InsertHomepageHero,
  InsertHomepageProcessCard,
  InsertHomepageSection,
  InsertHomepageSlogan,
} from "@shared/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

export function useAdminHomepageMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateHomepageQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["homepage-batch"] });
    queryClient.invalidateQueries({ queryKey: ["homepage-process-cards-admin"] });
  };

  // Hero Mutations
  const updateHomepageHero = useMutation({
    mutationFn: async (data: Partial<InsertHomepageHero>) => {
      return apiRequest<InsertHomepageHero>("/api/homepage-hero", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Homepage Hero updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Slogan Mutations
  const createSlogan = useMutation({
    mutationFn: async (data: InsertHomepageSlogan) => {
      return apiRequest<InsertHomepageSlogan>("/api/homepage-slogans", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Slogan created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSlogan = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHomepageSlogan> }) => {
      return apiRequest<InsertHomepageSlogan>(`/api/homepage-slogans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Slogan updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSlogan = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/homepage-slogans/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Slogan deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderSlogans = useMutation({
    mutationFn: async (slogans: { id: number; position: number }[]) => {
      return apiRequest("/api/homepage-slogans/reorder", {
        method: "PATCH",
        body: JSON.stringify({ slogans }),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      // No toast for reordering to avoid spam
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Process Card Mutations
  const createProcessCard = useMutation({
    mutationFn: async (data: InsertHomepageProcessCard) => {
      return apiRequest<InsertHomepageProcessCard>("/api/homepage-process-cards", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Process card created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProcessCard = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHomepageProcessCard> }) => {
      return apiRequest<InsertHomepageProcessCard>(`/api/homepage-process-cards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Process card updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteProcessCard = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/homepage-process-cards/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Process card deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderProcessCards = useMutation({
    mutationFn: async (cards: { id: number; position: number }[]) => {
      return apiRequest("/api/homepage-process-cards/reorder", {
        method: "PATCH",
        body: JSON.stringify({ cards }),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      // No toast for reordering
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Section Mutations
  const updateSection = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHomepageSection> }) => {
      return apiRequest<InsertHomepageSection>(`/api/homepage-sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Section updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Featured Settings Mutation
  const updateFeaturedSettings = useMutation({
    mutationFn: async (data: Partial<InsertHomepageFeaturedProductsSettings>) => {
      return apiRequest<InsertHomepageFeaturedProductsSettings>(
        "/api/homepage-featured-products-settings",
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      );
    },
    onSuccess: () => {
      invalidateHomepageQueries();
      toast({ title: "Success", description: "Featured settings updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    updateHomepageHero,
    createSlogan,
    updateSlogan,
    deleteSlogan,
    reorderSlogans,
    createProcessCard,
    updateProcessCard,
    deleteProcessCard,
    reorderProcessCards,
    updateSection,
    updateFeaturedSettings,
  };
}
