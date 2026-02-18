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
import type { ManufacturingProcess, MediaAsset } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { ProcessCard } from "@/components/shared/manufacturing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody, // Added missing import
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
  efficiency: number; // Override nullable from schema
  step: number; // Override nullable
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
            <h4 className="font-medium text-foreground">{process.title || process.name}</h4>
            <div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground/80">Step {process.step}</span>
              </span>
              <span>{process.duration}</span>
              <span>{process.efficiency}% Efficiency</span>
            </div>
            {process.description && (
              <p className="mt-2 text-muted-foreground text-sm">{process.description}</p>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-start gap-2">
          <Badge variant={(process.isActive ?? true) ? "status-info" : "status-inactive"}>
            {(process.isActive ?? true) ? "Active" : "Inactive"}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => onEdit(process)}>
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(process.id)}
            title="Delete Process"
            description="Are you sure you want to delete this manufacturing process? This action cannot be undone."
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

  // Optimized Process queries with performance tracking and throttled renders
  const { data: processes = [], isLoading: processesLoading } = useOptimizedQuery<
    ManufacturingProcess[]
  >({
    queryKey: ["/api/manufacturing-processes"],
    staleTime: 30 * 60 * 1000, // Extended to 30 minutes for performance
    refetchOnWindowFocus: false, // Disable unnecessary refetches
    refetchOnMount: false, // Only fetch if stale
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

  // Fetch specific process media if mediaIds are set
  const { data: specificProcessMedia } = useQuery({
    queryKey: [`/api/media/bulk`, processForm.mediaIds],
    queryFn: async () => {
      if (!processForm.mediaIds.length) {
        return [];
      }
      const response = await fetch(`/api/media?ids=${processForm.mediaIds.join(",")}`);
      if (!response.ok) {
        return [];
      }
      const result = await response.json();
      return result.success ? result.data.data : [];
    },
    enabled: processForm.mediaIds.length > 0,
    staleTime: 30 * 60 * 1000, // Extended cache values
  });

  const selectedProcessMedia = Array.isArray(mediaAssets)
    ? mediaAssets.filter((asset) => processForm.mediaIds.includes(asset.id))
    : [];

  // Use specific fetched assets combined with main list assets
  const finalSelectedProcessMedia = [
    ...selectedProcessMedia,
    ...(specificProcessMedia || []),
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i); // Deduplicate

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
    // Ensure name is populated if title is provided
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

  const handleProcessMediaSelect = (assets: MediaAsset[] | MediaAsset) => {
    const newAssets = Array.isArray(assets) ? assets : [assets];
    const newIds = newAssets.map((a) => a.id);
    setProcessForm({ ...processForm, mediaIds: newIds });
    setShowProcessImagePicker(false);
  };

  // Helper to generate preview object
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manufacturing Processes</CardTitle>
            <CardDescription>Manage production steps and efficiency metrics</CardDescription>
          </div>
          <Button
            onClick={() => {
              resetProcessForm();
              setShowProcessDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Process
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {processesLoading ? (
          <div className="py-8 text-center">Loading processes...</div>
        ) : processes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No manufacturing processes found. Create your first process to get started.
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
              <div className="space-y-2">
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

        {/* Process Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent
            contentType="form"
            className={showPreview ? "w-full max-w-6xl" : "max-w-lg"}
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{editingProcess ? "Edit Process" : "Add New Process"}</DialogTitle>
                  <DialogDescription>
                    Configure manufacturing process step and details
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="hidden gap-2 sm:flex"
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
            </DialogHeader>

            <form onSubmit={handleProcessSubmit} className="flex min-h-0 flex-1 flex-col">
              <DialogBody className="space-y-4 px-1">
                <div className={showPreview ? "grid grid-cols-1 gap-8 lg:grid-cols-2" : ""}>
                  {/* Left Column: Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="process-title">Title</Label>
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
                          placeholder="e.g., Fabric Cutting"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="process-step">Step Number</Label>
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
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="process-category">Category</Label>
                        <Input
                          id="process-category"
                          value={processForm.category || ""}
                          onChange={(e) =>
                            setProcessForm({
                              ...processForm,
                              category: e.target.value,
                            })
                          }
                          placeholder="e.g., Pre-production"
                        />
                      </div>
                      <div>
                        <Label htmlFor="process-icon">Icon</Label>
                        <Select
                          value={processForm.iconName || "Factory"}
                          onValueChange={(value) =>
                            setProcessForm({ ...processForm, iconName: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {processIcons.map((icon) => (
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
                        <Label htmlFor="process-efficiency">Efficiency (%)</Label>
                        <div className="flex items-center gap-2">
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
                          />
                          <span className="text-muted-foreground text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="process-duration">Duration</Label>
                        <Input
                          id="process-duration"
                          value={processForm.duration || ""}
                          onChange={(e) =>
                            setProcessForm({
                              ...processForm,
                              duration: e.target.value,
                            })
                          }
                          placeholder="e.g., 2-3 days"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="process-description">Description</Label>
                      <Textarea
                        id="process-description"
                        value={processForm.description || ""}
                        onChange={(e) =>
                          setProcessForm({
                            ...processForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe this manufacturing process..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="process-active"
                        checked={processForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setProcessForm({ ...processForm, isActive: checked })
                        }
                      />
                      <Label htmlFor="process-active">Active</Label>
                    </div>

                    {/* Media Selection */}
                    <div>
                      <Label>Process Media</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProcessImagePicker(true)}
                          className="flex-1"
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          {selectedProcessMedia.length > 0
                            ? `Add more media (${selectedProcessMedia.length} selected)`
                            : "Select process media"}
                        </Button>
                        {selectedProcessMedia.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setProcessForm({ ...processForm, mediaIds: [] })}
                            title="Clear all media"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Display selected media items */}
                    {selectedProcessMedia.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {finalSelectedProcessMedia.map((media) => (
                          <div
                            key={media.id}
                            className="relative flex items-center gap-2 rounded border bg-muted/50 p-2"
                            data-testid={`process-media-item-${media.id}`}
                          >
                            <img
                              src={media.thumbnailUrl || media.url}
                              alt={media.altText || media.filename}
                              className="h-12 w-12 rounded object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-sm">{media.filename}</p>
                              <p className="text-muted-foreground text-xs">{media.type}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedIds = processForm.mediaIds.filter(
                                  (id) => id !== media.id,
                                );
                                setProcessForm({
                                  ...processForm,
                                  mediaIds: updatedIds,
                                });
                              }}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              title={`Remove ${media.filename}`}
                              data-testid={`button-remove-media-${media.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Preview */}
                  {showPreview && (
                    <div className="sticky top-0 self-start">
                      <LivePreviewGrid>
                        <ProcessCard
                          process={getPreviewProcess()}
                          index={0}
                          mediaAssets={[...mediaAssets, ...finalSelectedProcessMedia]} // Ensure we have context of both existing and picked media
                        />
                      </LivePreviewGrid>
                      <div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
                        <LayoutTemplate className="h-4 w-4" />
                        Drawing from {finalSelectedProcessMedia.length} connected media assets
                      </div>
                    </div>
                  )}
                </div>
              </DialogBody>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowProcessDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProcessMutation.isPending || updateProcessMutation.isPending}
                >
                  {editingProcess ? "Update Process" : "Create Process"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Process Media Picker */}
        <StandardMediaSelectionDialog
          isOpen={showProcessImagePicker}
          onClose={() => setShowProcessImagePicker(false)}
          onSelect={handleProcessMediaSelect}
          title="Select Process Media"
          mediaPickerTarget="process-media"
          selectionMode="multiple"
        />
      </CardContent>
    </Card>
  );
}
