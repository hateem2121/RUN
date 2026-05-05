import type { Accessory, InsertAccessory, MediaAsset } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Edit,
  Eye,
  Image,
  Layers,
  type LucideIcon,
  Package,
  Palette,
  Plus,
  Scissors,
  Settings,
  Tags,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCacheInvalidationListener } from "@/hooks/useCacheInvalidation";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

const getCategoryIcon = (category: string) => {
  const icons: Record<string, LucideIcon> = {
    customization: Palette,
    hardware: Wrench,
    finishing: Scissors,
    trim: Layers,
    packaging: Package,
  };
  const IconComponent = icons[category] || Tags;
  return <IconComponent className="h-4 w-4" />;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    customization: "bg-purple-100 text-purple-700 border-purple-200",
    hardware: "bg-blue-100 text-blue-700 border-blue-200",
    finishing: "bg-green-100 text-green-700 border-green-200",
    trim: "bg-orange-100 text-orange-700 border-orange-200",
    packaging: "bg-white/[0.05] text-white/80 border-white/10",
  };
  return colors[category] || "bg-neutral-100 text-neutral-700 border-neutral-200";
};

interface AccessoryListProps {
  isLoading: boolean;
  activeAccessories: Accessory[];
  allMediaAssets: MediaAsset[] | undefined;
  onPreview: (accessory: Accessory) => void;
  onEdit: (accessory: Accessory) => void;
  onDelete: (id: number) => void;
}

