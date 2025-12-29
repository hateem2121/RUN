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
import type { ManufacturingCapability, MediaAsset } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, EyeOff, GripVertical, Image, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { LivePreviewGrid } from "@/components/admin/manufacturing/LivePreviewGrid";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { CapabilityCard } from "@/components/shared/manufacturing/CapabilityCard";
import { Badge } from "@/components/ui/badge";
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
import { useManufacturingMutations } from "@/hooks/useManufacturingMutations";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";

interface Specification {
  label: string;
  value: string;
}

// Derive form data type from schema
type CapabilityFormData = Omit<
  ManufacturingCapability,
  "id" | "createdAt" | "updatedAt" | "sortOrder" | "unit" | "specifications"
> & {
  specifications: Specification[]; // Transformed from Record<string, any>
  equipment: string[];
  imageId: number | null;
  unit: string | null;
};

interface CapabilityManagementProps {
  mediaAssets: MediaAsset[];
}

const capabilityIcons = ["Factory", "Cog", "Award", "Shield", "Wrench", "CircuitBoard"];

function SortableCapabilityItem({
  capability,
  onEdit,
  onDelete,
}: {
  capability: ManufacturingCapability;
  onEdit: (capability: ManufacturingCapability) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: capability.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const specs = (capability.specifications as unknown as Specification[]) || [];

  return (
    <div ref={setNodeRef} style={style} className="admin-sortable-card">
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="text-muted-foreground/70 hover:text-muted-foreground mt-1 cursor-move"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-foreground font-medium">{capability.title || capability.name}</h4>
            {capability.description && (
              <p className="text-muted-foreground mt-2 text-sm">{capability.description}</p>
            )}
            {specs.length > 0 && (
              <div className="mt-2">
                <p className="text-muted-foreground text-xs font-medium">Specifications:</p>
                <div className="text-muted-foreground text-xs">
                  {specs
                    .slice(0, 2)
                    .map((spec: { label: string; value: string }, index: number) => (
                      <span key={index} className="mr-4 inline-block">
                        {spec.label}: {spec.value}
                      </span>
                    ))}
                  {specs.length > 2 && (
                    <span className="text-muted-foreground">+{specs.length - 2} more</span>
                  )}
                </div>
              </div>
            )}
            {capability.equipment && capability.equipment.length > 0 && (
              <div className="mt-2">
                <p className="text-muted-foreground text-xs font-medium">Equipment:</p>
                <div className="text-muted-foreground text-xs">
                  {capability.equipment.slice(0, 3).join(", ")}
                  {capability.equipment.length > 3 && ` +${capability.equipment.length - 3} more`}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-start gap-2">
          <Badge variant={(capability.isActive ?? true) ? "status-info" : "status-inactive"}>
            {(capability.isActive ?? true) ? "Active" : "Inactive"}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => onEdit(capability)}>
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(capability.id)}
            title="Delete Capability"
            description="Are you sure you want to delete this manufacturing capability? This action cannot be undone."
          />
        </div>
      </div>
    </div>
  );
}

export function CapabilityManagement({ mediaAssets }: CapabilityManagementProps) {
  const [editingCapability, setEditingCapability] = useState<ManufacturingCapability | null>(null);
  const [showCapabilityDialog, setShowCapabilityDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [capabilityForm, setCapabilityForm] = useState<CapabilityFormData>({
    name: "", // Required
    title: "",
    description: "",
    specifications: [],
    equipment: [],
    icon: "Factory",
    imageId: null,
    isActive: true,
    capacity: "",
    category: "",
    unit: null,
  });
  const [showCapabilityImagePicker, setShowCapabilityImagePicker] = useState(false);
  const [newSpecForm, setNewSpecForm] = useState({ label: "", value: "" });
  const [newEquipment, setNewEquipment] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Optimized Capability queries with performance tracking and throttled renders
  const { data: capabilities = [], isLoading: capabilitiesLoading } = useOptimizedQuery<
    ManufacturingCapability[]
  >({
    queryKey: ["/api/manufacturing-capabilities"],
    staleTime: 30 * 60 * 1000, // Extended to 30 minutes for performance
    refetchOnWindowFocus: false, // Disable unnecessary refetches
    refetchOnMount: false, // Only fetch if stale
  });

  const {
    createMutation: createCapabilityMutation,
    updateMutation: updateCapabilityMutation,
    deleteMutation: deleteCapabilityMutation,
    reorderMutation: reorderCapabilitiesMutation,
  } = useManufacturingMutations({
    entity: "capabilities" as any,
    entityType: "Capability",
    entityTypePlural: "capabilities",
    queryKey: "/api/manufacturing-capabilities",
    onSuccess: () => {
      setShowCapabilityDialog(false);
      setEditingCapability(null);
      resetCapabilityForm();
    },
  });

  // Fetch specific capability image if imageId is set
  const { data: specificCapabilityImage } = useQuery({
    queryKey: [`/api/media/${capabilityForm.imageId}`, capabilityForm.imageId],
    queryFn: async () => {
      if (!capabilityForm.imageId) return null;
      const response = await fetch(`/api/media/${capabilityForm.imageId}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!capabilityForm.imageId,
    staleTime: 30 * 60 * 1000, // Extended cache for media assets
  });

  const selectedCapabilityImage = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === capabilityForm.imageId)
    : undefined;

  // Use specific fetched asset as fallback if not found in main list
  const finalSelectedCapabilityImage = selectedCapabilityImage || specificCapabilityImage;

  const resetCapabilityForm = () => {
    setCapabilityForm({
      name: "",
      title: "",
      description: "",
      specifications: [],
      equipment: [],
      icon: "Factory",
      imageId: null,
      isActive: true,
      capacity: "",
      category: "",
      unit: null,
    });
    setShowPreview(false);
  };

  const handleCapabilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...capabilityForm,
      name: capabilityForm.name || capabilityForm.title || "Untitled Capability",
      // spec is handled as array in form, need to ensure API handles it or we transform it.
      // Schema says jsonb with $type<Record>, but insert schema might accept array?.
      // Checking shared/schema.ts: insertManufacturingCapabilitySchema expects `specifications: z.array(...)`.
      // So no transformation needed here, the APIZod schema will handle it.
    };

    if (editingCapability) {
      updateCapabilityMutation.mutate({
        id: editingCapability.id,
        data: formData,
      });
    } else {
      createCapabilityMutation.mutate({
        ...formData,
        position: capabilities.length,
      });
    }
  };

  const handleEditCapability = (capability: ManufacturingCapability) => {
    setEditingCapability(capability);
    setCapabilityForm({
      name: capability.name,
      title: capability.title ?? "",
      description: capability.description ?? "",
      // Cast generic jsonb to specific frontend type
      specifications: (capability.specifications as unknown as Specification[]) ?? [],
      equipment: capability.equipment ?? [],
      icon: capability.icon ?? "Factory",
      imageId: capability.imageId ?? null,
      isActive: capability.isActive ?? true,
      capacity: capability.capacity ?? "",
      category: capability.category ?? "",
      unit: capability.unit ?? null,
    });
    setShowCapabilityDialog(true);
  };

  const handleCapabilityDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = capabilities.findIndex((c) => c.id === active.id);
      const newIndex = capabilities.findIndex((c) => c.id === over.id);
      const newCapabilities = arrayMove(capabilities, oldIndex, newIndex);
      const updates = newCapabilities.map((capability, index) => ({
        id: capability.id,
        position: index,
      }));
      reorderCapabilitiesMutation.mutate(updates);
    }
  };

  const handleAddSpecification = () => {
    if (newSpecForm.label && newSpecForm.value) {
      setCapabilityForm({
        ...capabilityForm,
        specifications: [...capabilityForm.specifications, newSpecForm],
      });
      setNewSpecForm({ label: "", value: "" });
    }
  };

  const handleRemoveSpecification = (index: number) => {
    const newSpecifications = capabilityForm.specifications.filter((_, i) => i !== index);
    setCapabilityForm({ ...capabilityForm, specifications: newSpecifications });
  };

  const handleAddEquipment = () => {
    if (newEquipment) {
      setCapabilityForm({
        ...capabilityForm,
        equipment: [...capabilityForm.equipment, newEquipment],
      });
      setNewEquipment("");
    }
  };

  const handleRemoveEquipment = (index: number) => {
    const newEquipment = capabilityForm.equipment.filter((_, i) => i !== index);
    setCapabilityForm({ ...capabilityForm, equipment: newEquipment });
  };

  const handleCapabilityImageSelect = (assets: MediaAsset[] | MediaAsset) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (!asset) return;
    setCapabilityForm({ ...capabilityForm, imageId: asset.id });
    setShowCapabilityImagePicker(false);
  };

  // Helper to generate preview object
  const getPreviewCapability = (): ManufacturingCapability => {
    return {
      id: editingCapability?.id || 0,
      createdAt: editingCapability?.createdAt || new Date(),
      sortOrder: editingCapability?.sortOrder || 0,
      ...capabilityForm,
      // Cast specifications to fulfill type definition while maintaining array structure for component
      specifications: capabilityForm.specifications as unknown as Record<string, any>,
      name: capabilityForm.name || capabilityForm.title || "Untitled Capability",
    } as ManufacturingCapability;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manufacturing Capabilities</CardTitle>
            <CardDescription>
              Manage manufacturing capabilities and technical specifications
            </CardDescription>
          </div>
          <Button onClick={() => setShowCapabilityDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Capability
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {capabilitiesLoading ? (
          <div className="py-8 text-center">Loading capabilities...</div>
        ) : capabilities.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No manufacturing capabilities found. Create your first capability to get started.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCapabilityDragEnd}
          >
            <SortableContext
              items={capabilities.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {capabilities.map((capability) => (
                  <SortableCapabilityItem
                    key={capability.id}
                    capability={capability}
                    onEdit={handleEditCapability}
                    onDelete={deleteCapabilityMutation.mutate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Capability Dialog */}
        <Dialog open={showCapabilityDialog} onOpenChange={setShowCapabilityDialog}>
          <DialogContent
            contentType="form"
            className={showPreview ? "w-full max-w-6xl" : "w-full max-w-xl"}
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>
                    {editingCapability ? "Edit Capability" : "Add New Capability"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure manufacturing capability details and specifications
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>
            </DialogHeader>

            <form onSubmit={handleCapabilitySubmit} className="flex min-h-0 flex-1 flex-col">
              <DialogBody className="space-y-4 px-1">
                <div className={showPreview ? "flex gap-6" : ""}>
                  <div className={showPreview ? "flex-1 space-y-4" : "space-y-4"}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="capability-title">Title</Label>
                        <Input
                          id="capability-title"
                          value={capabilityForm.title || ""}
                          onChange={(e) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              title: e.target.value,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., Advanced Cutting Technology"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="capability-icon">Icon</Label>
                        <Select
                          value={capabilityForm.icon || undefined}
                          onValueChange={(value) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              icon: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {capabilityIcons.map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="capability-capacity">Capacity</Label>
                        <Input
                          id="capability-capacity"
                          data-testid="input-capability-capacity"
                          value={capabilityForm.capacity || ""}
                          onChange={(e) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              capacity: e.target.value,
                            })
                          }
                          placeholder="e.g., 10000 units/month"
                        />
                      </div>
                      <div>
                        <Label htmlFor="capability-category">Category</Label>
                        <Input
                          id="capability-category"
                          data-testid="input-capability-category"
                          value={capabilityForm.category || ""}
                          onChange={(e) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              category: e.target.value,
                            })
                          }
                          placeholder="e.g., Production, Quality Control"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="capability-description">Description</Label>
                      <Textarea
                        id="capability-description"
                        value={capabilityForm.description || ""}
                        onChange={(e) =>
                          setCapabilityForm({
                            ...capabilityForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe this capability..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="capability-active"
                        checked={capabilityForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setCapabilityForm({
                            ...capabilityForm,
                            isActive: checked,
                          })
                        }
                      />
                      <Label htmlFor="capability-active">Active</Label>
                    </div>

                    {/* Specifications Section */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label>Specifications</Label>
                      </div>
                      <div className="mb-4 space-y-2">
                        {capabilityForm.specifications.map((spec: Specification, index: number) => (
                          <div key={index} className="flex items-center gap-2 rounded border p-2">
                            <div className="flex-1">
                              <span className="font-medium">{spec.label}:</span> {spec.value}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSpecification(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Specification label"
                          value={newSpecForm.label}
                          onChange={(e) =>
                            setNewSpecForm({
                              ...newSpecForm,
                              label: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Value"
                          value={newSpecForm.value}
                          onChange={(e) =>
                            setNewSpecForm({
                              ...newSpecForm,
                              value: e.target.value,
                            })
                          }
                        />
                        <Button type="button" onClick={handleAddSpecification} size="sm">
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Equipment Section */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label>Equipment</Label>
                      </div>
                      <div className="mb-4 space-y-2">
                        {capabilityForm.equipment.map((equipment: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 rounded border p-2">
                            <div className="flex-1">{equipment}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEquipment(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Equipment name"
                          value={newEquipment}
                          onChange={(e) => setNewEquipment(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddEquipment} size="sm">
                          Add Equipment
                        </Button>
                      </div>
                    </div>

                    {/* Image Selection */}
                    <div>
                      <Label>Capability Image</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCapabilityImagePicker(true)}
                          className="flex-1"
                        >
                          <Image className="mr-2 h-4 w-4" />
                          {finalSelectedCapabilityImage
                            ? finalSelectedCapabilityImage.filename
                            : "Select Image"}
                        </Button>
                        {finalSelectedCapabilityImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setCapabilityForm({
                                ...capabilityForm,
                                imageId: null,
                              })
                            }
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Column */}
                  {showPreview && (
                    <div className="flex-1 border-l pl-6">
                      <div className="sticky top-0 space-y-4">
                        <div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
                          <LayoutTemplate className="h-4 w-4" />
                          <span>Live Preview</span>
                        </div>
                        <LivePreviewGrid>
                          <CapabilityCard
                            capability={getPreviewCapability()}
                            index={0}
                            mediaAssets={mediaAssets}
                          />
                        </LivePreviewGrid>
                        <div className="bg-muted/50 text-muted-foreground rounded-lg p-4 text-xs">
                          <p>
                            This preview shows how the capability card will appear on the public
                            site. The layout size may adjust based on content volume.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCapabilityDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCapabilityMutation.isPending || updateCapabilityMutation.isPending
                  }
                >
                  {editingCapability ? "Update Capability" : "Create Capability"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Capability Image Picker */}
        <StandardMediaSelectionDialog
          isOpen={showCapabilityImagePicker}
          onClose={() => setShowCapabilityImagePicker(false)}
          onSelect={handleCapabilityImageSelect}
          title="Select Capability Image"
          mediaPickerTarget="capability-image"
          selectionMode="single"
        />
      </CardContent>
    </Card>
  );
}
