import {
  closestCenter,
  DndContext,
  type DragEndEvent,
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
import type { ManufacturingCapability, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CircuitBoard,
  Cog,
  Edit,
  Eye,
  EyeOff,
  Factory,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  type LucideIcon,
  Plus,
  Shield,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useActionState, useOptimistic, useState } from "react";
import { LivePreviewGrid } from "@/components/admin/manufacturing/LivePreviewGrid";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { MediaPickerModal } from "@/components/admin/shared/MediaPickerModal";
import { CapabilityCard } from "@/components/shared/manufacturing/CapabilityCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

interface Specification {
  label: string;
  value: string;
}

type CapabilityFormData = Omit<
  ManufacturingCapability,
  "id" | "createdAt" | "updatedAt" | "sortOrder" | "unit" | "specifications"
> & {
  specifications: Specification[];
  equipment: string[];
  imageId: number | null;
  unit: string | null;
};

export interface CapabilityManagementProps {
  mediaAssets?: MediaAsset[];
}

const capabilityIcons: Record<string, LucideIcon> = {
  Factory: Factory,
  Cog: Cog,
  Award: Award,
  Shield: Shield,
  Wrench: Wrench,
  CircuitBoard: CircuitBoard,
};

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

  const IconComponent = capabilityIcons[capability.icon || "Factory"] || Factory;
  const specs = (capability.specifications as unknown as Specification[]) || [];

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-admin-muted hover:text-brand-manufacturing transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="size-12 rounded-xl bg-brand-manufacturing/10 border border-brand-manufacturing/20 flex items-center justify-center flex-shrink-0">
          <IconComponent className="size-6 text-brand-manufacturing" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-bold text-white tracking-tight truncate">
              {capability.title || capability.name}
            </h4>
            <Badge
              variant="outline"
              className={cn(
                "text-xxs uppercase tracking-wider border-0 py-0 h-4",
                (capability.isActive ?? true)
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-white/5 text-admin-muted",
              )}
            >
              {(capability.isActive ?? true) ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-admin-muted text-xs">
            {capability.category && (
              <span className="flex items-center gap-1.5 capitalize">{capability.category}</span>
            )}
            {capability.capacity && (
              <span className="flex items-center gap-1.5 font-medium text-brand-manufacturing/80">
                <span className="text-white/20">•</span>
                {capability.capacity}
              </span>
            )}
          </div>

          {(specs.length > 0 || (capability.equipment && capability.equipment.length > 0)) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {specs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xxs font-bold text-white/40 uppercase tracking-widest pl-0.5">
                    Specifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {specs.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="text-xxs bg-white/5 border border-white/5 px-2 py-0.5 rounded text-admin-muted"
                      >
                        {spec.label}: <span className="text-white/60">{spec.value}</span>
                      </span>
                    ))}
                    {specs.length > 3 && (
                      <span className="text-xxs text-white/20">+{specs.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
              {capability.equipment && capability.equipment.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xxs font-bold text-white/40 uppercase tracking-widest pl-0.5">
                    Asset Registry
                  </p>
                  <p className="text-xs text-admin-muted leading-relaxed truncate">
                    {capability.equipment.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(capability)}
            className="size-8 rounded-lg hover:bg-brand-manufacturing/10 hover:text-brand-manufacturing"
            title="Edit Capability"
            aria-label="Edit Capability"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(capability.id)}
            title="Delete Capability"
            description="Are you sure you want to delete this manufacturing capability? This action cannot be undone."
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                title="Delete Capability"
                aria-label="Delete Capability"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}

export function CapabilityManagement({ mediaAssets = [] }: CapabilityManagementProps = {}) {
  const [editingCapability, setEditingCapability] = useState<ManufacturingCapability | null>(null);
  const [showCapabilityDialog, setShowCapabilityDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [capabilityForm, setCapabilityForm] = useState<CapabilityFormData>({
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
  const [showCapabilityImagePicker, setShowCapabilityImagePicker] = useState(false);
  const [newSpecForm, setNewSpecForm] = useState({ label: "", value: "" });
  const [newEquipment, setNewEquipment] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: capabilities = [], isLoading: capabilitiesLoading } = useOptimizedQuery<
    ManufacturingCapability[]
  >({
    queryKey: ["/api/manufacturing-capabilities"],
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const [optimisticCapabilities, setOptimisticCapabilities] = useOptimistic(
    capabilities,
    (
      state,
      action: {
        type: "add" | "update" | "delete" | "reorder";
        payload: ManufacturingCapability | number | ManufacturingCapability[];
      },
    ) => {
      switch (action.type) {
        case "add":
          return [...state, action.payload as ManufacturingCapability];
        case "update": {
          const updated = action.payload as ManufacturingCapability;
          return state.map((item) => (item.id === updated.id ? updated : item));
        }
        case "delete":
          return state.filter((item) => item.id !== (action.payload as number));
        case "reorder":
          return action.payload as ManufacturingCapability[];
        default:
          return state;
      }
    },
  );

  const {
    createMutation: createCapabilityMutation,
    updateMutation: updateCapabilityMutation,
    deleteMutation: deleteCapabilityMutation,
    reorderMutation: reorderCapabilitiesMutation,
  } = useManufacturingMutations({
    entity: "capabilities",
    entityType: "Capability",
    entityTypePlural: "capabilities",
    queryKey: "/api/manufacturing-capabilities",
    onSuccess: () => {
      setShowCapabilityDialog(false);
      setEditingCapability(null);
      resetCapabilityForm();
    },
  });

  const [_formState, formAction, isPending] = useActionState(
    async (_prevState: { success: boolean } | null, formData: FormData) => {
      const data = {
        name: formData.get("title") as string,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        capacity: formData.get("capacity") as string,
        category: formData.get("category") as string,
        icon: capabilityForm.icon,
        imageId: capabilityForm.imageId,
        isActive: formData.get("isActive") === "on",
        specifications: capabilityForm.specifications,
        equipment: capabilityForm.equipment,
      };

      if (editingCapability) {
        setOptimisticCapabilities({
          type: "update",
          payload: {
            ...editingCapability,
            ...data,
            specifications: data.specifications as unknown as Record<string, unknown>,
            unit: editingCapability.unit,
            createdAt: editingCapability.createdAt,
          },
        });
        await updateCapabilityMutation.mutateAsync({ id: editingCapability.id, data });
      } else {
        const tempId = Date.now();
        setOptimisticCapabilities({
          type: "add",
          payload: {
            ...data,
            id: tempId,
            sortOrder: capabilities.length,
            specifications: data.specifications as unknown as Record<string, unknown>,
            unit: null,
            createdAt: new Date(),
          } as ManufacturingCapability,
        });
        await createCapabilityMutation.mutateAsync({ ...data, sortOrder: capabilities.length });
      }
      return { success: true };
    },
    { success: false },
  );

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
    staleTime: 30 * 60 * 1000,
  });

  const selectedCapabilityImage = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === capabilityForm.imageId)
    : undefined;

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

  const handleEditCapability = (capability: ManufacturingCapability) => {
    setEditingCapability(capability);
    setCapabilityForm({
      name: capability.name,
      title: capability.title ?? "",
      description: capability.description ?? "",
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

  const handleCapabilityDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = optimisticCapabilities.findIndex((c) => c.id === active.id);
      const newIndex = optimisticCapabilities.findIndex((c) => c.id === over.id);
      const newCapabilities = arrayMove(optimisticCapabilities, oldIndex, newIndex);

      setOptimisticCapabilities({ type: "reorder", payload: newCapabilities });

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

  const handleCapabilityImageSelect = (asset: {
    id: string | number;
    url: string;
    filename: string;
    type: string;
  }) => {
    setCapabilityForm({ ...capabilityForm, imageId: Number(asset.id) });
    setShowCapabilityImagePicker(false);
  };

  const getPreviewCapability = (): ManufacturingCapability => {
    return {
      id: editingCapability?.id || 0,
      createdAt: editingCapability?.createdAt || new Date(),
      sortOrder: editingCapability?.sortOrder || 0,
      ...capabilityForm,
      specifications: capabilityForm.specifications as unknown as Record<string, unknown>,
      name: capabilityForm.name || capabilityForm.title || "Untitled Capability",
    } as ManufacturingCapability;
  };

  return (
    <Card variant="glass-premium">
      <CardContent className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Manufacturing Capabilities
            </h2>
            <p className="text-sm text-admin-muted">
              Manage manufacturing capabilities and technical specifications
            </p>
          </div>
          <Button
            onClick={() => {
              resetCapabilityForm();
              setShowCapabilityDialog(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold transition-all px-6 py-5 uppercase text-xxs tracking-widest"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Capability
          </Button>
        </div>

        <div className="min-h-[400px]">
          {capabilitiesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing"></div>
              </div>
              <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                Initialising Assets...
              </p>
            </div>
          ) : capabilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01]">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <CircuitBoard className="size-8 text-white/10" />
              </div>
              <p className="text-white/40 font-medium">No manufacturing capabilities found.</p>
              <p className="text-admin-muted text-sm mt-1">
                Create your first capability to get started.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCapabilityDragEnd}
            >
              <SortableContext
                items={optimisticCapabilities.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-3">
                  {optimisticCapabilities.map((capability) => (
                    <SortableCapabilityItem
                      key={capability.id}
                      capability={capability}
                      onEdit={handleEditCapability}
                      onDelete={(id) => {
                        setOptimisticCapabilities({ type: "delete", payload: id });
                        deleteCapabilityMutation.mutate(id);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <Dialog open={showCapabilityDialog} onOpenChange={setShowCapabilityDialog}>
          <DialogContent
            className={cn(
              "bg-surface-black/95 border-white/10 backdrop-blur-2xl text-white rounded-3xl p-0 overflow-hidden",
              showPreview ? "max-w-6xl" : "max-w-xl",
            )}
          >
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">
                    {editingCapability ? "Edit Capability" : "Add New Capability"}
                  </DialogTitle>
                  <DialogDescription className="text-admin-muted">
                    Configure manufacturing capability details and specifications
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="hidden gap-2 sm:flex text-xxs font-bold uppercase tracking-widest hover:bg-white/5"
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
            </div>

            <form action={formAction} className="flex-1 overflow-y-auto max-h-[70vh]">
              <div className="p-8 space-y-8">
                <div className={cn("grid gap-10", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="capability-title"
                          className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                        >
                          Title
                        </Label>
                        <Input
                          id="capability-title"
                          name="title"
                          value={capabilityForm.title || ""}
                          onChange={(e) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              title: e.target.value,
                              name: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 placeholder:text-white/20"
                          placeholder="e.g., Advanced Fabric Bonding"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="capability-icon"
                          className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                        >
                          Visual Icon
                        </Label>
                        <Select
                          value={capabilityForm.icon || "Factory"}
                          onValueChange={(value) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              icon: value,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-[50px] focus:ring-[#D4A853]/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-black border-white/10 text-white">
                            {Object.keys(capabilityIcons).map((icon) => (
                              <SelectItem
                                key={icon}
                                value={icon}
                                className="hover:bg-brand-manufacturing/10 focus:bg-brand-manufacturing/10"
                              >
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="capability-capacity"
                          className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                        >
                          Production Capacity
                        </Label>
                        <Input
                          id="capability-capacity"
                          name="capacity"
                          value={capabilityForm.capacity || ""}
                          onChange={(e) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              capacity: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 placeholder:text-white/20"
                          placeholder="e.g., 100,000 units/year"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="capability-category"
                          className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                        >
                          Service Category
                        </Label>
                        <Input
                          id="capability-category"
                          name="category"
                          value={capabilityForm.category || ""}
                          onChange={(e) =>
                            setCapabilityForm({
                              ...capabilityForm,
                              category: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 placeholder:text-white/20"
                          placeholder="e.g., Technical Teamwear"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="capability-description"
                        className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="capability-description"
                        name="description"
                        value={capabilityForm.description || ""}
                        onChange={(e) =>
                          setCapabilityForm({
                            ...capabilityForm,
                            description: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-[#D4A853]/50 placeholder:text-white/20 resize-none"
                        placeholder="Detail this technical capability..."
                      />
                    </div>

                    <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                      <Switch
                        id="capability-active"
                        name="isActive"
                        checked={capabilityForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setCapabilityForm({
                            ...capabilityForm,
                            isActive: checked,
                          })
                        }
                        className="data-[state=checked]:bg-brand-manufacturing"
                      />
                      <Label
                        htmlFor="capability-active"
                        className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer"
                      >
                        Status: {capabilityForm.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="space-y-4">
                        <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Technical Specifications
                        </Label>
                        <div className="grid gap-3">
                          {capabilityForm.specifications.map((spec, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                              <div className="flex-1 flex gap-2 text-sm">
                                <span className="font-bold text-brand-manufacturing">{spec.label}:</span>
                                <span className="text-white/70">{spec.value}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecification(index)}
                                className="text-red-500/70 hover:text-red-400 p-1"
                                aria-label="Remove Specification"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            placeholder="Label (e.g., Grade)"
                            value={newSpecForm.label}
                            onChange={(e) =>
                              setNewSpecForm({
                                ...newSpecForm,
                                label: e.target.value,
                              })
                            }
                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-[#D4A853]/50"
                          />
                          <Input
                            placeholder="Value (e.g., ISO-9001)"
                            value={newSpecForm.value}
                            onChange={(e) =>
                              setNewSpecForm({
                                ...newSpecForm,
                                value: e.target.value,
                              })
                            }
                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-[#D4A853]/50"
                          />
                          <Button
                            type="button"
                            onClick={handleAddSpecification}
                            className="h-11 bg-white/10 hover:bg-white/20 text-white font-bold text-xxs uppercase tracking-widest px-6"
                          >
                            Add Spec
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Asset Registry (Equipment)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {capabilityForm.equipment.map((item, index) => (
                            <Badge
                              key={index}
                              className="bg-brand-manufacturing/10 text-brand-manufacturing border-brand-manufacturing/20 px-3 py-1 gap-2 rounded-lg"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => handleRemoveEquipment(index)}
                                className="hover:text-white border-0 bg-transparent p-0 size-auto ml-1.5"
                                aria-label={`Remove ${item}`}
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <Input
                            placeholder="Add equipment (e.g., CNC Laser Cutter)"
                            value={newEquipment}
                            onChange={(e) => setNewEquipment(e.target.value)}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-[#D4A853]/50"
                          />
                          <Button
                            type="button"
                            onClick={handleAddEquipment}
                            className="h-11 bg-white/10 hover:bg-white/20 text-white font-bold text-xxs uppercase tracking-widest px-6 whitespace-nowrap"
                          >
                            Add Asset
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Hero Asset
                        </Label>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCapabilityImagePicker(true)}
                            className="flex-1 bg-white/5 border-white/10 h-14 rounded-xl justify-start px-4 text-admin-muted hover:bg-white/10 hover:text-white transition-all border-0 shadow-none ring-offset-0 focus:ring-0"
                          >
                            <ImageIcon className="mr-3 h-5 w-5 text-brand-manufacturing" />
                            <span className="truncate">
                              {finalSelectedCapabilityImage
                                ? finalSelectedCapabilityImage.filename
                                : "Select Hero Image"}
                            </span>
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
                              className="h-14 w-14 rounded-xl border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-admin-muted"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="sticky top-0 h-fit space-y-4">
                      <div className="flex items-center gap-2 mb-2 p-3 bg-brand-manufacturing/10 rounded-xl border border-brand-manufacturing/20">
                        <LayoutTemplate className="h-4 w-4 text-brand-manufacturing" />
                        <span className="text-xxs font-bold text-brand-manufacturing uppercase tracking-widest">
                          Live Component Preview
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-1">
                        <LivePreviewGrid>
                          <CapabilityCard
                            capability={getPreviewCapability()}
                            index={0}
                            mediaAssets={mediaAssets}
                          />
                        </LivePreviewGrid>
                      </div>
                      <p className="text-xxs font-medium text-admin-muted text-center italic">
                        This card will represent this capability on the public Manufacturing page.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCapabilityDialog(false)}
                  className="text-admin-muted hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-6 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all outline-none ring-0 border-0"
                >
                  {isPending
                    ? "Syncing..."
                    : editingCapability
                      ? "Update Capability"
                      : "Create Capability"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <MediaPickerModal
          isOpen={showCapabilityImagePicker}
          onClose={() => setShowCapabilityImagePicker(false)}
          onSelect={handleCapabilityImageSelect}
          title="Select Capability Image"
        />
      </CardContent>
    </Card>
  );
}
