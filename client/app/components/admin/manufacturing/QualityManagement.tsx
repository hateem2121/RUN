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
import type { ManufacturingQuality, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { LivePreviewGrid } from "@/components/admin/manufacturing/LivePreviewGrid";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { MediaPickerModal } from "@/components/admin/shared/MediaPickerModal";
import { QualityCard } from "@/components/shared/manufacturing/QualityCard";
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

// Derive form data type from schema
type QualityFormData = Omit<
  ManufacturingQuality,
  "id" | "createdAt" | "updatedAt" | "sortOrder" | "certificateId" | "testingMethod" | "criteria"
> & {
  checkpoints: string[];
  standards: string[];
  imageId: number | null;
};

interface QualityManagementProps {
  mediaAssets: MediaAsset[];
}

const qualityIcons: Record<string, any> = {
  CheckCircle2: CheckCircle2,
  Shield: Shield,
  ClipboardCheck: ClipboardCheck,
  Award: Award,
};

function SortableQualityItem({
  quality,
  onEdit,
  onDelete,
}: {
  quality: ManufacturingQuality;
  onEdit: (quality: ManufacturingQuality) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: quality.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = qualityIcons[quality.icon || "CheckCircle2"] || CheckCircle2;

  // Ensure checkpoints and standards are arrays
  const checkpoints = (quality.checkpoints as unknown as string[]) || [];
  const standards = (quality.standards as unknown as string[]) || [];

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-[#68869A] hover:text-[#D4A853] transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <IconComponent className="size-6 text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-bold text-white tracking-tight truncate">
              {quality.title || "Untitled Quality Standard"}
            </h4>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase tracking-wider border-0 py-0 h-4",
                (quality.isActive ?? true)
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-white/5 text-[#68869A]",
              )}
            >
              {(quality.isActive ?? true) ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#68869A] text-xs">
            {quality.category && (
              <span className="flex items-center gap-1.5 capitalize font-medium text-white/40">
                {quality.category}
              </span>
            )}
            {quality.frequency && (
              <span className="flex items-center gap-1.5 text-[#D4A853]/80">
                <span className="text-white/20">•</span>
                {quality.frequency}
              </span>
            )}
          </div>

          {(checkpoints.length > 0 || standards.length > 0) && (
            <div className="mt-4 flex flex-col gap-4">
              {checkpoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-0.5">
                    Control Checkpoints
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {checkpoints.slice(0, 4).map((checkpoint, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#68869A]">
                        <div className="size-1 rounded-full bg-emerald-500/40" />
                        <span className="truncate">{checkpoint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {standards.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {standards.map((standard, idx) => (
                    <Badge
                      key={idx}
                      className="bg-white/5 border-white/10 text-white/60 text-[10px] py-0.5 rounded-lg"
                    >
                      {standard}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(quality)}
            className="size-8 rounded-lg hover:bg-[#D4A853]/10 hover:text-[#D4A853]"
            title="Edit Quality Standard"
            aria-label="Edit Quality Standard"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(quality.id)}
            title="Delete Quality Standard"
            description="Are you sure you want to delete this quality assurance standard? This action cannot be undone."
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                title="Delete Quality Standard"
                aria-label="Delete Quality Standard"
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

export function QualityManagement({ mediaAssets }: QualityManagementProps) {
  const [editingQuality, setEditingQuality] = useState<ManufacturingQuality | null>(null);
  const [showQualityDialog, setShowQualityDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [qualityForm, setQualityForm] = useState<QualityFormData>({
    title: "",
    description: "",
    checkpoints: [],
    standards: [],
    icon: "CheckCircle2",
    imageId: null,
    isActive: true,
    category: "",
    frequency: "",
  });
  const [showQualityImagePicker, setShowQualityImagePicker] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState("");
  const [newStandard, setNewStandard] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: qualityStandards = [], isLoading: qualityLoading } = useOptimizedQuery<
    ManufacturingQuality[]
  >({
    queryKey: ["/api/manufacturing-qualities"],
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    createMutation: createQualityMutation,
    updateMutation: updateQualityMutation,
    deleteMutation: deleteQualityMutation,
    reorderMutation: reorderQualityMutation,
  } = useManufacturingMutations({
    entity: "qualities",
    entityType: "Quality Standard",
    entityTypePlural: "qualities",
    queryKey: ["/api/manufacturing-qualities"],
    onSuccess: () => {
      setShowQualityDialog(false);
      setEditingQuality(null);
      resetQualityForm();
    },
  });

  const { data: specificQualityImage } = useQuery({
    queryKey: [`/api/media/${qualityForm.imageId}`, qualityForm.imageId],
    queryFn: async () => {
      if (!qualityForm.imageId) return null;
      const response = await fetch(`/api/media/${qualityForm.imageId}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!qualityForm.imageId,
    staleTime: 30 * 60 * 1000,
  });

  const selectedQualityImage = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === qualityForm.imageId)
    : undefined;

  const finalSelectedQualityImage = selectedQualityImage || specificQualityImage;

  const resetQualityForm = () => {
    setQualityForm({
      title: "",
      description: "",
      checkpoints: [],
      standards: [],
      icon: "CheckCircle2",
      imageId: null,
      isActive: true,
      category: "",
      frequency: "",
    });
    setShowPreview(false);
  };

  const handleQualitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...qualityForm,
    };

    if (editingQuality) {
      updateQualityMutation.mutate({
        id: editingQuality.id,
        data: formData,
      });
    } else {
      createQualityMutation.mutate({
        ...formData,
        position: qualityStandards.length,
      });
    }
  };

  const handleEditQuality = (quality: ManufacturingQuality) => {
    setEditingQuality(quality);
    setQualityForm({
      title: quality.title || "",
      description: quality.description || "",
      checkpoints: (quality.checkpoints as unknown as string[]) || [],
      standards: (quality.standards as unknown as string[]) || [],
      icon: quality.icon || "CheckCircle2",
      imageId: quality.imageId || null,
      isActive: quality.isActive ?? true,
      category: quality.category || "",
      frequency: quality.frequency || "",
    });
    setShowQualityDialog(true);
  };

  const handleQualityDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = qualityStandards.findIndex((q) => q.id === active.id);
      const newIndex = qualityStandards.findIndex((q) => q.id === over.id);
      const newQualities = arrayMove(qualityStandards, oldIndex, newIndex);
      const updates = newQualities.map((quality, index) => ({
        id: quality.id,
        position: index,
      }));
      reorderQualityMutation.mutate(updates);
    }
  };

  const handleAddCheckpoint = () => {
    if (newCheckpoint) {
      setQualityForm({
        ...qualityForm,
        checkpoints: [...qualityForm.checkpoints, newCheckpoint],
      });
      setNewCheckpoint("");
    }
  };

  const handleRemoveCheckpoint = (index: number) => {
    const newCheckpoints = qualityForm.checkpoints.filter((_, i) => i !== index);
    setQualityForm({ ...qualityForm, checkpoints: newCheckpoints });
  };

  const handleAddStandard = () => {
    if (newStandard) {
      setQualityForm({
        ...qualityForm,
        standards: [...qualityForm.standards, newStandard],
      });
      setNewStandard("");
    }
  };

  const handleRemoveStandard = (index: number) => {
    const newStandards = qualityForm.standards.filter((_, i) => i !== index);
    setQualityForm({ ...qualityForm, standards: newStandards });
  };

  const handleQualityImageSelect = (asset: any) => {
    setQualityForm({ ...qualityForm, imageId: Number(asset.id) });
    setShowQualityImagePicker(false);
  };

  const getPreviewQuality = (): ManufacturingQuality => {
    return {
      id: editingQuality?.id || 0,
      createdAt: editingQuality?.createdAt || new Date(),
      sortOrder: editingQuality?.sortOrder || 0,
      certificateId: editingQuality?.certificateId || null,
      testingMethod: editingQuality?.testingMethod || null,
      criteria: editingQuality?.criteria || null,
      ...qualityForm,
      checkpoints: qualityForm.checkpoints,
      standards: qualityForm.standards,
    } as ManufacturingQuality;
  };

  return (
    <Card variant="glass-premium">
      <CardContent className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Quality Assurance Standards
            </h2>
            <p className="text-sm text-[#68869A]">
              Manage manufacturing quality benchmarks, compliance protocols, and oversight
              checkpoints
            </p>
          </div>
          <Button
            onClick={() => {
              resetQualityForm();
              setShowQualityDialog(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold transition-all px-6 py-5 uppercase text-[10px] tracking-widest"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Quality Standard
          </Button>
        </div>

        <div className="min-h-[400px]">
          {qualityLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500"></div>
              </div>
              <p className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                Auditing Protocols...
              </p>
            </div>
          ) : qualityStandards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01]">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Shield className="size-8 text-white/10" />
              </div>
              <p className="text-white/40 font-medium">No quality standards documented.</p>
              <p className="text-[#68869A] text-sm mt-1">
                Establish your first quality protocol to begin.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleQualityDragEnd}
            >
              <SortableContext
                items={qualityStandards.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-3">
                  {qualityStandards.map((quality) => (
                    <SortableQualityItem
                      key={quality.id}
                      quality={quality}
                      onEdit={handleEditQuality}
                      onDelete={deleteQualityMutation.mutate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <Dialog open={showQualityDialog} onOpenChange={setShowQualityDialog}>
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
                    {editingQuality ? "Edit Quality Standard" : "Define New Standard"}
                  </DialogTitle>
                  <DialogDescription className="text-[#68869A]">
                    Configure technical quality assurance metrics and benchmarks
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

            <form onSubmit={handleQualitySubmit} className="flex-1 overflow-y-auto max-h-[70vh]">
              <div className="p-8 space-y-8">
                <div className={cn("grid gap-10", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="quality-title"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Standard Title
                        </Label>
                        <Input
                          id="quality-title"
                          value={qualityForm.title || ""}
                          onChange={(e) =>
                            setQualityForm({
                              ...qualityForm,
                              title: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                          placeholder="e.g., Fabric Integrity Standard"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="quality-icon"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Visual Symbol
                        </Label>
                        <Select
                          value={qualityForm.icon || "CheckCircle2"}
                          onValueChange={(value) => setQualityForm({ ...qualityForm, icon: value })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-[50px] focus:ring-emerald-500/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                            {Object.keys(qualityIcons).map((icon) => (
                              <SelectItem
                                key={icon}
                                value={icon}
                                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10"
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
                          htmlFor="quality-category"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Process Category
                        </Label>
                        <Input
                          id="quality-category"
                          value={qualityForm.category || ""}
                          onChange={(e) =>
                            setQualityForm({
                              ...qualityForm,
                              category: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                          placeholder="e.g., Raw Materials"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="quality-frequency"
                          className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                        >
                          Audit Frequency
                        </Label>
                        <Input
                          id="quality-frequency"
                          value={qualityForm.frequency || ""}
                          onChange={(e) =>
                            setQualityForm({
                              ...qualityForm,
                              frequency: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                          placeholder="e.g., Every Production Loop"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="quality-description"
                        className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                      >
                        Detailed Criteria
                      </Label>
                      <Textarea
                        id="quality-description"
                        value={qualityForm.description || ""}
                        onChange={(e) =>
                          setQualityForm({
                            ...qualityForm,
                            description: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none"
                        placeholder="Specify explicit quality benchmarks..."
                      />
                    </div>

                    <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                      <Switch
                        id="quality-active"
                        checked={qualityForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setQualityForm({ ...qualityForm, isActive: checked })
                        }
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <Label
                        htmlFor="quality-active"
                        className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer"
                      >
                        Enforcement: {qualityForm.isActive ? "Active" : "Paused"}
                      </Label>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                          Verification Checkpoints
                        </Label>
                        <div className="grid gap-3">
                          {qualityForm.checkpoints.map((checkpoint, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                              <div className="size-2 rounded-full bg-emerald-500/30 ring-4 ring-emerald-500/5 flex-shrink-0" />
                              <div className="flex-1 text-sm text-white/70">{checkpoint}</div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCheckpoint(index)}
                                className="text-red-500/70 hover:text-red-400 p-1"
                                aria-label="Remove Checkpoint"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <Input
                            placeholder="Describe specific checkpoint..."
                            value={newCheckpoint}
                            onChange={(e) => setNewCheckpoint(e.target.value)}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-emerald-500/50 placeholder:text-white/20"
                          />
                          <Button
                            type="button"
                            onClick={handleAddCheckpoint}
                            className="h-11 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-widest px-6"
                          >
                            Add Step
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                          Global Compliance Registry
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {qualityForm.standards.map((standard, index) => (
                            <Badge
                              key={index}
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 gap-2 rounded-lg"
                            >
                              {standard}
                              <button
                                type="button"
                                onClick={() => handleRemoveStandard(index)}
                                className="hover:text-white border-0 bg-transparent p-0 size-auto ml-1.5"
                                aria-label={`Remove ${standard}`}
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <Input
                            placeholder="e.g., ISO-9001:2015"
                            value={newStandard}
                            onChange={(e) => setNewStandard(e.target.value)}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-emerald-500/50 placeholder:text-white/20"
                          />
                          <Button
                            type="button"
                            onClick={handleAddStandard}
                            className="h-11 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-widest px-6 whitespace-nowrap"
                          >
                            Register Standard
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                          Compliance Badge
                        </Label>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowQualityImagePicker(true)}
                            className="flex-1 bg-white/5 border-white/10 h-14 rounded-xl justify-start px-4 text-[#68869A] hover:bg-white/10 hover:text-white transition-all border-0 shadow-none ring-offset-0 focus:ring-0"
                          >
                            <ImageIcon className="mr-3 h-5 w-5 text-emerald-500" />
                            <span className="truncate">
                              {finalSelectedQualityImage
                                ? finalSelectedQualityImage.filename
                                : "Upload Standard Image"}
                            </span>
                          </Button>
                          {finalSelectedQualityImage && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setQualityForm({ ...qualityForm, imageId: null })}
                              className="h-14 w-14 rounded-xl border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-[#68869A]"
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
                      <div className="flex items-center gap-2 mb-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <LayoutTemplate className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                          Protocol Visualization
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-1">
                        <LivePreviewGrid>
                          <QualityCard
                            quality={getPreviewQuality()}
                            index={0}
                            mediaAssets={mediaAssets}
                          />
                        </LivePreviewGrid>
                      </div>
                      <p className="text-[10px] font-medium text-[#68869A] text-center italic">
                        Live rendering of the quality protocol as it will appear on the global
                        production site.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowQualityDialog(false)}
                  className="text-[#68869A] hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createQualityMutation.isPending || updateQualityMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-6 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all outline-none ring-0 border-0"
                >
                  {editingQuality ? "Update Standard" : "Establish Standard"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <MediaPickerModal
          isOpen={showQualityImagePicker}
          onClose={() => setShowQualityImagePicker(false)}
          onSelect={handleQualityImageSelect}
          title="Select Quality Standard Image"
        />
      </CardContent>
    </Card>
  );
}
