import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EnhancedDialog, EnhancedDialogContent, EnhancedDialogHeader, EnhancedDialogTitle } from "@/components/ui/enhanced-dialog";
import { useToast } from "@/hooks/use-toast";
import { getQueryClient, apiRequest } from "@/lib/queryClient";
import { StandardMediaSelectionDialog } from '@/components/admin/shared/StandardMediaSelectionDialog';
import { DeleteConfirmationDialog } from '@/components/admin/shared/DeleteConfirmationDialog';
import { MediaQueryKeys } from '@/lib/media-query-keys';
import { useCacheInvalidationListener } from "@/hooks/useCacheInvalidation";
import { 
  Edit, 
  Eye, 
  Settings, 
  Palette, 
  Wrench, 
  Scissors, 
  Package, 
  Tags,
  Plus,
  X,
  Layers,
  Image
} from "lucide-react";
import type { Accessory, MediaAsset } from "@shared/schema";


const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
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
    packaging: "bg-gray-100 text-gray-700 border-gray-200",
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

const AccessoryList = ({ isLoading, activeAccessories, allMediaAssets, onPreview, onEdit, onDelete }: AccessoryListProps) => {
  const getMediaAsset = (id: number): MediaAsset | undefined => {
    return allMediaAssets?.find(asset => asset.id === id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-24 bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!activeAccessories || activeAccessories.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <Package className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
        <p className="font-medium">No accessories created yet</p>
        <p className="text-sm">Create your first accessory to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activeAccessories.map((accessory) => (
        <div key={accessory.id} className="group p-4 border border-neutral-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-neutral-900 truncate">{accessory.name}</h4>
                {!accessory.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {accessory.category && (
                  <Badge variant="outline" className={`text-xs flex items-center gap-1 ${getCategoryColor(accessory.category)}`}>
                    {getCategoryIcon(accessory.category)}
                    {accessory.category.charAt(0).toUpperCase() + accessory.category.slice(1)}
                  </Badge>
                )}
              </div>
              
              {accessory.description && (
                <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{accessory.description}</p>
              )}
              
              {/* Media Preview */}
              {accessory.imageId && (
                <div className="mb-2">
                  <div className="flex gap-1 mb-1">
                    {(() => {
                      const asset = getMediaAsset(accessory.imageId);
                      return (
                        <div className="relative w-8 h-8 rounded border border-neutral-200 overflow-hidden">
                          {asset ? (
                            <img
                              src={asset.id && asset.id < 1000000000000 ? `/api/media/${asset.id}/content` : undefined}
                              alt={asset.originalName || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                              <Image className="h-3 w-3 text-neutral-400" />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-neutral-500">1 image</p>
                </div>
              )}
              
              {accessory.specifications && Object.keys(accessory.specifications).length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-neutral-500 mb-1">Specifications:</p>
                  <div className="space-y-1">
                    {Object.entries(accessory.specifications).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="text-xs text-neutral-700 bg-neutral-50 px-2 py-1 rounded">
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
                    {Object.keys(accessory.specifications).length > 2 && (
                      <div className="text-xs text-neutral-500">
                        +{Object.keys(accessory.specifications).length - 2} more specifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreview(accessory)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(accessory)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-3 w-3 mr-1" />
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

export default function AccessoryManagementEnhanced() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    isActive: true,
    imageId: undefined as number | undefined,
  });

  // Specifications as key-value pairs
  const [specifications, setSpecifications] = useState<{id: string, key: string, value: string}[]>([]);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [previewAccessory, setPreviewAccessory] = useState<Accessory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const { toast } = useToast();

  // EVENT-DRIVEN: Listen for backend cache invalidation events
  useCacheInvalidationListener('accessories');

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
    return accessories?.filter(acc => !acc.deletedAt && acc.isActive) || [];
  }, [accessories]);

  // Load media assets for display
  const { data: allMediaAssets } = useQuery<MediaAsset[]>({
    queryKey: MediaQueryKeys.list,
    queryFn: async () => {
      const response = await fetch('/api/media');
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    },
    select: (data: any) => data?.data || [],
  });

  // Media handling functions
  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (!asset) return;
    
    setFormData(prev => ({
      ...prev,
      imageId: asset.id,
    }));
  };

  const handleRemoveMedia = () => {
    setFormData(prev => ({
      ...prev,
      imageId: undefined,
    }));
  };

  const getMediaAsset = (id: number): MediaAsset | undefined => {
    return allMediaAssets?.find(asset => asset.id === id);
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
    mutationFn: async (data: any) => {
      return await apiRequest("/api/accessories", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create accessory",
        variant: "destructive",
      });
    },
  });

  const updateAccessoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/accessories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
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
    onError: (error: any) => {
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
        method: "DELETE"
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({
        title: "Success",
        description: "Accessory deleted successfully",
      });
    },
    onError: (error: any) => {
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
    const specificationsObject = specifications.reduce((acc, spec) => {
      if (spec.key.trim() && spec.value.trim()) {
        acc[spec.key.trim()] = spec.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);
    
    const submitData = {
      ...formData,
      specifications: specificationsObject
    };
    
    if (editingAccessory) {
      updateAccessoryMutation.mutate({ id: editingAccessory.id, data: submitData });
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
    const specsArray = accessory.specifications && typeof accessory.specifications === 'object'
      ? Object.entries(accessory.specifications).map(([key, value]) => ({ 
          id: Math.random().toString(36).substring(7),
          key, 
          value: String(value) 
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
    setSpecifications(prev => [...prev, { id: Math.random().toString(36).substring(7), key: "", value: "" }]);
  };

  const removeSpecification = (id: string) => {
    setSpecifications(prev => prev.filter(s => s.id !== id));
  };

  const updateSpecification = (id: string, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => prev.map(spec => 
      spec.id === id ? { ...spec, [field]: value } : spec
    ));
  };



  // Removed predefined types, categories, and quick add functionality
  // Admin can now create custom categories and types

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-neue-stance font-bold text-neutral-900">Accessory & Customization Management</h1>
          <p className="text-neutral-600 mt-2">Manage printing services, hardware, finishing touches, and packaging options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Accessory Form */}
        <div className="xl:col-span-2">
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="font-neue-stance flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                {editingAccessory ? "Edit Accessory" : "Create New Accessory"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter accessory or service name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Enter category (e.g., Hardware, Finishing, Customization)"
                    />
                  </div>
                </div>


                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description for this accessory"
                    rows={3}
                  />
                </div>

                {/* Specifications */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">Specifications</Label>
                    <Button
                      type="button"
                      onClick={addSpecification}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Specification
                    </Button>
                  </div>

                  {/* Specifications Key-Value Inputs */}
                  {specifications.length > 0 && (
                    <div className="space-y-3">
                      {specifications.map((spec) => (
                        <div key={spec.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg">
                          <div>
                            <Input
                              placeholder="Key (e.g., Print Area)"
                              value={spec.key}
                              onChange={(e) => updateSpecification(spec.id, 'key', e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Value (e.g., All-over garment coverage)"
                              value={spec.value}
                              onChange={(e) => updateSpecification(spec.id, 'value', e.target.value)}
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
                    <p className="text-sm text-neutral-500 italic">No specifications added yet. Click "Add Specification" to add key-value pairs.</p>
                  )}
                </div>



                {/* Media Selection Section */}
                <div className="pt-4 border-t">
                  <Label className="text-base font-medium mb-4 block">Media Image</Label>
                  <div className="space-y-4">
                    {/* Selected Media Display */}
                    {formData.imageId && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-neutral-700">Selected Image</h4>
                        <div className="relative group w-32">
                          <div className="relative border-2 rounded-lg overflow-hidden border-neutral-200">
                            {(() => {
                              const asset = getMediaAsset(formData.imageId);
                              return asset ? (
                                <img
                                  src={asset.id && asset.id < 1000000000000 ? `/api/media/${asset.id}/content` : undefined}
                                  alt={asset.originalName || ''}
                                  className="w-full h-20 object-cover"
                                />
                              ) : (
                                <div className="w-full h-20 bg-neutral-100 flex items-center justify-center">
                                  <Image className="h-6 w-6 text-neutral-400" />
                                </div>
                              );
                            })()} 
                          </div>
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 bg-white/90 text-red-600 hover:text-red-700"
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
                      className="w-full h-12 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50/50"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      {formData.imageId ? 'Change Image' : 'Select Image'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: Boolean(checked) }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAccessoryMutation.isPending || updateAccessoryMutation.isPending}>
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
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
              <CardTitle className="font-neue-stance flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
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
      <EnhancedDialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <EnhancedDialogContent contentType="default">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Accessory Details: {previewAccessory?.name}
            </EnhancedDialogTitle>
          </EnhancedDialogHeader>
          <div className="mt-4">
            {previewAccessory && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {previewAccessory.category && (
                    <Badge variant="outline" className={`flex items-center gap-1 ${getCategoryColor(previewAccessory.category)}`}>
                      {getCategoryIcon(previewAccessory.category)}
                      {previewAccessory.category.charAt(0).toUpperCase() + previewAccessory.category.slice(1)}
                    </Badge>
                  )}
                  <Badge variant={previewAccessory.isActive ? "default" : "secondary"}>
                    {previewAccessory.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                {previewAccessory.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-neutral-600">{previewAccessory.description}</p>
                  </div>
                )}
                
                {previewAccessory.specifications && Object.keys(previewAccessory.specifications).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(previewAccessory.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                          <span className="font-medium text-neutral-700">{key}:</span>
                          <span className="text-neutral-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {previewAccessory.imageId && (
                  <div>
                    <h4 className="font-medium mb-3">Image</h4>
                    <div className="relative w-32">
                      <div className="relative border-2 rounded-lg overflow-hidden border-neutral-200">
                        {(() => {
                          const asset = getMediaAsset(previewAccessory.imageId);
                          return asset ? (
                            <img
                              src={asset.id && asset.id < 1000000000000 ? `/api/media/${asset.id}/content` : undefined}
                              alt={asset.originalName || ''}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 bg-neutral-100 flex items-center justify-center">
                              <Image className="h-6 w-6 text-neutral-400" />
                            </div>
                          );
                        })()}
                      </div>
                      {(() => {
                        const asset = getMediaAsset(previewAccessory.imageId);
                        return asset && (
                          <p className="text-xs text-neutral-600 mt-1 truncate">{asset.originalName}</p>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </EnhancedDialogContent>
      </EnhancedDialog>

      {/* Edit Dialog */}
      <EnhancedDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <EnhancedDialogContent contentType="form">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Accessory: {editingAccessory?.name}
            </EnhancedDialogTitle>
          </EnhancedDialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter accessory or service name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                  />
                </div>
              </div>


              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description for this accessory"
                  rows={3}
                />
              </div>

              {/* Specifications in Edit Dialog */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Specifications</Label>
                  <Button
                    type="button"
                    onClick={addSpecification}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Specification
                  </Button>
                </div>

                {/* Specifications Key-Value Inputs */}
                {specifications.length > 0 && (
                  <div className="space-y-3">
                    {specifications.map((spec) => (
                      <div key={spec.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg">
                        <div>
                          <Input
                            placeholder="Key (e.g., Print Area)"
                            value={spec.key}
                            onChange={(e) => updateSpecification(spec.id, 'key', e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Value (e.g., All-over garment coverage)"
                            value={spec.value}
                            onChange={(e) => updateSpecification(spec.id, 'value', e.target.value)}
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
                  <p className="text-sm text-neutral-500 italic">No specifications added yet. Click "Add Specification" to add key-value pairs.</p>
                )}
              </div>

              {/* Media Section in Edit Dialog */}
              <div className="pt-4 border-t">
                <Label className="text-base font-medium mb-4 block">Media Image</Label>
                <div className="space-y-4">
                  {formData.imageId && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-neutral-700">Selected Image</h4>
                      <div className="relative group w-32">
                        <div className="relative border-2 rounded-lg overflow-hidden border-neutral-200">
                          {(() => {
                            const asset = getMediaAsset(formData.imageId);
                            return asset ? (
                              <img
                                src={asset.id && asset.id < 1000000000000 ? `/api/media/${asset.id}/content` : undefined}
                                alt={asset.originalName || ''}
                                className="w-full h-20 object-cover"
                              />
                            ) : (
                              <div className="w-full h-20 bg-neutral-100 flex items-center justify-center">
                                <Image className="h-6 w-6 text-neutral-400" />
                              </div>
                            );
                          })()}
                        </div>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 bg-white/90 text-red-600 hover:text-red-700"
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
                    className="w-full h-12 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50/50"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    {formData.imageId ? 'Change Image' : 'Select Image'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: Boolean(checked) }))}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAccessoryMutation.isPending}>
                  {updateAccessoryMutation.isPending ? "Updating..." : "Update Accessory"}
                </Button>
              </div>
            </form>
          </div>
        </EnhancedDialogContent>
      </EnhancedDialog>

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