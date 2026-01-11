import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export type ManufacturingEntity = "process" | "factory" | "quality-standard" | "technique";

// Simple fallback cache invalidation
const invalidateManufacturingCache = async (queryClient: any, _entity: ManufacturingEntity) => {
  return queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
};

interface UseManufacturingMutationsOptions {
  entityType: string;
  entityTypePlural: string;
  queryKey: string | readonly unknown[];
  /**
   * The manufacturing entity type for cache invalidation
   * This determines which caches get invalidated on mutations
   */
  entity: ManufacturingEntity;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Custom hook for standardized CRUD mutations across manufacturing components
 * Eliminates duplicate mutation logic and ensures consistent error handling
 */
export function useManufacturingMutations({
  entityType,
  entityTypePlural,
  queryKey,
  entity,
  onSuccess,
  onError,
}: UseManufacturingMutationsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract base endpoint for API requests (first element if array, or the string itself)
  const apiEndpoint = (Array.isArray(queryKey) ? queryKey[0] : queryKey) as string;

  const createMutation = useMutation({
    mutationFn: (data: unknown) =>
      apiRequest(apiEndpoint, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await invalidateManufacturingCache(queryClient, entity);
      toast({
        title: "Success",
        description: `${entityType} created successfully`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create ${entityType.toLowerCase()}`,
        variant: "destructive",
      });
      onError?.(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      apiRequest(`${apiEndpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await invalidateManufacturingCache(queryClient, entity);
      toast({
        title: "Success",
        description: `${entityType} updated successfully`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update ${entityType.toLowerCase()}`,
        variant: "destructive",
      });
      onError?.(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`${apiEndpoint}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await invalidateManufacturingCache(queryClient, entity);
      toast({
        title: "Success",
        description: `${entityType} deleted successfully`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete ${entityType.toLowerCase()}`,
        variant: "destructive",
      });
      onError?.(error);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: number; position: number }[]) =>
      apiRequest(`${apiEndpoint}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ [entityTypePlural]: items }),
      }),
    onSuccess: async () => {
      await invalidateManufacturingCache(queryClient, entity);
      toast({
        title: "Success",
        description: `${entityTypePlural} reordered successfully`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reorder ${entityTypePlural.toLowerCase()}`,
        variant: "destructive",
      });
      onError?.(error);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,
  };
}
