import type {
  InsertSustainabilityGoal,
  InsertSustainabilityInitiative,
  InsertSustainabilityMetric,
  InsertUnifiedSustainability,
  SustainabilityGoal,
  SustainabilityInitiative,
  SustainabilityMetric,
} from "@shared/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAdminSustainabilityMutations() {
  const queryClient = useQueryClient();

  const updateConfig = useMutation({
    mutationFn: async (data: Partial<InsertUnifiedSustainability>) => {
      return apiRequest("/api/sustainability", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
    },
  });

  // Metrics Mutations
  const createMetric = useMutation({
    mutationFn: async (data: InsertSustainabilityMetric) => {
      return apiRequest("/api/v1/sustainability-metrics", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<SustainabilityMetric>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-metrics"] });
    },
  });

  const updateMetric = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSustainabilityMetric> }) => {
      return apiRequest(`/api/v1/sustainability-metrics/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<SustainabilityMetric>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-metrics"] });
    },
  });

  const deleteMetric = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/v1/sustainability-metrics/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-metrics"] });
    },
  });

  const reorderMetrics = useMutation({
    mutationFn: async (metrics: { id: number; position: number }[]) => {
      return apiRequest("/api/v1/sustainability-metrics/reorder", {
        method: "PATCH",
        body: JSON.stringify({ metrics }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-metrics"] });
    },
  });

  // Initiatives Mutations
  const createInitiative = useMutation({
    mutationFn: async (data: InsertSustainabilityInitiative) => {
      return apiRequest("/api/v1/sustainability-initiatives", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<SustainabilityInitiative>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-initiatives"] });
    },
  });

  const updateInitiative = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertSustainabilityInitiative>;
    }) => {
      return apiRequest(`/api/v1/sustainability-initiatives/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<SustainabilityInitiative>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-initiatives"] });
    },
  });

  const deleteInitiative = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/v1/sustainability-initiatives/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-initiatives"] });
    },
  });

  const reorderInitiatives = useMutation({
    mutationFn: async (initiatives: { id: number; position: number }[]) => {
      return apiRequest("/api/v1/sustainability-initiatives/reorder", {
        method: "PATCH",
        body: JSON.stringify({ initiatives }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-initiatives"] });
    },
  });

  // Goals Mutations
  const createGoal = useMutation({
    mutationFn: async (data: InsertSustainabilityGoal) => {
      return apiRequest("/api/v1/sustainability-goals", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<SustainabilityGoal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-goals"] });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSustainabilityGoal> }) => {
      return apiRequest(`/api/v1/sustainability-goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<SustainabilityGoal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-goals"] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/v1/sustainability-goals/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sustainability-goals"] });
    },
  });

  return {
    updateConfig,
    createMetric,
    updateMetric,
    deleteMetric,
    reorderMetrics,
    createInitiative,
    updateInitiative,
    deleteInitiative,
    reorderInitiatives,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
