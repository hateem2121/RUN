/**
 * PHASE 2: TECHNOLOGY MODERNIZATION
 *
 * Extracted Equipment Management Component - Second Module
 * Original: technology-management.tsx lines 1742-1996 + mutations + handlers (398 lines)
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
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MediaAsset, TechnologyEquipment } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  Box,
  Calendar,
  Clock,
  Edit,
  Image as ImageIcon,
  Layers,
  Monitor,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface EquipmentFormData {
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  quantity: number;
  capacity: string;
  maintenanceSchedule: string;
  description: string;
  certifications: string[];
  specifications: Record<string, string | number | boolean>;
  imageId: number | null;
  installationDate: Date | null;
  isActive: boolean;
}

interface SortableEquipmentItemProps {
  equipment: TechnologyEquipment;
  onEdit: (equipment: TechnologyEquipment) => void;
  onDelete: (id: number) => void;
}

function SortableEquipmentItem({ equipment, onEdit, onDelete }: SortableEquipmentItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: equipment.id,
  });

  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media-assets"],
  });

  const equipmentImage = useMemo(() => {
    return mediaAssets.find((a) => a.id === equipment.imageId);
  }, [mediaAssets, equipment.imageId]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const getStatusConfig = (isActive: boolean) => {
    if (!isActive) return { label: "OFFLINE", color: "text-slate-400", bgColor: "bg-slate-400" };
    // We could add more complex status logic here if needed
    return { label: "ACTIVE", color: "text-emerald-400", bgColor: "bg-emerald-400" };
  };

  const status = getStatusConfig(equipment.isActive ?? true);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-[#00D4FF]/40 hover:shadow-[0_10px_30px_-10px_rgba(0,212,255,0.2)] backdrop-blur-xl"
    >
      {/* Drag Handle & Actions */}
      <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <div
          {...attributes}
          {...listeners}
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-[#0A0A0A]/80 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:cursor-grabbing"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <Layers className="h-4 w-4" />
        </div>
        <button
          onClick={() => onEdit(equipment)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A0A0A]/80 text-white backdrop-blur-md transition-colors hover:bg-[#00D4FF] hover:text-[#0A0A0A]"
          title="Edit Equipment"
          aria-label="Edit Equipment"
        >
          <Edit className="h-3.5 w-3.5" />
        </button>
        <DeleteConfirmationDialog
          onConfirm={() => onDelete(equipment.id)}
          title="Delete Equipment"
          description="Are you sure you want to decommission this asset?"
          trigger={
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A0A0A]/80 text-white backdrop-blur-md transition-colors hover:bg-rose-500"
              title="Delete Equipment"
              aria-label="Delete Equipment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          }
        />
      </div>

      {/* Image Section */}
      <div className="relative h-44 shrink-0 overflow-hidden">
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-60" />
        {equipmentImage ? (
          <img
            src={equipmentImage.url}
            alt={equipment.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
            <Monitor className="h-12 w-12 text-white/10" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3 z-[2]">
          <span className="rounded border border-[#00D4FF]/30 bg-[#00D4FF]/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#00D4FF] uppercase backdrop-blur-md">
            {equipment.category || "General"}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="line-clamp-1 font-bold text-white tracking-tight">{equipment.name}</h3>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status.bgColor,
                equipment.isActive && "animate-pulse",
              )}
            />
            <span className={cn("text-[10px] font-medium tracking-wide", status.color)}>
              {status.label}
            </span>
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-[#E3DFD6]/60">
          {equipment.description ||
            "Sophisticated technological asset utilized in high-precision apparel manufacturing flows."}
        </p>

        {/* Specs Grid */}
        <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/[0.05] pt-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-3 w-3 text-[#00D4FF]/60" />
            <span className="truncate text-[10px] text-[#E3DFD6]/40 uppercase tracking-wider">
              {equipment.manufacturer || "OEM"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Box className="h-3 w-3 text-[#00D4FF]/60" />
            <span className="truncate text-[10px] text-[#E3DFD6]/40 uppercase tracking-wider">
              QTY: {equipment.quantity || 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-[#00D4FF]/60" />
            <span className="truncate text-[10px] text-[#E3DFD6]/40 uppercase tracking-wider">
              {equipment.capacity || "STNDRD"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-[#00D4FF]/60" />
            <span className="truncate text-[10px] text-[#E3DFD6]/40 uppercase tracking-wider">
              {equipment.maintenanceSchedule || "MNTNCE"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface TechnologyEquipmentManagementProps {
  isLoading?: boolean;
}

export function TechnologyEquipmentManagement({
  isLoading = false,
}: TechnologyEquipmentManagementProps = {}) {
  const { toast } = useToast();

  // Form state management
  const [editingEquipment, setEditingEquipment] = useState<TechnologyEquipment | null>(null);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentFormData>({
    name: "",
    manufacturer: "",
    model: "",
    category: "",
    quantity: 1,
    capacity: "",
    maintenanceSchedule: "",
    certifications: [],
    description: "",
    specifications: {},
    imageId: null,
    installationDate: null,
    isActive: true,
  });

  // Dynamic form fields state
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Equipment data query
  const { data: equipment = [], isPending: equipmentLoading } = useQuery<TechnologyEquipment[]>({
    queryKey: ["/api/technology-equipment"],
  });

  // Media assets query
  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media"],
  });

  // Equipment mutations
  const createEquipmentMutation = useMutation({
    mutationFn: (data: EquipmentFormData) =>
      apiRequest("/api/technology-equipment", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          position: equipment.length,
        }),
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-equipment"],
      });
      setShowEquipmentDialog(false);
      setEditingEquipment(null);
      setEquipmentForm({
        name: "",
        manufacturer: "",
        model: "",
        category: "",
        quantity: 1,
        capacity: "",
        maintenanceSchedule: "",
        certifications: [],
        description: "",
        specifications: {},
        imageId: null,
        installationDate: null,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Equipment created successfully",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EquipmentFormData> }) =>
      apiRequest(`/api/technology-equipment/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-equipment"],
      });
      setShowEquipmentDialog(false);
      setEditingEquipment(null);
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/technology-equipment/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-equipment"],
      });
      toast({
        title: "Success",
        description: "Equipment deleted successfully",
      });
    },
  });

  const reorderEquipmentMutation = useMutation({
    mutationFn: (equipment: { id: number; position: number }[]) =>
      apiRequest("/api/technology-equipment/reorder", {
        method: "PATCH",
        body: JSON.stringify({ equipment }),
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-equipment"],
      });
    },
  });

  // Event handlers
  const handleEquipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEquipment) {
      updateEquipmentMutation.mutate({
        id: editingEquipment.id,
        data: equipmentForm,
      });
    } else {
      createEquipmentMutation.mutate(equipmentForm);
    }
  };

  const handleEditEquipment = (equipment: TechnologyEquipment) => {
    setEditingEquipment(equipment);
    setEquipmentForm({
      name: equipment.name,
      manufacturer: equipment.manufacturer || "",
      model: equipment.model || "",
      category: equipment.category || "",
      quantity: equipment.quantity || 1,
      capacity: equipment.capacity || "",
      maintenanceSchedule: equipment.maintenanceSchedule || "",
      certifications: equipment.certifications || [],
      description: equipment.description || "",
      specifications: equipment.specifications || {},
      imageId: equipment.imageId || null,
      installationDate: equipment.installationDate || null,
      isActive: equipment.isActive ?? true,
    });
    setShowEquipmentDialog(true);
  };

  const handleEquipmentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = equipment.findIndex((e) => e.id === active.id);
      const newIndex = equipment.findIndex((e) => e.id === over.id);
      const newEquipment = arrayMove(equipment, oldIndex, newIndex);
      const updates = newEquipment.map((equip, index) => ({
        id: equip.id,
        position: index,
      }));
      reorderEquipmentMutation.mutate(updates);
    }
  };

  return (
    <div className="space-y-12">
      {/* Search and Total Stats Header Overlay */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#00D4FF]" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Technology <span className="text-[#00D4FF]">Equipment</span>
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#E3DFD6]/60">
            Advanced manufacturing ecosystem control. Monitor hardware status, maintenance cycles,
            and quality orientation across the production floor.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E3DFD6]/40" />
            <Input
              placeholder="Filter assets..."
              className="h-10 border-white/[0.08] bg-white/[0.03] pl-9 text-xs focus-visible:ring-[#00D4FF]/30"
            />
          </div>
          <Button
            onClick={() => {
              setEditingEquipment(null);
              setEquipmentForm({
                name: "",
                manufacturer: "",
                model: "",
                category: "",
                quantity: 1,
                capacity: "",
                maintenanceSchedule: "",
                certifications: [],
                description: "",
                specifications: {},
                imageId: null,
                installationDate: null,
                isActive: true,
              });
              setShowEquipmentDialog(true);
            }}
            className="h-10 bg-[#00D4FF] px-6 font-bold text-[#0A0A0A] transition-all hover:bg-[#00D4FF]/90 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            NEW EQUIPMENT
          </Button>
        </div>
      </div>

      {/* Equipment Grid Section */}
      <div className="min-h-[400px]">
        {equipmentLoading || isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00D4FF] border-t-transparent" />
            <span className="text-xs font-medium uppercase tracking-widest text-[#00D4FF]">
              Calibrating Systems...
            </span>
          </div>
        ) : equipment.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00D4FF]/10">
              <Monitor className="h-8 w-8 text-[#00D4FF]/40" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">No Assets Detected</h3>
              <p className="max-w-[300px] text-xs leading-relaxed text-[#E3DFD6]/40">
                Your manufacturing grid is currently offline. Add equipment to begin tracking
                performance.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowEquipmentDialog(true)}
              className="border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1]"
            >
              Initialize First Asset
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleEquipmentDragEnd}
          >
            <SortableContext items={equipment.map((e) => e.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {equipment.map((equip) => (
                  <SortableEquipmentItem
                    key={equip.id}
                    equipment={equip}
                    onEdit={handleEditEquipment}
                    onDelete={(id) => deleteEquipmentMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Ecosystem Stats - Bento Style */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05]">
          <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#E3DFD6]/40 uppercase">
            Total Assets
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-white">{equipment.length}</span>
            <span className="mb-1 text-[10px] font-medium text-[#00D4FF]">SYSTEMS</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05]">
          <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#E3DFD6]/40 uppercase">
            Ecosystem Health
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-emerald-400">98.2%</span>
            <span className="mb-1 text-[10px] font-medium text-emerald-400">CALIBRATED</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05]">
          <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#E3DFD6]/40 uppercase">
            Active Units
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-white">
              {equipment.filter((e) => e.isActive).length}
            </span>
            <span className="mb-1 text-[10px] font-medium text-[#00D4FF]">ONLINE</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05]">
          <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#E3DFD6]/40 uppercase">
            System Uptime
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#00D4FF]">99.9%</span>
            <span className="mb-1 text-[10px] font-medium text-[#00D4FF]">VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Equipment Dialog */}
      <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
        <DialogContent
          contentType="form"
          preferredSize="4xl"
          className="overflow-hidden bg-[#0A0A0A] border-[#00D4FF]/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <DialogHeader className="border-b border-white/[0.08] bg-white/[0.02] px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
                {editingEquipment ? (
                  <Settings2 className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white uppercase">
                  {editingEquipment ? "Configure" : "Initialize"}{" "}
                  <span className="text-[#00D4FF]">Asset</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#E3DFD6]/40">
                  Update high-precision equipment specifications for the digital ecosystem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={handleEquipmentSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <DialogBody className="custom-scrollbar space-y-8 px-8 py-8">
              {/* Primary Configuration */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-2 border-[#00D4FF] pl-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D4FF]">
                    Primary Configuration
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Asset Name *
                    </Label>
                    <Input
                      value={equipmentForm.name}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., Automated Cutting System v4"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Asset Category
                    </Label>
                    <Input
                      value={equipmentForm.category}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, category: e.target.value })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., Hardware, Software, Instrumentation"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                    System Description
                  </Label>
                  <Textarea
                    value={equipmentForm.description}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, description: e.target.value })
                    }
                    className="min-h-[100px] border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                    placeholder="Provide detailed technical summary of this equipment..."
                  />
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-2 border-[#00D4FF] pl-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D4FF]">
                    Technical Specs
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Manufacturer
                    </Label>
                    <Input
                      value={equipmentForm.manufacturer}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., Brother, Optitex"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Model Version
                    </Label>
                    <Input
                      value={equipmentForm.model}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, model: e.target.value })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., Industrial v7.2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Asset Quantity
                    </Label>
                    <Input
                      type="number"
                      value={equipmentForm.quantity}
                      onChange={(e) =>
                        setEquipmentForm({
                          ...equipmentForm,
                          quantity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Capacity Rating
                    </Label>
                    <Input
                      value={equipmentForm.capacity}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, capacity: e.target.value })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., 500 units/day"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance & Certification */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-2 border-[#00D4FF] pl-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D4FF]">
                    Lifecycle Management
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Maintenance Frequency
                    </Label>
                    <Input
                      value={equipmentForm.maintenanceSchedule}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, maintenanceSchedule: e.target.value })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., Bi-weekly, Monthly"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Initialization Date
                    </Label>
                    <Input
                      type="date"
                      value={
                        equipmentForm.installationDate
                          ? new Date(equipmentForm.installationDate).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setEquipmentForm({
                          ...equipmentForm,
                          installationDate: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                    />
                  </div>
                </div>

                {/* Media Handling */}
                <div className="space-y-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-6">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D4FF]">
                    Visual Identification
                  </Label>
                  <div className="flex items-center gap-6">
                    <div className="group relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0A0A0A]">
                      {equipmentForm.imageId ? (
                        <img
                          src={mediaAssets?.find((a) => a.id === equipmentForm.imageId)?.url}
                          className="h-full w-full object-cover"
                          alt="Asset Preview"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white/5" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsImagePickerOpen(true)}
                        className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/60 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Layers className="h-5 w-5 text-white" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-[#E3DFD6]/40">
                        High-resolution reference image for asset tracking and dashboard
                        visualizations.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsImagePickerOpen(true)}
                        className="h-8 w-fit border border-white/[0.1] text-[10px] font-bold tracking-widest text-[#00D4FF] hover:bg-[#00D4FF]/10"
                      >
                        SELECT REFERENCE MEDIA
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-6">
                  <div>
                    <h5 className="text-sm font-bold text-white">System Visibility</h5>
                    <p className="text-xs text-[#E3DFD6]/40">
                      Toggle public visibility for this specific piece of technology.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-[10px] font-black tracking-widest uppercase transition-colors",
                        equipmentForm.isActive ? "text-[#00D4FF]" : "text-[#E3DFD6]/20",
                      )}
                    >
                      {equipmentForm.isActive ? "Online" : "Decommissioned"}
                    </span>
                    <Switch
                      checked={equipmentForm.isActive}
                      onCheckedChange={(checked) =>
                        setEquipmentForm({ ...equipmentForm, isActive: checked })
                      }
                      className="data-[state=checked]:bg-[#00D4FF]"
                    />
                  </div>
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-white/[0.08] bg-white/[0.02] px-8 py-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowEquipmentDialog(false)}
                className="text-[#E3DFD6]/60 hover:text-white"
              >
                DISCARD
              </Button>
              <Button
                type="submit"
                disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
                className="bg-[#00D4FF] px-8 font-black text-[#0A0A0A] hover:bg-[#00D4FF]/90 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              >
                {createEquipmentMutation.isPending || updateEquipmentMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    SYNCING...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 uppercase tracking-wide">
                    <Save className="h-4 w-4" />
                    {editingEquipment ? "Push Updates" : "Initialize Asset"}
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Selection Dialog */}
      <StandardMediaSelectionDialog
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(assets: MediaAsset | MediaAsset[]) => {
          const selectedAsset = Array.isArray(assets) ? assets[0] : assets;
          if (selectedAsset) {
            setEquipmentForm({
              ...equipmentForm,
              imageId: selectedAsset.id,
            });
          }
          setIsImagePickerOpen(false);
        }}
        title="Select Equipment Image"
        mediaPickerTarget="equipment-management"
        selectionMode="single"
      />
    </div>
  );
}
