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
import type { ManufacturingProcess, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, EyeOff, GripVertical, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { MediaPickerModal } from "@/components/admin/shared/MediaPickerModal";
import { ProcessCard } from "@/components/shared/manufacturing";
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
import { LivePreviewGrid } from "./LivePreviewGrid";

// Derive form data type from schema to ensure consistency
type ProcessFormData = Omit<
  ManufacturingProcess,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "position"
  | "imageId"
  | "equipment"
  | "specifications"
  | "sortOrder"
> & {
  mediaIds: number[];
  efficiency: number;
  step: number;
};

export interface ProcessManagementProps {
  mediaAssets?: MediaAsset[];
}

const processIcons = ["Factory", "Settings", "Wrench", "Box", "Truck", "CheckCircle2"];

function SortableProcessItem({
  process,
  onEdit,
  onDelete,
}: {
  process: ManufacturingProcess;
  onEdit: (process: ManufacturingProcess) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: process.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    // biome-ignore lint: Dynamic inline style required for dnd-kit
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-[#68869A] hover:text-blue-400 transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-bold text-[#D4A853] uppercase tracking-widest bg-[#D4A853]/10 px-2 py-0.5 rounded-full border border-[#D4A853]/20">
              Step {process.step}
            </span>
            <h4 className="font-bold text-white tracking-tight truncate">
              {process.title || process.name}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#68869A] text-xs">
            <span className="flex items-center gap-1.5 underline decoration-white/10 underline-offset-4 decoration-dotted">
              {process.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-white/40">•</span>
              {process.efficiency}% Efficiency
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-white/40">•</span>
              {process.category}
            </span>
          </div>

          {process.description && (
            <p className="mt-3 text-[#68869A] text-xs leading-relaxed line-clamp-2 max-w-2xl">
              {process.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase tracking-wider border-0",
              (process.isActive ?? true)
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/5 text-[#68869A]",
            )}
          >
            {(process.isActive ?? true) ? "Active" : "Inactive"}
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(process)}
            className="size-8 rounded-lg hover:bg-[#D4A853]/10 hover:text-[#D4A853]"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(process.id)}
            title="Delete Process"
            description="Are you sure you want to delete this manufacturing process? This action cannot be undone."
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                title="Delete Process"
                aria-label="Delete Process"
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

export function ProcessManagement({ mediaAssets = [] }: ProcessManagementProps = {}) {
  const [editingProcess, setEditingProcess] = useState<ManufacturingProcess | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [processForm, setProcessForm] = useState<ProcessFormData>({
    name: "", // Required by schema
    title: "",
    description: "",
    step: 1,
    mediaIds: [],
    isActive: true,
    iconName: "Factory",
    category: "Production",
    efficiency: 100,
    duration: "1 day",
  });
  const [showProcessImagePicker, setShowProcessImagePicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: processes = [], isLoading: processesLoading } = useOptimizedQuery<
    ManufacturingProcess[]
  >({
    queryKey: ["/api/manufacturing-processes"],
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    createMutation: createProcessMutation,
    updateMutation: updateProcessMutation,
    deleteMutation: deleteProcessMutation,
    reorderMutation: reorderProcessesMutation,
  } = useManufacturingMutations({
    entity: "processes",
    entityType: "Process",
    entityTypePlural: "processes",
    queryKey: "/api/manufacturing-processes",
    onSuccess: () => {
      setShowProcessDialog(false);
      setEditingProcess(null);
      resetProcessForm();
    },
  });

  const { data: specificProcessMedia } = useQuery({
    queryKey: [`/api/media/bulk`, processForm.mediaIds],
    queryFn: async () => {
      if (!processForm.mediaIds.length) return [];
      const response = await fetch(`/api/media?ids=${processForm.mediaIds.join(",")}`);
      if (!response.ok) return [];
      const result = await response.json();
      return result.success ? result.data.data : [];
    },
    enabled: processForm.mediaIds.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  const selectedProcessMedia = Array.isArray(mediaAssets)
    ? mediaAssets.filter((asset) => processForm.mediaIds.includes(asset.id))
    : [];

  const finalSelectedProcessMedia = [
    ...selectedProcessMedia,
    ...(specificProcessMedia || []),
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  const resetProcessForm = () => {
    setProcessForm({
      name: "",
      title: "",
      description: "",
      step: processes.length + 1,
      mediaIds: [],
      isActive: true,
      iconName: "Factory",
      category: "Production",
      efficiency: 100,
      duration: "1 day",
    });
    setShowPreview(false);
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...processForm,
      name: processForm.name || processForm.title || "Untitled Process",
    };

    if (editingProcess) {
      updateProcessMutation.mutate({
        id: editingProcess.id,
        data: formData,
      });
    } else {
      createProcessMutation.mutate({
        ...formData,
        position: processes.length,
      });
    }
  };

  const handleEditProcess = (process: ManufacturingProcess) => {
    setEditingProcess(process);
    setProcessForm({
      name: process.name,
      title: process.title ?? "",
      description: process.description ?? "",
      step: process.step,
      mediaIds: Array.isArray(process.mediaIds) ? process.mediaIds : [],
      isActive: process.isActive ?? true,
      iconName: process.iconName ?? "Factory",
      category: process.category ?? "Production",
      efficiency: process.efficiency ?? 100,
      duration: process.duration ?? "",
    });
    setShowProcessDialog(true);
  };

  const handleProcessDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = processes.findIndex((p) => p.id === active.id);
      const newIndex = processes.findIndex((p) => p.id === over.id);
      const newProcesses = arrayMove(processes, oldIndex, newIndex);
      const updates = newProcesses.map((process, index) => ({
        id: process.id,
        position: index,
      }));
      reorderProcessesMutation.mutate(updates);
    }
  };

  const handleProcessMediaSelect = (asset: any) => {
    // MediaPickerModal returns a single asset based on its current implementation
    const newAssets = Array.isArray(asset) ? asset : [asset];
    const newIds = newAssets.map((a) => Number(a.id));
    setProcessForm({ ...processForm, mediaIds: [...processForm.mediaIds, ...newIds] });
    setShowProcessImagePicker(false);
  };

  const getPreviewProcess = (): ManufacturingProcess => {
    return {
      id: editingProcess?.id || 0,
      createdAt: editingProcess?.createdAt || new Date(),
      position: editingProcess?.position || 0,
      imageId: null,
      equipment: null,
      specifications: null,
      sortOrder: editingProcess?.sortOrder || 0,
      ...processForm,
      name: processForm.name || processForm.title || "Untitled Process",
    };
  };

  return (
    <Card variant="glass-premium">
      <CardContent className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Manufacturing Processes</h2>
            <p className="text-sm text-[#68869A]">Manage production steps and efficiency metrics</p>
          </div>
          <Button
            onClick={() => {
              resetProcessForm();
              setShowProcessDialog(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold transition-all px-6 py-5 uppercase text-[10px] tracking-widest"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Process
          </Button>
        </div>

        <div className="min-h-[400px]">
          {processesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853] [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853] [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853]"></div>
              </div>
              <p className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                Initialising Processes...
              </p>
            </div>
          ) : processes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01]">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <LayoutTemplate className="size-8 text-white/10" />
              </div>
              <p className="text-white/40 font-medium">No manufacturing processes found.</p>
              <p className="text-[#68869A] text-sm mt-1">
                Create your first process to get started.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleProcessDragEnd}
            >
              <SortableContext
                items={processes.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-3">
                  {processes.map((process) => (
                    <SortableProcessItem
                      key={process.id}
                      process={process}
                      onEdit={handleEditProcess}
                      onDelete={deleteProcessMutation.mutate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent
            className={cn(
              "bg-[#0A0A0A]/95 border-white/10 backdrop-blur-2xl text-white rounded-3xl p-0 overflow-hidden",
              showPreview ? "max-w-6xl" : "max-w-xl",
            )}
          >
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">
                    {editingProcess ? "Edit Process" : "Add New Process"}
                  </DialogTitle>
                  <DialogDescription className="text-[#68869A]">
                    Configure manufacturing process step and details
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="hidden gap-2 sm:flex text-[10px] font-bold uppercase tracking-widest hover:bg-white/5"
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
            </div>

            <form onSubmit={handleProcessSubmit} className="flex-1 overflow-y-auto max-h-[70vh]">
              <div className="p-8 space-y-8">
                <div className={cn("grid gap-10", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="process-title"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Title
                        </Label>
                        <Input
                          id="process-title"
                          value={processForm.title || ""}
                          onChange={(e) =>
                            setProcessForm({
                              ...processForm,
                              title: e.target.value,
                              name: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 placeholder:text-white/20"
                          placeholder="e.g., Fabric Cutting"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="process-step"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Step Number
                        </Label>
                        <Input
                          id="process-step"
                          type="number"
                          value={processForm.step}
                          onChange={(e) =>
                            setProcessForm({
                              ...processForm,
                              step: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="process-category"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Category
                        </Label>
                        <Input
                          id="process-category"
                          value={processForm.category || ""}
                          onChange={(e) =>
                            setProcessForm({
                              ...processForm,
                              category: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 placeholder:text-white/20"
                          placeholder="e.g., Pre-production"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="process-icon"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Visual Icon
                        </Label>
                        <Select
                          value={processForm.iconName || "Factory"}
                          onValueChange={(value) =>
                            setProcessForm({ ...processForm, iconName: value })
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-[50px] focus:ring-[#D4A853]/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                            {processIcons.map((icon) => (
                              <SelectItem
                                key={icon}
                                value={icon}
                                className="hover:bg-[#D4A853]/10 focus:bg-[#D4A853]/10"
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
                          htmlFor="process-efficiency"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Process Efficiency
                        </Label>
                        <div className="relative">
                          <Input
                            id="process-efficiency"
                            type="number"
                            min="0"
                            max="100"
                            value={processForm.efficiency}
                            onChange={(e) =>
                              setProcessForm({
                                ...processForm,
                                efficiency: Number.parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="bg-white/5 border-white/10 text-white rounded-xl py-6 pr-12 focus:ring-[#D4A853]/50"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#68869A] font-bold text-xs">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="process-duration"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Active Duration
                        </Label>
                        <Input
                          id="process-duration"
                          value={processForm.duration || ""}
                          onChange={(e) =>
                            setProcessForm({
                              ...processForm,
                              duration: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 placeholder:text-white/20"
                          placeholder="e.g., 2-3 days"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="process-description"
                        className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                      >
                        Process Description
                      </Label>
                      <Textarea
                        id="process-description"
                        value={processForm.description || ""}
                        onChange={(e) =>
                          setProcessForm({
                            ...processForm,
                            description: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-[#D4A853]/50 placeholder:text-white/20 resize-none"
                        placeholder="Describe this manufacturing process..."
                      />
                    </div>

                    <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                      <Switch
                        id="process-active"
                        checked={processForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setProcessForm({ ...processForm, isActive: checked })
                        }
                        className="data-[state=checked]:bg-[#D4A853]"
                      />
                      <Label
                        htmlFor="process-active"
                        className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer"
                      >
                        Status: {processForm.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/5">
                      <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                        Process Media
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {finalSelectedProcessMedia.map((media) => (
                          <div
                            key={media.id}
                            className="relative group/item flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 pr-4 transition-all hover:border-white/20"
                          >
                            <div className="size-12 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex-shrink-0">
                              <img
                                src={media.thumbnailUrl || media.url}
                                alt={media.altText || media.filename}
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-xs text-white uppercase tracking-tight">
                                {media.filename}
                              </p>
                              <p className="text-[#68869A] text-[10px] uppercase font-medium">
                                {media.type}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedIds = processForm.mediaIds.filter(
                                  (id) => id !== media.id,
                                );
                                setProcessForm({ ...processForm, mediaIds: updatedIds });
                              }}
                              className="text-red-500/70 hover:text-red-400 p-1"
                              title={`Remove ${media.filename}`}
                              aria-label={`Remove ${media.filename}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setShowProcessImagePicker(true)}
                          className="flex items-center justify-center gap-2 h-[66px] rounded-xl border-2 border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all group"
                        >
                          <Plus className="size-4 text-[#68869A] group-hover:text-[#D4A853] transition-colors" />
                          <span className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest group-hover:text-white transition-colors">
                            Add Asset
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="sticky top-0 h-fit space-y-4">
                      <div className="flex items-center gap-2 mb-2 p-3 bg-[#D4A853]/10 rounded-xl border border-[#D4A853]/20">
                        <LayoutTemplate className="h-4 w-4 text-[#D4A853]" />
                        <span className="text-[10px] font-bold text-[#D4A853] uppercase tracking-widest">
                          Live Component Preview
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-1">
                        <LivePreviewGrid>
                          <ProcessCard
                            process={getPreviewProcess()}
                            index={0}
                            mediaAssets={[...mediaAssets, ...finalSelectedProcessMedia]}
                          />
                        </LivePreviewGrid>
                      </div>
                      <p className="text-[10px] font-medium text-[#68869A] text-center italic">
                        This is how the card will appear on the public manufacturing page.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowProcessDialog(false)}
                  className="text-[#68869A] hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProcessMutation.isPending || updateProcessMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-8 py-6 font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  {editingProcess ? "Update Process" : "Create Process"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <MediaPickerModal
          isOpen={showProcessImagePicker}
          onClose={() => setShowProcessImagePicker(false)}
          onSelect={handleProcessMediaSelect}
          title="Select Process Media"
        />
      </CardContent>
    </Card>
  );
}
