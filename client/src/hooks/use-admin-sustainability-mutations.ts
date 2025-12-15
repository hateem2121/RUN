import { useMutation } from "@tanstack/react-query";
import { getQueryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  UnifiedSustainability,
  SustainabilityMetric,
  SustainabilityInitiative,
  SustainabilityGoal,
} from "@shared/schema";

interface UseAdminSustainabilityMutationsReturn {
  updateConfig: ReturnType<typeof useMutation<any, Error, Partial<UnifiedSustainability>, unknown>>;
  createMetric: ReturnType<typeof useMutation<any, Error, Partial<SustainabilityMetric>, unknown>>;
  updateMetric: ReturnType<typeof useMutation<any, Error, { id: number; data: Partial<SustainabilityMetric> }, unknown>>;
  deleteMetric: ReturnType<typeof useMutation<any, Error, number, unknown>>;
  reorderMetrics: ReturnType<typeof useMutation<any, Error, SustainabilityMetric[], unknown>>;
  createInitiative: ReturnType<typeof useMutation<any, Error, Partial<SustainabilityInitiative>, unknown>>;
  updateInitiative: ReturnType<typeof useMutation<any, Error, { id: number; data: Partial<SustainabilityInitiative> }, unknown>>;
  deleteInitiative: ReturnType<typeof useMutation<any, Error, number, unknown>>;
  reorderInitiatives: ReturnType<typeof useMutation<any, Error, { id: number; position: number }[], unknown>>;
  createGoal: ReturnType<typeof useMutation<any, Error, Partial<SustainabilityGoal>, unknown>>;
  updateGoal: ReturnType<typeof useMutation<any, Error, { id: number; data: Partial<SustainabilityGoal> }, unknown>>;
  deleteGoal: ReturnType<typeof useMutation<any, Error, number, unknown>>;
}

function invalidateAllSustainabilityQueries() {
  getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability/batch"] });
  getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability"] });
}

export function useAdminSustainabilityMutations(): UseAdminSustainabilityMutationsReturn {
  const { toast } = useToast();

  const updateConfig = useMutation({
    mutationFn: (data: Partial<UnifiedSustainability>) =>
      apiRequest("/api/sustainability", { method: "PATCH", body: data }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      toast({
        title: "✅ Saved Successfully",
        description: "Sustainability configuration has been updated",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || "Failed to update sustainability data";
      toast({
        title: "❌ Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const createMetric = useMutation({
    mutationFn: (data: Partial<SustainabilityMetric>) =>
      apiRequest("/api/sustainability-metrics", { method: "POST", body: data }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-metrics"] });
      toast({
        title: "✅ Metric Created",
        description: "The metric has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Failed to Create Metric",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMetric = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SustainabilityMetric> }) =>
      apiRequest(`/api/sustainability-metrics/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-metrics"] });
      toast({
        title: "✅ Metric Updated",
        description: "The metric has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Failed to Update Metric",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMetric = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/sustainability-metrics/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-metrics"] });
      toast({ title: "Success", description: "Metric deleted successfully" });
    },
  });

  const reorderMetrics = useMutation({
    mutationFn: (metrics: SustainabilityMetric[]) =>
      apiRequest("/api/sustainability-metrics/reorder", { method: "PATCH", body: { metrics } }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-metrics"] });
      toast({
        title: "Success",
        description: "Metrics reordered successfully",
      });
    },
  });

  const createInitiative = useMutation({
    mutationFn: (data: Partial<SustainabilityInitiative>) =>
      apiRequest("/api/sustainability-initiatives", { method: "POST", body: data }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-initiatives"] });
      toast({
        title: "🚀 Initiative Created",
        description: "The initiative is now active.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Failed to Create Initiative",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateInitiative = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SustainabilityInitiative> }) =>
      apiRequest(`/api/sustainability-initiatives/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-initiatives"] });
      toast({
        title: "✅ Initiative Updated",
        description: "The initiative has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Failed to Update Initiative",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteInitiative = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/sustainability-initiatives/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-initiatives"] });
      toast({
        title: "Success",
        description: "Initiative deleted successfully",
      });
    },
  });

  const reorderInitiatives = useMutation({
    mutationFn: (initiatives: { id: number; position: number }[]) =>
      apiRequest("/api/sustainability-initiatives/reorder", { method: "PATCH", body: { initiatives } }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-initiatives"] });
      toast({
        title: "Success",
        description: "Initiatives reordered successfully",
      });
    },
  });

  const createGoal = useMutation({
    mutationFn: (data: Partial<SustainabilityGoal>) =>
      apiRequest("/api/sustainability-goals", { method: "POST", body: data }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-goals"] });
      toast({
        title: "🎯 Goal Created",
        description: "The goal has been added to your sustainability goals.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Failed to Create Goal",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SustainabilityGoal> }) =>
      apiRequest(`/api/sustainability-goals/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-goals"] });
      toast({
        title: "✅ Goal Updated",
        description: "The goal has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Failed to Update Goal",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/sustainability-goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAllSustainabilityQueries();
      getQueryClient().invalidateQueries({ queryKey: ["/api/sustainability-goals"] });
      toast({ title: "Success", description: "Goal deleted successfully" });
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