const AccessoryList = ({
  isLoading,
  activeAccessories,
  allMediaAssets,
  onPreview,
  onEdit,
  onDelete,
}: AccessoryListProps) => {
  const getMediaAsset = (id: number): MediaAsset | undefined => {
    return allMediaAssets?.find((asset) => asset.id === id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-24 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (!activeAccessories || activeAccessories.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">
        <Package className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
        <p className="font-medium">No accessories created yet</p>
        <p className="text-sm">Create your first accessory to get started</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 space-y-4 overflow-y-auto">
      {activeAccessories.map((accessory) => (
        <div
          key={accessory.id}
          data-testid="accessory-card"
          className="glass-premium group rounded-lg border border-white/10 p-4 transition-all duration-200 hover:border-purple-400/50"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="truncate font-medium text-white">{accessory.name}</h4>
                {!accessory.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="mb-2 flex flex-wrap gap-2">
                {accessory.category && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 text-xs ${getCategoryColor(accessory.category)}`}
                  >
                    {getCategoryIcon(accessory.category)}
                    {accessory.category.charAt(0).toUpperCase() + accessory.category.slice(1)}
                  </Badge>
                )}
              </div>

              {accessory.description && (
                <p className="mb-2 line-clamp-2 text-sm text-admin-muted">{accessory.description}</p>
              )}

              {/* Media Preview */}
              {accessory.imageId && (
                <div className="mb-2">
                  <div className="mb-1 flex gap-1">
                    {(() => {
                      const asset = getMediaAsset(accessory.imageId);
                      return (
                        <div className="relative h-8 w-8 overflow-hidden rounded border border-neutral-200">
                          {asset ? (
                            <img
                              src={
                                asset.id && asset.id < 1000000000000
                                  ? `/api/media/${asset.id}/content`
                                  : undefined
                              }
                              alt={asset.originalName || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                              <Image className="h-3 w-3 text-neutral-400" />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-neutral-500 text-xs">1 image</p>
                </div>
              )}

              {accessory.specifications && Object.keys(accessory.specifications).length > 0 && (
                <div className="mb-2">
                  <p className="mb-1 text-neutral-500 text-xs">Specifications:</p>
                  <div className="space-y-1">
                    {Object.entries(accessory.specifications)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded bg-neutral-50 px-2 py-1 text-neutral-700 text-xs"
                        >
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    {Object.keys(accessory.specifications).length > 2 && (
                      <div className="text-neutral-500 text-xs">
                        +{Object.keys(accessory.specifications).length - 2} more specifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreview(accessory)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Eye className="mr-1 h-3 w-3" />
                Preview
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(accessory)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </div>
            <DeleteConfirmationDialog
              onConfirm={() => onDelete(accessory.id)}
              title="Delete Accessory"
              description={`Are you sure you want to delete "${accessory.name}"? This action cannot be undone and may affect products using this accessory.`}
              triggerClassName="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export function AccessoryManagementEnhanced() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    isActive: true,
    imageId: undefined as number | undefined,
  });

  // Specifications as key-value pairs
  const [specifications, setSpecifications] = useState<
    { id: string; key: string; value: string }[]
  >([]);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [previewAccessory, setPreviewAccessory] = useState<Accessory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const { toast } = useToast();

  // EVENT-DRIVEN: Listen for backend cache invalidation events
  useCacheInvalidationListener("accessories");

  // Fetch accessories with stale-while-revalidate pattern
  const { data: accessories, isPending: isLoading } = useQuery<Accessory[]>({
    queryKey: ["/api/accessories"],
    staleTime: 2 * 60 * 1000, // 2 minutes - serve cached data for fast UX
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for offline resilience
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: true, // Update when user returns to page
  });

  // Client-side safety: Filter out deleted accessories
  const activeAccessories = useMemo(() => {
    return accessories?.filter((acc) => !acc.deletedAt && acc.isActive) || [];
  }, [accessories]);

  // Load media assets for display
  const { data: allMediaAssets } = useQuery<{ data: MediaAsset[] }, Error, MediaAsset[]>({
    queryKey: MediaQueryKeys.list,
    queryFn: async () => {
      const response = await fetch("/api/media");
      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }
      return response.json();
    },
    select: (data) => data?.data || [],
  });

  // Media handling functions
  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (!asset) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      imageId: asset.id,
    }));
  };

  const handleRemoveMedia = () => {
    setFormData((prev) => ({
      ...prev,
      imageId: undefined,
    }));
  };

  const getMediaAsset = (id: number): MediaAsset | undefined => {
    return allMediaAssets?.find((asset) => asset.id === id);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      isActive: true,
      imageId: undefined,
    });
    setSpecifications([]);
    setEditingAccessory(null);
  };

  const createAccessoryMutation = useMutation({
    mutationFn: async (data: InsertAccessory) => {
      return await apiRequest("/api/accessories", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({
        title: "Success",
        description: "Accessory created successfully",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create accessory",
        variant: "destructive",
      });
    },
  });

  const updateAccessoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAccessory> }) => {
      return await apiRequest(`/api/accessories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({
        title: "Success",
        description: "Accessory updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingAccessory(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update accessory",
        variant: "destructive",
      });
    },
  });

  const deleteAccessoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/accessories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({
        title: "Success",
        description: "Accessory deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete accessory",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert specifications array to object
    const specificationsObject = specifications.reduce(
      (acc, spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          acc[spec.key.trim()] = spec.value.trim();
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const submitData = {
      ...formData,
      specifications: specificationsObject,
    };

    if (editingAccessory) {
      updateAccessoryMutation.mutate({
        id: editingAccessory.id,
        data: submitData,
      });
    } else {
      createAccessoryMutation.mutate(submitData);
    }
  };

  const handleEdit = (accessory: Accessory) => {
    setEditingAccessory(accessory);
    setFormData({
      name: accessory.name,
      category: accessory.category || "",
      description: accessory.description || "",
      isActive: Boolean(accessory.isActive),
      imageId: accessory.imageId || undefined,
    });

    // Convert specifications object to array of key-value pairs
    const specsArray =
      accessory.specifications && typeof accessory.specifications === "object"
        ? Object.entries(accessory.specifications).map(([key, value]) => ({
            id: Math.random().toString(36).substring(7),
            key,
            value: String(value),
          }))
        : [];
    setSpecifications(specsArray);

    setIsEditDialogOpen(true);
  };

  const handlePreview = (accessory: Accessory) => {
    setPreviewAccessory(accessory);
    setIsPreviewDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteAccessoryMutation.mutate(id);
  };

  const addSpecification = () => {
    setSpecifications((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(7), key: "", value: "" },
    ]);
  };

  const removeSpecification = (id: string) => {
    setSpecifications((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSpecification = (id: string, field: "key" | "value", value: string) => {
    setSpecifications((prev) =>
      prev.map((spec) => (spec.id === id ? { ...spec, [field]: value } : spec)),
    );
  };

  // Removed predefined types, categories, and quick add functionality
  // Admin can now create custom categories and types

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold font-neue-stance text-3xl text-white">
            Accessory & Customization Management
          </h1>
          <p className="mt-2 text-admin-muted">
            Manage printing services, hardware, finishing touches, and packaging options
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Accessory Form */}
        <div className="xl:col-span-2">
          <Card className="glass-premium border-white/10">
            <CardHeader className="border-b border-white/10 bg-white/[0.02]">
              <CardTitle className="flex items-center gap-2 font-neue-stance text-white">
                <Settings className="h-5 w-5 text-purple-400" />
                {editingAccessory ? "Edit Accessory" : "Create New Accessory"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter accessory or service name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      placeholder="Enter category (e.g., Hardware, Finishing, Customization)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter description for this accessory"
                    rows={3}
                  />
                </div>

                {/* Specifications */}
                <div className="border-t pt-4">
                  <div className="mb-4 flex items-center justify-between">
                    <Label className="font-medium text-base">Specifications</Label>
                    <Button type="button" onClick={addSpecification} variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Specification
                    </Button>
                  </div>

                  {/* Specifications Key-Value Inputs */}
                  {specifications.length > 0 && (
                    <div className="space-y-3">
                      {specifications.map((spec) => (
                        <div
                          key={spec.id}
                          className="grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-3 md:grid-cols-2"
                        >
                          <div>
                            <Input
                              placeholder="Key (e.g., Print Area)"
                              value={spec.key}
                              onChange={(e) => updateSpecification(spec.id, "key", e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Value (e.g., All-over garment coverage)"
                              value={spec.value}
                              onChange={(e) =>
                                updateSpecification(spec.id, "value", e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Remove specification"
                              onClick={() => removeSpecification(spec.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {specifications.length === 0 && (
                    <p className="text-neutral-500 text-sm italic">
                      No specifications added yet. Click "Add Specification" to add key-value pairs.
                    </p>
                  )}
                </div>

                {/* Media Selection Section */}
                <div className="border-t pt-4">
                  <Label className="mb-4 block font-medium text-base">Media Image</Label>
                  <div className="space-y-4">
                    {/* Selected Media Display */}
                    {formData.imageId && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-neutral-700 text-sm">Selected Image</h4>
                        <div className="group relative w-32">
                          <div className="relative overflow-hidden rounded-lg border-2 border-neutral-200">
                            {(() => {
                              const asset = getMediaAsset(formData.imageId);
                              return asset ? (
                                <img
                                  src={
                                    asset.id && asset.id < 1000000000000
                                      ? `/api/media/${asset.id}/content`
                                      : undefined
                                  }
                                  alt={asset.originalName || ""}
                                  className="h-20 w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-20 w-full items-center justify-center bg-neutral-100">
                                  <Image className="h-6 w-6 text-neutral-400" />
                                </div>
                              );
                            })()}
                          </div>
                          <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 bg-white/90 p-0 text-red-600 hover:text-red-700"
                              onClick={handleRemoveMedia}
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Media Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="h-12 w-full border-2 border-dashed hover:border-blue-500 hover:bg-blue-50/50"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      {formData.imageId ? "Change Image" : "Select Image"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: Boolean(checked),
                      }))
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex justify-end space-x-4 border-t pt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createAccessoryMutation.isPending || updateAccessoryMutation.isPending
                    }
                  >
                    {(() => {
                      if (createAccessoryMutation.isPending || updateAccessoryMutation.isPending) {
                        return editingAccessory ? "Updating..." : "Creating...";
                      }
                      return editingAccessory ? "Update Accessory" : "Create Accessory";
                    })()}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Accessories List */}
        <div>
          <Card className="glass-premium border-white/10">
            <CardHeader className="border-b border-white/10 bg-white/[0.02]">
              <CardTitle className="flex items-center gap-2 font-neue-stance text-white">
                <Package className="h-5 w-5 text-orange-400" />
                Accessories ({activeAccessories?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AccessoryList
                isLoading={isLoading}
                activeAccessories={activeAccessories}
                allMediaAssets={allMediaAssets}
                onPreview={handlePreview}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent contentType="default">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Accessory Details: {previewAccessory?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewAccessory && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {previewAccessory.category && (
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${getCategoryColor(previewAccessory.category)}`}
                    >
                      {getCategoryIcon(previewAccessory.category)}
                      {previewAccessory.category.charAt(0).toUpperCase() +
                        previewAccessory.category.slice(1)}
                    </Badge>
                  )}
                  <Badge variant={previewAccessory.isActive ? "default" : "secondary"}>
                    {previewAccessory.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {previewAccessory.description && (
                  <div>
                    <h4 className="mb-2 font-medium">Description</h4>
                    <p className="text-neutral-600">{previewAccessory.description}</p>
                  </div>
                )}

                {previewAccessory.specifications &&
                  Object.keys(previewAccessory.specifications).length > 0 && (
                    <div>
                      <h4 className="mb-3 font-medium">Specifications</h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {Object.entries(previewAccessory.specifications).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between rounded-lg bg-neutral-50 p-3"
                          >
                            <span className="font-medium text-neutral-700">{key}:</span>
                            <span className="text-neutral-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {previewAccessory.imageId && (
                  <div>
                    <h4 className="mb-3 font-medium">Image</h4>
                    <div className="relative w-32">
                      <div className="relative overflow-hidden rounded-lg border-2 border-neutral-200">
                        {(() => {
                          const asset = getMediaAsset(previewAccessory.imageId);
                          return asset ? (
                            <img
                              src={
                                asset.id && asset.id < 1000000000000
                                  ? `/api/media/${asset.id}/content`
                                  : undefined
                              }
                              alt={asset.originalName || ""}
                              className="h-24 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-24 w-full items-center justify-center bg-neutral-100">
                              <Image className="h-6 w-6 text-neutral-400" />
                            </div>
                          );
                        })()}
                      </div>
                      {(() => {
                        const asset = getMediaAsset(previewAccessory.imageId);
                        return (
                          asset && (
                            <p className="mt-1 truncate text-neutral-600 text-xs">
                              {asset.originalName}
                            </p>
                          )
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Accessory: {editingAccessory?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-viewport-70 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter accessory or service name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="Enter category"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter description for this accessory"
                  rows={3}
                />
              </div>

              {/* Specifications in Edit Dialog */}
              <div className="border-t pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="font-medium text-base">Specifications</Label>
                  <Button type="button" onClick={addSpecification} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Specification
                  </Button>
                </div>

                {/* Specifications Key-Value Inputs */}
                {specifications.length > 0 && (
                  <div className="space-y-3">
                    {specifications.map((spec) => (
                      <div
                        key={spec.id}
                        className="grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-3 md:grid-cols-2"
                      >
                        <div>
                          <Input
                            placeholder="Key (e.g., Print Area)"
                            value={spec.key}
                            onChange={(e) => updateSpecification(spec.id, "key", e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Value (e.g., All-over garment coverage)"
                            value={spec.value}
                            onChange={(e) => updateSpecification(spec.id, "value", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpecification(spec.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {specifications.length === 0 && (
                  <p className="text-neutral-500 text-sm italic">
                    No specifications added yet. Click "Add Specification" to add key-value pairs.
                  </p>
                )}
              </div>

              {/* Media Section in Edit Dialog */}
              <div className="border-t pt-4">
                <Label className="mb-4 block font-medium text-base">Media Image</Label>
                <div className="space-y-4">
                  {formData.imageId && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-neutral-700 text-sm">Selected Image</h4>
                      <div className="group relative w-32">
                        <div className="relative overflow-hidden rounded-lg border-2 border-neutral-200">
                          {(() => {
                            const asset = getMediaAsset(formData.imageId);
                            return asset ? (
                              <img
                                src={
                                  asset.id && asset.id < 1000000000000
                                    ? `/api/media/${asset.id}/content`
                                    : undefined
                                }
                                alt={asset.originalName || ""}
                                className="h-20 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-20 w-full items-center justify-center bg-neutral-100">
                                <Image className="h-6 w-6 text-neutral-400" />
                              </div>
                            );
                          })()}
                        </div>
                        <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 bg-white/90 p-0 text-red-600 hover:text-red-700"
                            onClick={handleRemoveMedia}
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="h-12 w-full border-2 border-dashed hover:border-blue-500 hover:bg-blue-50/50"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {formData.imageId ? "Change Image" : "Select Image"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: Boolean(checked),
                    }))
                  }
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>

              <div className="flex justify-end space-x-4 border-t pt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAccessoryMutation.isPending}>
                  {updateAccessoryMutation.isPending ? "Updating..." : "Update Accessory"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Media for Accessory"
        mediaPickerTarget="accessory-management"
        selectionMode="single"
      />
    </div>
  );
}
