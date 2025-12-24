import type { Product } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface FeaturedProductsSettings {
  id: number;
  title: string;
  isActive: boolean;
  autoSelect: boolean;
  maxProducts: number;
  selectedProductIds: number[];
  sortBy: string;
}

export function HomepageFeaturedManager() {
  // Fetch existing settings
  const { data: settings, isLoading } = useQuery<FeaturedProductsSettings>({
    queryKey: ["/api/homepage-featured-products-settings"],
  });

  // Fetch all products for manual selection (could be optimized with search)
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const [formState, setFormState] = useState({
    title: "Archive 24/25",
    isActive: true,
    autoSelect: true,
    maxProducts: 3,
    selectedProductIds: [] as number[],
    sortBy: "featured",
  });

  useEffect(() => {
    if (settings) {
      setFormState({
        title: settings.title || "Archive 24/25",
        isActive: settings.isActive ?? true,
        autoSelect: settings.autoSelect ?? true,
        maxProducts: settings.maxProducts || 3,
        selectedProductIds: Array.isArray(settings.selectedProductIds)
          ? settings.selectedProductIds
          : [],
        sortBy: settings.sortBy || "featured",
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof formState) => {
      // We assume ID 1 for the settings singleton, or create if missing
      const exists = settings?.id;
      const url = exists
        ? `/api/homepage-featured-products-settings/${exists}`
        : `/api/homepage-featured-products-settings`;

      // If creating (POST), we don't need ID, if updating (PATCH/PUT) we use ID
      const method = exists ? "PATCH" : "POST";

      return await apiRequest(url, { method, body: data });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/homepage-featured-products-settings"],
      });
      toast({
        title: "Success",
        description: "Featured products settings updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleProductToggle = (productId: number) => {
    setFormState((prev) => {
      const current = prev.selectedProductIds;
      if (current.includes(productId)) {
        return {
          ...prev,
          selectedProductIds: current.filter((id) => id !== productId),
        };
      } else {
        if (current.length >= prev.maxProducts) {
          toast({
            title: "Limit Reached",
            description: `Max ${prev.maxProducts} products allowed.`,
          });
          return prev;
        }
        return { ...prev, selectedProductIds: [...current, productId] };
      }
    });
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Featured Products Configuration</CardTitle>
          <CardDescription>Control the "Archive/Featured" section on the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Section Visibility</Label>
              <div className="text-muted-foreground text-sm">Show this section on homepage</div>
            </div>
            <Switch
              checked={formState.isActive}
              onCheckedChange={(c) => setFormState((prev) => ({ ...prev, isActive: c }))}
            />
          </div>

          <div className="grid gap-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label>Auto-Select Products</Label>
                <div className="text-muted-foreground text-sm">
                  Automatically show latest/featured products
                </div>
              </div>
              <Switch
                checked={formState.autoSelect}
                onCheckedChange={(c) => setFormState((prev) => ({ ...prev, autoSelect: c }))}
              />
            </div>

            {!formState.autoSelect && (
              <div className="rounded-md border p-4">
                <Label className="mb-2 block">
                  Manual Selection ({formState.selectedProductIds.length}/{formState.maxProducts})
                </Label>
                <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
                  {products?.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-2 rounded border p-2 hover:bg-gray-50"
                    >
                      <Switch
                        checked={formState.selectedProductIds.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                        className="scale-75"
                      />
                      <div className="truncate text-sm">
                        <span className="font-medium">{product.name}</span>
                        <span className="block text-gray-400 text-xs">{product.sku}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => updateSettingsMutation.mutate(formState)}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
