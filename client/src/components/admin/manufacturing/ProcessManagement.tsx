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
import { DeleteConfirmationDialog, StatusBadge } from "@/components/admin/shared";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { ProcessCard } from "@/components/shared/manufacturing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnhancedDialog,
  EnhancedDialogBody, // Added missing import
  EnhancedDialogContent,
  EnhancedDialogDescription,
  EnhancedDialogFooter,
  EnhancedDialogHeader,
  EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
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

interface ProcessManagementProps {
  mediaAssets: MediaAsset[];
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
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border p-4 mb-2 shadow-sm-xs">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move text-gray-400 hover:text-gray-600 mt-1"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{process.title || process.name}</h4>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-700">Step {process.step}</span>
              </span>
              <span>{process.duration}</span>
              <span>{process.efficiency}% Efficiency</span>
            </div>
            {process.description && (
              <p className="text-sm text-gray-600 mt-2">{process.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2 ml-4">
          <StatusBadge isActive={process.isActive ?? true} activeColor="blue" />
          <Button size="sm" variant="ghost" onClick={() => onEdit(process)}>
            <Edit className="w-4 h-4" />
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

export function ProcessManagement({ mediaAssets }: ProcessManagementProps) {
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
      if (!processForm.mediaIds.length) return [];
      const response = await fetch(`/api/media?ids=${processForm.mediaIds.join(",")}`);
      if (!response.ok) return [];
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

  const handleProcessDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
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
            <Plus className="w-4 h-4 mr-2" />
            Add Process
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {processesLoading ? (
          <div className="text-center py-8">Loading processes...</div>
        ) : processes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
        <EnhancedDialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <EnhancedDialogContent
            contentType="form"
            className={showPreview ? "max-w-6xl w-full" : "max-w-lg"}
          >
            <EnhancedDialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <EnhancedDialogTitle>
                    {editingProcess ? "Edit Process" : "Add New Process"}
                  </EnhancedDialogTitle>
                  <EnhancedDialogDescription>
                    Configure manufacturing process step and details
                  </EnhancedDialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2 hidden sm:flex"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
            </EnhancedDialogHeader>

            <form onSubmit={handleProcessSubmit} className="flex flex-col min-h-0 flex-1">
              <EnhancedDialogBody className="space-y-4 px-1">
                <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : ""}>
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
                            setProcessForm({ ...processForm, step: parseInt(e.target.value) || 0 })
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
                            setProcessForm({ ...processForm, category: e.target.value })
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
                                efficiency: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="process-duration">Duration</Label>
                        <Input
                          id="process-duration"
                          value={processForm.duration || ""}
                          onChange={(e) =>
                            setProcessForm({ ...processForm, duration: e.target.value })
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
                          setProcessForm({ ...processForm, description: e.target.value })
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
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProcessImagePicker(true)}
                          className="flex-1"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
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
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {finalSelectedProcessMedia.map((media) => (
                          <div
                            key={media.id}
                            className="relative flex items-center gap-2 p-2 border rounded bg-muted/50"
                            data-testid={`process-media-item-${media.id}`}
                          >
                            <img
                              src={media.thumbnailUrl || media.url}
                              alt={media.altText || media.filename}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{media.filename}</p>
                              <p className="text-xs text-muted-foreground">{media.type}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedIds = processForm.mediaIds.filter(
                                  (id) => id !== media.id,
                                );
                                setProcessForm({ ...processForm, mediaIds: updatedIds });
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={`Remove ${media.filename}`}
                              data-testid={`button-remove-media-${media.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
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
                      <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4" />
                        Drawing from {finalSelectedProcessMedia.length} connected media assets
                      </div>
                    </div>
                  )}
                </div>
              </EnhancedDialogBody>

              <EnhancedDialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowProcessDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProcessMutation.isPending || updateProcessMutation.isPending}
                >
                  {editingProcess ? "Update Process" : "Create Process"}
                </Button>
              </EnhancedDialogFooter>
            </form>
          </EnhancedDialogContent>
        </EnhancedDialog>

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
