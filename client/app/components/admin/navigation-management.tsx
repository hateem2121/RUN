import type { InsertNavigationItem, MediaAsset, NavigationItem } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navigation, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { NavigationForm } from "./navigation/NavigationForm";
// Import the new smaller components
import { NavigationItemList } from "./navigation/NavigationItemList";

interface NavigationItemWithMedia extends NavigationItem {
  mediaIcon?: MediaAsset;
}

export function NavigationManagement() {
  const [editingItem, setEditingItem] = useLocalStorage<NavigationItem | null>(
    "admin_nav_editing_item",
    null,
  );
  const [showCreateDialog, setShowCreateDialog] = useLocalStorage<boolean>(
    "admin_nav_show_create",
    false,
  );
  const [showEditDialog, setShowEditDialog] = useLocalStorage<boolean>(
    "admin_nav_show_edit",
    false,
  );
  const { toast } = useToast();

  const { data: navigationItems = [], isLoading } = useQuery<NavigationItem[]>({
    queryKey: ["/api/navigation-items"],
  });

  const { data: mediaResponse } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[]; pagination: unknown };
  }>({
    queryKey: MediaQueryKeys.list,
  });

  const mediaAssets = mediaResponse?.data?.data || [];

  // Combine navigation items with their media assets
  const itemsWithMedia: NavigationItemWithMedia[] = navigationItems
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item) => {
      if (item.iconType === "media" && item.mediaIconId) {
        const mediaIcon = mediaAssets.find((asset) => asset.id === item.mediaIconId);
        return { ...item, ...(mediaIcon ? { mediaIcon } : {}) };
      }
      return item;
    });

  const createMutation = useMutation({
    mutationFn: (data: InsertNavigationItem) =>
      apiRequest("/api/admin/navigation-items", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/navigation-items"],
      });
      setShowCreateDialog(false);
      toast({ title: "Navigation item created successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to create navigation item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertNavigationItem> }) =>
      apiRequest(`/api/admin/navigation-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/navigation-items"],
      });
      setShowEditDialog(false);
      setEditingItem(null);
      toast({ title: "Navigation item updated successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to update navigation item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/navigation-items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/navigation-items"],
      });
      toast({ title: "Navigation item deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete navigation item",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) =>
      apiRequest("/api/admin/navigation-items/reorder", {
        method: "PATCH",
        body: JSON.stringify({ items }),
      }),
    onSuccess: async () => {
      // Immediate refetch for navigation items after reorder mutation
      await getQueryClient().invalidateQueries({
        queryKey: ["/api/navigation-items"],
      });
      toast({ title: "Navigation items reordered successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to reorder navigation items",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this navigation item?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
          <p className="text-[#68869A] text-sm font-bold tracking-wider uppercase">
            Loading navigation items...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Navigation className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">Navigation Ecosystem</h1>
            <p className="text-[#68869A] text-sm">
              Manage your floating dock navigation items and appearance
            </p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95 transition-all outline-none border-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Navigation Item
            </Button>
          </DialogTrigger>
          <DialogContent contentType="form">
            <DialogHeader>
              <DialogTitle>Create Navigation Item</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <NavigationForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="mb-4">
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Navigation className="h-5 w-5 text-blue-400" />
                Active Items ({itemsWithMedia.length})
              </CardTitle>
              <CardDescription className="text-[#68869A]">
                Drag and drop to reorder items. Active items appear in the floating dock navigation.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <NavigationItemList
          items={itemsWithMedia}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={(reorderData) => reorderMutation.mutate(reorderData)}
        />

        {itemsWithMedia.length === 0 && (
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-12 text-center flex flex-col items-center justify-center border-dashed">
            <div className="size-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
              <Navigation className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="mb-2 font-bold text-white text-xl tracking-tight">
              No navigation items
            </h3>
            <p className="mb-8 text-[#68869A] max-w-md">
              Get started by creating your first navigation item to shape the user journey.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95 transition-all outline-none border-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Navigation Item
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>Edit Navigation Item</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {editingItem && (
              <NavigationForm
                item={editingItem}
                onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, data })}
                onCancel={() => {
                  setShowEditDialog(false);
                  setEditingItem(null);
                }}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
