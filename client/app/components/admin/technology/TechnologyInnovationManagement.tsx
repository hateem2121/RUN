/**
 * PHASE 3: TECHNOLOGY MODERNIZATION
 *
 * Extracted Innovation Management Component - Third Module
 * Original: technology-management.tsx (509 lines total across multiple sections)
 *
 * SAFETY MEASURES:
 * - Feature flag controlled (useModularTechnologyComponents)
 * - Maintains exact API compatibility
 * - Preserves all CRUD operations and drag-and-drop functionality
 * - Zero functional changes - pure extraction
 */

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MediaAsset, TechnologyInnovation } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Edit, GripVertical, Plus, X } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface InnovationFormData {
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  iconName: string;
  status: string;
  technicalDetails: Record<string, any>;
  relatedProducts: string[];
  benefits: string[];
  developmentYear: string;
  imageId: number | null;
  isActive: boolean;
}

interface SortableInnovationItemProps {
  innovation: TechnologyInnovation;
  onEdit: (innovation: TechnologyInnovation) => void;
  onDelete: (id: number) => void;
}

function SortableInnovationItem({ innovation, onEdit, onDelete }: SortableInnovationItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: innovation.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="admin-sortable-card">
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-move text-muted-foreground/70 hover:text-muted-foreground"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{innovation.name}</h4>
            <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 text-xs">
              {innovation.category}
            </span>
            {innovation.description && (
              <p className="mt-2 text-muted-foreground text-sm">{innovation.description}</p>
            )}
            {innovation.benefits && innovation.benefits.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-muted-foreground text-xs">Benefits:</p>
                <ul className="list-inside list-disc text-muted-foreground text-xs">
                  {innovation.benefits.slice(0, 2).map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                  {innovation.benefits.length > 2 && (
                    <li className="text-muted-foreground">
                      +{innovation.benefits.length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-start gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              innovation.isActive ? "bg-purple-100 text-purple-700" : "bg-muted text-foreground/80"
            }`}
          >
            {innovation.isActive ? "Active" : "Inactive"}
          </span>
          <Button size="sm" variant="ghost" onClick={() => onEdit(innovation)}>
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(innovation.id)}
            title="Delete Innovation"
            description="Are you sure you want to delete this innovation? This action cannot be undone."
          />
        </div>
      </div>
    </div>
  );
}

interface TechnologyInnovationManagementProps {
  isLoading?: boolean | undefined;
}

export function TechnologyInnovationManagement({
  isLoading = false,
}: TechnologyInnovationManagementProps) {
  const { toast } = useToast();

  // Innovation categories
  const innovationCategories = [
    "Fabric Technology",
    "Manufacturing Process",
    "Design Innovation",
    "Sustainability",
    "Digital Technology",
    "Material Science",
    "Quality Control",
    "Automation",
  ];

  // Form state management
  const [editingInnovation, setEditingInnovation] = useState<TechnologyInnovation | null>(null);
  const [showInnovationDialog, setShowInnovationDialog] = useState(false);
  const [innovationForm, setInnovationForm] = useState<InnovationFormData>({
    name: "",
    category: "Fabric Technology",
    description: "",
    shortDescription: "",
    iconName: "",
    status: "Active",
    technicalDetails: {},
    relatedProducts: [],
    benefits: [],
    developmentYear: "",
    imageId: null,
    isActive: true,
  });

  // Dynamic form fields state
  const [showInnovationImagePicker, setShowInnovationImagePicker] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");
  const [newRelatedProduct, setNewRelatedProduct] = useState("");
  const [newTechDetailKey, setNewTechDetailKey] = useState("");
  const [newTechDetailValue, setNewTechDetailValue] = useState("");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Innovation data query
  const { data: innovations = [], isPending: innovationsLoading } = useQuery<
    TechnologyInnovation[]
  >({
    queryKey: ["/api/technology-innovations"],
  });

  // Innovation mutations
  const createInnovationMutation = useMutation({
    mutationFn: (data: InnovationFormData) =>
      apiRequest("/api/technology-innovations", {
        method: "POST",
        body: {
          ...data,
          position: innovations.length,
        },
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-innovations"],
      });
      setShowInnovationDialog(false);
      setEditingInnovation(null);
      setInnovationForm({
        name: "",
        category: "Fabric Technology",
        description: "",
        shortDescription: "",
        iconName: "",
        status: "Active",
        technicalDetails: {},
        relatedProducts: [],
        benefits: [],
        developmentYear: "",
        imageId: null,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Innovation created successfully",
      });
    },
  });

  const updateInnovationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InnovationFormData> }) =>
      apiRequest(`/api/technology-innovations/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-innovations"],
      });
      setShowInnovationDialog(false);
      setEditingInnovation(null);
      toast({
        title: "Success",
        description: "Innovation updated successfully",
      });
    },
  });

  const deleteInnovationMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/technology-innovations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-innovations"],
      });
      toast({
        title: "Success",
        description: "Innovation deleted successfully",
      });
    },
  });

  const reorderInnovationsMutation = useMutation({
    mutationFn: (innovations: { id: number; position: number }[]) =>
      apiRequest("/api/technology-innovations/reorder", {
        method: "PATCH",
        body: { innovations },
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-innovations"],
      });
    },
  });

  // Event handlers
  const handleInnovationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInnovation) {
      updateInnovationMutation.mutate({
        id: editingInnovation.id,
        data: innovationForm,
      });
    } else {
      createInnovationMutation.mutate(innovationForm);
    }
  };

  const handleEditInnovation = (innovation: TechnologyInnovation) => {
    setEditingInnovation(innovation);
    setInnovationForm({
      name: innovation.name,
      category: innovation.category || "Fabric Technology",
      description: innovation.description || "",
      shortDescription: innovation.shortDescription || "",
      iconName: innovation.iconName || "",
      status: innovation.status || "Active",
      technicalDetails: innovation.technicalDetails || {},
      relatedProducts: innovation.relatedProducts || [],
      benefits: innovation.benefits || [],
      developmentYear: innovation.developmentYear || "",
      imageId: innovation.imageId || null,
      isActive: innovation.isActive ?? true,
    });
    setShowInnovationDialog(true);
  };

  const handleInnovationDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = innovations.findIndex((i) => i.id === active.id);
      const newIndex = innovations.findIndex((i) => i.id === over.id);
      const newInnovations = arrayMove(innovations, oldIndex, newIndex);
      const updates = newInnovations.map((innovation, index) => ({
        id: innovation.id,
        position: index,
      }));
      reorderInnovationsMutation.mutate(updates);
    }
  };

  const handleAddBenefit = () => {
    if (newBenefit) {
      setInnovationForm({
        ...innovationForm,
        benefits: [...innovationForm.benefits, newBenefit],
      });
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setInnovationForm({
      ...innovationForm,
      benefits: innovationForm.benefits.filter((_, i) => i !== index),
    });
  };

  const handleAddRelatedProduct = () => {
    if (newRelatedProduct) {
      setInnovationForm({
        ...innovationForm,
        relatedProducts: [...innovationForm.relatedProducts, newRelatedProduct],
      });
      setNewRelatedProduct("");
    }
  };

  const handleRemoveRelatedProduct = (index: number) => {
    setInnovationForm({
      ...innovationForm,
      relatedProducts: innovationForm.relatedProducts.filter((_, i) => i !== index),
    });
  };

  const handleAddTechDetail = () => {
    if (newTechDetailKey && newTechDetailValue) {
      setInnovationForm({
        ...innovationForm,
        technicalDetails: {
          ...innovationForm.technicalDetails,
          [newTechDetailKey]: newTechDetailValue,
        },
      });
      setNewTechDetailKey("");
      setNewTechDetailValue("");
    }
  };

  const handleRemoveTechDetail = (key: string) => {
    const { [key]: _, ...rest } = innovationForm.technicalDetails;
    setInnovationForm({
      ...innovationForm,
      technicalDetails: rest,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Technology Innovations</CardTitle>
              <CardDescription>
                Showcase your technological innovations and breakthroughs
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingInnovation(null);
                setInnovationForm({
                  name: "",
                  category: "Fabric Technology",
                  description: "",
                  shortDescription: "",
                  iconName: "",
                  status: "Active",
                  technicalDetails: {},
                  relatedProducts: [],
                  benefits: [],
                  developmentYear: "",
                  imageId: null,
                  isActive: true,
                });
                setShowInnovationDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Innovation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {innovationsLoading || isLoading ? (
            <div>Loading...</div>
          ) : innovations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No innovations added yet. Click "Add Innovation" to showcase your first technology
              innovation.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleInnovationDragEnd}
            >
              <SortableContext
                items={innovations.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {innovations.map((innovation) => (
                  <SortableInnovationItem
                    key={innovation.id}
                    innovation={innovation}
                    onEdit={handleEditInnovation}
                    onDelete={(id) => deleteInnovationMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Innovation Dialog */}
      <Dialog open={showInnovationDialog} onOpenChange={setShowInnovationDialog}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>
              {editingInnovation ? "Edit Innovation" : "Add New Innovation"}
            </DialogTitle>
            <DialogDescription>
              {editingInnovation
                ? "Update the technology innovation details"
                : "Create a new technology innovation"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInnovationSubmit} className="contents">
            <DialogBody className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={innovationForm.name}
                  onChange={(e) =>
                    setInnovationForm({
                      ...innovationForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Smart Fabric Technology"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={innovationForm.category}
                  onValueChange={(value) =>
                    setInnovationForm({ ...innovationForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {innovationCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Development Year Section */}
              <div>
                <Label htmlFor="developmentYear">Development Year</Label>
                <Input
                  id="developmentYear"
                  value={innovationForm.developmentYear}
                  onChange={(e) =>
                    setInnovationForm({
                      ...innovationForm,
                      developmentYear: e.target.value,
                    })
                  }
                  placeholder="e.g., 2024"
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  value={innovationForm.shortDescription}
                  onChange={(e) =>
                    setInnovationForm({
                      ...innovationForm,
                      shortDescription: e.target.value,
                    })
                  }
                  placeholder="Brief summary for cards"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="iconName">Icon Name</Label>
                  <Input
                    id="iconName"
                    value={innovationForm.iconName}
                    onChange={(e) =>
                      setInnovationForm({
                        ...innovationForm,
                        iconName: e.target.value,
                      })
                    }
                    placeholder="e.g., Zap, Shield"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={innovationForm.status}
                    onValueChange={(value) =>
                      setInnovationForm({ ...innovationForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="In Development">In Development</SelectItem>
                      <SelectItem value="Deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={innovationForm.description}
                  onChange={(e) =>
                    setInnovationForm({
                      ...innovationForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the innovation"
                  rows={3}
                />
              </div>

              {/* Technical Details Section */}
              <div>
                <Label>Technical Details</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Input
                    value={newTechDetailKey}
                    onChange={(e) => setNewTechDetailKey(e.target.value)}
                    placeholder="Key (e.g., Weight)"
                  />
                  <Input
                    value={newTechDetailValue}
                    onChange={(e) => setNewTechDetailValue(e.target.value)}
                    placeholder="Value (e.g., 150gsm)"
                  />
                  <Button type="button" onClick={handleAddTechDetail}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {Object.keys(innovationForm.technicalDetails).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(innovationForm.technicalDetails).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded bg-background p-2"
                      >
                        <span className="text-sm">
                          <strong>{key}:</strong> {String(value)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTechDetail(key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Products Section */}
              <div>
                <Label>Related Products</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newRelatedProduct}
                    onChange={(e) => setNewRelatedProduct(e.target.value)}
                    placeholder="Enter product name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRelatedProduct();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddRelatedProduct}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {innovationForm.relatedProducts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {innovationForm.relatedProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-blue-700 text-sm"
                      >
                        {product}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-blue-200"
                          onClick={() => handleRemoveRelatedProduct(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Benefits Section */}
              <div>
                <Label>Benefits</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Enter benefit"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddBenefit}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {innovationForm.benefits.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {innovationForm.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-green-700 text-sm"
                      >
                        {benefit}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-green-200"
                          onClick={() => handleRemoveBenefit(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Selection */}
              <div>
                <Label>Innovation Image</Label>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInnovationImagePicker(true)}
                  >
                    Select Image
                  </Button>
                  {innovationForm.imageId && (
                    <div className="mt-2 text-muted-foreground text-sm">
                      Selected image ID: {innovationForm.imageId}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="ml-2 text-red-600"
                        onClick={() =>
                          setInnovationForm({
                            ...innovationForm,
                            imageId: null,
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={innovationForm.isActive}
                  onCheckedChange={(checked) =>
                    setInnovationForm({ ...innovationForm, isActive: checked })
                  }
                />
                <Label>Active (visible on public site)</Label>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInnovationDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInnovationMutation.isPending || updateInnovationMutation.isPending}
              >
                {createInnovationMutation.isPending || updateInnovationMutation.isPending
                  ? "Saving..."
                  : editingInnovation
                    ? "Update Innovation"
                    : "Create Innovation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Innovation Image Picker Dialog - STANDARDIZED */}
      <StandardMediaSelectionDialog
        isOpen={showInnovationImagePicker}
        onClose={() => setShowInnovationImagePicker(false)}
        onSelect={(assets: MediaAsset | MediaAsset[]) => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) {
            setInnovationForm({ ...innovationForm, imageId: asset.id });
          }
        }}
        title="Select Innovation Image"
        mediaPickerTarget="innovation-image"
        selectionMode="single"
      />
    </>
  );
}
