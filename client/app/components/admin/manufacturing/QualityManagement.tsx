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
  Image,
  LayoutTemplate,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { LivePreviewGrid } from "@/components/admin/manufacturing/LivePreviewGrid";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { QualityCard } from "@/components/shared/manufacturing/QualityCard";
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

const qualityIcons = ["CheckCircle2", "Shield", "ClipboardCheck", "Award"];

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

  const IconComponent =
    {
      CheckCircle2,
      Shield,
      ClipboardCheck,
      Award,
    }[quality.icon || "CheckCircle2"] || CheckCircle2;

  // Ensure checkpoints and standards are arrays
  const checkpoints = (quality.checkpoints as unknown as string[]) || [];
  const standards = (quality.standards as unknown as string[]) || [];

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
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <IconComponent className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">
                  {quality.title || "Untitled Quality Standard"}
                </h4>
                {quality.description && (
                  <p className="mt-1 text-muted-foreground text-sm">{quality.description}</p>
                )}
                {checkpoints.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-muted-foreground text-xs">Checkpoints:</p>
                    <div className="text-muted-foreground text-xs">
                      {checkpoints.slice(0, 3).map((checkpoint, index) => (
                        <span key={index} className="mr-4 inline-block">
                          • {checkpoint}
                        </span>
                      ))}
                      {checkpoints.length > 3 && (
                        <span className="text-muted-foreground">
                          +{checkpoints.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {standards.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-muted-foreground text-xs">Standards:</p>
                    <div className="flex flex-wrap gap-1 text-muted-foreground text-xs">
                      {standards.map((standard, idx) => (
                        <span key={idx} className="rounded-md bg-muted px-2 py-1">
                          {standard}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-start gap-2">
          <Badge variant={(quality.isActive ?? true) ? "status-active" : "status-inactive"}>
            {(quality.isActive ?? true) ? "Active" : "Inactive"}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => onEdit(quality)}>
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(quality.id)}
            title="Delete Quality Standard"
            description="Are you sure you want to delete this quality standard? This action cannot be undone."
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

  // Optimized Quality queries with performance tracking and throttled renders
  const { data: qualityStandards = [], isLoading: qualityLoading } = useOptimizedQuery<
    ManufacturingQuality[]
  >({
    queryKey: ["/api/manufacturing-qualities"],
    staleTime: 30 * 60 * 1000, // Extended to 30 minutes for performance
    refetchOnWindowFocus: false, // Disable unnecessary refetches
    refetchOnMount: false, // Only fetch if stale
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

  // Fetch specific quality image if imageId is set
  const { data: specificQualityImage } = useQuery({
    queryKey: [`/api/media/${qualityForm.imageId}`, qualityForm.imageId],
    queryFn: async () => {
      if (!qualityForm.imageId) {
        return null;
      }
      const response = await fetch(`/api/media/${qualityForm.imageId}`);
      if (!response.ok) {
        return null;
      }
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!qualityForm.imageId,
    staleTime: 30 * 60 * 1000, // Extended cache for media assets
  });

  const selectedQualityImage = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === qualityForm.imageId)
    : undefined;

  // Use specific fetched asset as fallback if not found in main list
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
      // name is NOT part of schema, so we rely on required title
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
      checkpoints: (quality.checkpoints as unknown as string[]) || [], // Ensure array
      standards: (quality.standards as unknown as string[]) || [], // Ensure array
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

  const handleQualityImageSelect = (assets: MediaAsset[] | MediaAsset) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (!asset) {
      return;
    }
    setQualityForm({ ...qualityForm, imageId: asset.id });
    setShowQualityImagePicker(false);
  };

  // Helper to generate preview object
  const getPreviewQuality = (): ManufacturingQuality => {
    return {
      id: editingQuality?.id || 0,
      createdAt: editingQuality?.createdAt || new Date(),
      sortOrder: editingQuality?.sortOrder || 0,
      certificateId: editingQuality?.certificateId || null,
      testingMethod: editingQuality?.testingMethod || null,
      criteria: editingQuality?.criteria || null,
      ...qualityForm,
      // Cast arrays to match jsonb types in schema
      checkpoints: qualityForm.checkpoints,
      standards: qualityForm.standards,
    } as ManufacturingQuality;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quality Standards Management</CardTitle>
            <CardDescription>
              Manage quality assurance standards, checkpoints, and compliance requirements
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              resetQualityForm();
              setShowQualityDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Quality Standard
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {qualityLoading ? (
          <div className="py-8 text-center">Loading quality standards...</div>
        ) : qualityStandards.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No quality standards found. Create your first quality standard to get started.
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
              <div className="space-y-2">
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

        {/* Quality Standards Dialog */}
        <Dialog open={showQualityDialog} onOpenChange={setShowQualityDialog}>
          <DialogContent
            contentType="form"
            className={showPreview ? "w-full max-w-6xl" : "w-full max-w-xl"}
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>
                    {editingQuality ? "Edit Quality Standard" : "Add New Quality Standard"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure quality assurance requirements and standards
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

            <form onSubmit={handleQualitySubmit} className="flex min-h-0 flex-1 flex-col">
              <DialogBody className="space-y-4 px-1">
                <div className={showPreview ? "flex gap-6" : ""}>
                  <div className={showPreview ? "flex-1 space-y-4" : "space-y-4"}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quality-title">Title</Label>
                        <Input
                          id="quality-title"
                          value={qualityForm.title || ""}
                          onChange={(e) =>
                            setQualityForm({
                              ...qualityForm,
                              title: e.target.value,
                            })
                          }
                          placeholder="e.g., ISO 9001 Compliance"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="quality-icon">Icon</Label>
                        <Select
                          value={qualityForm.icon || ""}
                          onValueChange={(value) => setQualityForm({ ...qualityForm, icon: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {qualityIcons.map((icon) => (
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
                        <Label htmlFor="quality-category">Category</Label>
                        <Input
                          id="quality-category"
                          value={qualityForm.category || ""}
                          onChange={(e) =>
                            setQualityForm({
                              ...qualityForm,
                              category: e.target.value,
                            })
                          }
                          placeholder="e.g., Process Control"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quality-frequency">Frequency</Label>
                        <Input
                          id="quality-frequency"
                          data-testid="input-quality-frequency"
                          value={qualityForm.frequency || ""}
                          onChange={(e) =>
                            setQualityForm({
                              ...qualityForm,
                              frequency: e.target.value,
                            })
                          }
                          placeholder="e.g., Every batch"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="quality-description">Description</Label>
                      <Textarea
                        id="quality-description"
                        value={qualityForm.description || ""}
                        onChange={(e) =>
                          setQualityForm({
                            ...qualityForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe this quality standard..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="quality-active"
                        checked={qualityForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setQualityForm({ ...qualityForm, isActive: checked })
                        }
                      />
                      <Label htmlFor="quality-active">Active</Label>
                    </div>

                    {/* Checkpoints Section */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label>Quality Checkpoints</Label>
                      </div>
                      <div className="mb-4 space-y-2">
                        {qualityForm.checkpoints.map((checkpoint, index) => (
                          <div key={index} className="flex items-center gap-2 rounded border p-2">
                            <div className="flex-1">{checkpoint}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCheckpoint(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add quality checkpoint"
                          value={newCheckpoint}
                          onChange={(e) => setNewCheckpoint(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddCheckpoint} size="sm">
                          Add Checkpoint
                        </Button>
                      </div>
                    </div>

                    {/* Standards Section */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label>Compliance Standards</Label>
                      </div>
                      <div className="mb-4 space-y-2">
                        {qualityForm.standards.map((standard, index) => (
                          <div key={index} className="flex items-center gap-2 rounded border p-2">
                            <div className="flex-1">{standard}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStandard(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add compliance standard"
                          value={newStandard}
                          onChange={(e) => setNewStandard(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddStandard} size="sm">
                          Add Standard
                        </Button>
                      </div>
                    </div>

                    {/* Image Selection */}
                    <div>
                      <Label>Quality Standard Image</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowQualityImagePicker(true)}
                          className="flex-1"
                        >
                          <Image className="mr-2 h-4 w-4" />
                          {finalSelectedQualityImage
                            ? finalSelectedQualityImage.filename
                            : "Select Image"}
                        </Button>
                        {finalSelectedQualityImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setQualityForm({ ...qualityForm, imageId: null })}
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
                        <div className="mb-4 flex items-center gap-2 text-muted-foreground text-sm">
                          <LayoutTemplate className="h-4 w-4" />
                          <span>Live Preview</span>
                        </div>
                        <LivePreviewGrid>
                          <QualityCard
                            quality={getPreviewQuality()}
                            index={0}
                            mediaAssets={mediaAssets}
                          />
                        </LivePreviewGrid>
                        <div className="rounded-lg bg-muted/50 p-4 text-muted-foreground text-xs">
                          <p>
                            This preview shows how the quality standard card will appear on the
                            public site. The layout size may adjust based on content volume.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogBody>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowQualityDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createQualityMutation.isPending || updateQualityMutation.isPending}
                >
                  {editingQuality ? "Update Quality Standard" : "Create Quality Standard"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Quality Image Picker */}
        <StandardMediaSelectionDialog
          isOpen={showQualityImagePicker}
          onClose={() => setShowQualityImagePicker(false)}
          onSelect={handleQualityImageSelect}
          title="Select Quality Standard Image"
          mediaPickerTarget="quality-image"
          selectionMode="single"
        />
      </CardContent>
    </Card>
  );
}
