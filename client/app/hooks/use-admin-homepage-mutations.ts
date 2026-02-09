import type {
  InsertHomepageFeaturedProductsSettings,
  InsertHomepageHero,
  InsertHomepageProcessCard,
  InsertHomepageSection,
  InsertHomepageSlogan,
} from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
      const response = await fetch("/api/homepage-hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update homepage hero");
      }
      return response.json();
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
      const response = await fetch("/api/homepage-slogans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create slogan");
      }
      return response.json();
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
      const response = await fetch(`/api/homepage-slogans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update slogan");
      }
      return response.json();
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
      const response = await fetch(`/api/homepage-slogans/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete slogan");
      }
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
      const response = await fetch("/api/homepage-slogans/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slogans }),
      });
      if (!response.ok) {
        throw new Error("Failed to reorder slogans");
      }
      return response.json();
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
      const response = await fetch("/api/homepage-process-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create process card");
      }
      return response.json();
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
      const response = await fetch(`/api/homepage-process-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update process card");
      }
      return response.json();
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
      const response = await fetch(`/api/homepage-process-cards/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete process card");
      }
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
      const response = await fetch("/api/homepage-process-cards/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });
      if (!response.ok) {
        throw new Error("Failed to reorder process cards");
      }
      return response.json();
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
      const response = await fetch(`/api/homepage-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update section");
      }
      return response.json();
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
      const response = await fetch("/api/homepage-featured-products-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update featured settings");
      }
      return response.json();
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
