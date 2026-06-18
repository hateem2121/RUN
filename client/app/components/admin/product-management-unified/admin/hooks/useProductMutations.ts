import type { InsertProduct, Product } from "@shared/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

interface UseProductMutationsProps {
  onSuccess: () => void;
  productUrlPath?: string | null;
}

export function useProductMutations({ onSuccess, productUrlPath }: UseProductMutationsProps) {
  const queryClient = useQueryClient();

  const invalidateProductCaches = (
    productData: { urlPath?: string | null; slug?: string | null },
    originalUrlPath?: string | null,
  ) => {
    // Invalidate all product-related queries for complete synchronization
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/products/initial-data"],
    });

    // Invalidate product-complete caches for individual product pages
    if (productData.urlPath) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", productData.urlPath],
      });
    }
    if (productData.slug) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", productData.slug],
      });
    }

    // For updates, also invalidate the original path if it changed
    if (originalUrlPath && originalUrlPath !== productData.urlPath) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", originalUrlPath],
      });
    }

    // Invalidate hierarchical product queries
    queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/products/by-path"] });
    queryClient.invalidateQueries({ queryKey: ["/api/product-complete"] });
  };

  const createProductMutation = useMutation({
    mutationFn: (data: InsertProduct) =>
      apiRequest("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<Product>,
    onSuccess: (newProduct: Product) => {
      try {
        console.debug("Product created successfully", {
          productId: newProduct.id,
          name: newProduct.name,
        });

        invalidateProductCaches(newProduct);

        toast.success("Success", { description: "Product created successfully" });

        onSuccess();
      } catch (_err) {}
    },
    onError: (error: Error) => {
      toast.error("Error", { description: error.message });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertProduct> }) =>
      apiRequest(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<Product>,
    onSuccess: (updatedProduct: Product) => {
      try {
        console.debug("Product updated successfully", {
          productId: updatedProduct.id,
          name: updatedProduct.name,
        });

        invalidateProductCaches(updatedProduct, productUrlPath);

        toast.success("Success", { description: "Product updated successfully" });

        onSuccess();
      } catch (_err) {}
    },
    onError: (error: Error) => {
      toast.error("Error", { description: error.message });
    },
  });

  return {
    createProductMutation,
    updateProductMutation,
    isSubmitting: createProductMutation.isPending || updateProductMutation.isPending,
  };
}
