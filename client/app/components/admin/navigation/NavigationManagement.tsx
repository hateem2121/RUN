import type { NavigationItem } from "@shared/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Navigation, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { queryKeys } from "@/lib/query-client";

export function NavigationManagement() {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");

  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery<NavigationItem[]>({
    queryKey: queryKeys.navigation(),
    queryFn: async () => {
      const res = await fetch("/api/navigation-items");
      if (!res.ok) throw new Error("Failed to fetch navigation items");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<NavigationItem> }) => {
      const res = await fetch(`/api/navigation-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update navigation item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation() });
      toast.success("Navigation item updated successfully");
    },
    onError: () => {
      toast.error("Failed to update navigation item");
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newItem: { label: string; href: string; sortOrder: number }) => {
      const res = await fetch("/api/navigation-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) throw new Error("Failed to create navigation item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation() });
      setNewLabel("");
      setNewHref("");
      toast.success("New navigation item added successfully");
    },
    onError: () => {
      toast.error("Failed to add navigation item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/navigation-items/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete navigation item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navigation() });
      toast.success("Navigation item removed");
    },
    onError: () => {
      toast.error("Failed to delete navigation item");
    },
  });

  const handleToggleActive = (item: NavigationItem) => {
    updateMutation.mutate({
      id: item.id,
      updates: { isActive: !item.isActive },
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newHref.trim()) {
      toast.error("Please provide both label and destination URL");
      return;
    }
    const maxOrder = items.reduce((max, i) => Math.max(max, i.sortOrder || 0), 0);
    addMutation.mutate({
      label: newLabel.trim(),
      href: newHref.trim(),
      sortOrder: maxOrder + 1,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Navigation className="h-8 w-8 text-primary" />
            Navigation Management
          </Typography.H1>
          <Typography.P className="text-muted-foreground mt-1">
            Configure main ceiling notch navigation links, hierarchical categories, and visibility.
          </Typography.P>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Navigation Items List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Live Navigation Items ({items.length})
              </CardTitle>
              <CardDescription>
                Items marked active appear in the ceiling notch navbar on desktop and mobile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No custom navigation items configured. The navbar is running on high-performance
                  fallback defaults.
                </div>
              ) : (
                <div className="divide-y divide-border rounded-lg border">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{item.label}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({item.href})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Order: {item.sortOrder}</span>
                          <span>•</span>
                          <span>{item.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${item.id}`} className="text-xs">
                            Active
                          </Label>
                          <Switch
                            id={`active-${item.id}`}
                            checked={!!item.isActive}
                            onCheckedChange={() => handleToggleActive(item)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="text-destructive hover:bg-destructive/10 cursor-pointer"
                          aria-label={`Delete ${item.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add New Link Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add Navigation Item
              </CardTitle>
              <CardDescription>Create a new link for the top-level navbar.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item-label">Display Label</Label>
                  <Input
                    id="item-label"
                    placeholder="e.g. Custom Knitwear"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-href">Destination URL / Route</Label>
                  <Input
                    id="item-href"
                    placeholder="e.g. /products or /custom"
                    value={newHref}
                    onChange={(e) => setNewHref(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {addMutation.isPending ? "Adding..." : "Add to Navigation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
