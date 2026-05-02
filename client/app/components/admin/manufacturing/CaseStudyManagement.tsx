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
import type { ManufacturingCaseStudy, MediaAsset } from "@shared/index";
import { Edit, GripVertical, Plus, Trash2, Trophy } from "lucide-react";
import { useActionState, useOptimistic, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { MediaPickerModal } from "@/components/admin/shared/MediaPickerModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useManufacturingMutations } from "@/hooks/useManufacturingMutations";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { cn } from "@/lib/utils";

interface CaseStudyManagementProps {
  mediaAssets?: MediaAsset[];
}

function SortableCaseStudyItem({
  caseStudy,
  onEdit,
  onDelete,
}: {
  caseStudy: ManufacturingCaseStudy;
  onEdit: (caseStudy: ManufacturingCaseStudy) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: caseStudy.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
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
              {caseStudy.metric}
            </span>
            <h4 className="font-bold text-white tracking-tight truncate">
              {caseStudy.client} — {caseStudy.type}
            </h4>
          </div>
          <p className="mt-2 text-[#68869A] text-xs leading-relaxed line-clamp-2 max-w-2xl italic">
            "{caseStudy.quote}" — {caseStudy.author}
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase tracking-wider border-0",
              caseStudy.isActive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/5 text-[#68869A]",
            )}
          >
            {caseStudy.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(caseStudy)}
            className="size-8 rounded-lg hover:bg-[#D4A853]/10 hover:text-[#D4A853]"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            asChild
            onConfirm={() => onDelete(caseStudy.id)}
            title="Delete Case Study"
            description="Are you sure you want to delete this case study? This action cannot be undone."
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                title="Delete Case Study"
                aria-label="Delete Case Study"
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

export function CaseStudyManagement({ mediaAssets = [] }: CaseStudyManagementProps = {}) {
  const [editingCaseStudy, setEditingCaseStudy] = useState<ManufacturingCaseStudy | null>(null);
  const [showCaseStudyDialog, setShowCaseStudyDialog] = useState(false);
  const [showCaseStudyImagePicker, setShowCaseStudyImagePicker] = useState(false);

  const [caseStudyData, setCaseStudyData] = useState<Partial<ManufacturingCaseStudy>>({
    client: "",
    type: "",
    metric: "",
    description: "",
    quote: "",
    author: "",
    isActive: true,
    imageId: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: caseStudies = [], isLoading: caseStudiesLoading } = useOptimizedQuery<
    ManufacturingCaseStudy[]
  >({
    queryKey: ["/api/manufacturing-case-studies"],
    staleTime: 30 * 60 * 1000,
  });

  const [optimisticCaseStudies, setOptimisticCaseStudies] = useOptimistic(
    caseStudies,
    (
      state,
      action: {
        type: "add" | "update" | "delete" | "reorder";
        payload: ManufacturingCaseStudy | number | ManufacturingCaseStudy[];
      },
    ) => {
      switch (action.type) {
        case "add":
          return [...state, action.payload as ManufacturingCaseStudy];
        case "update": {
          const updated = action.payload as ManufacturingCaseStudy;
          return state.map((item) => (item.id === updated.id ? updated : item));
        }
        case "delete":
          return state.filter((item) => item.id !== (action.payload as number));
        case "reorder":
          return action.payload as ManufacturingCaseStudy[];
        default:
          return state;
      }
    },
  );

  const { createMutation, updateMutation, deleteMutation, reorderMutation } =
    useManufacturingMutations({
      entity: "case-studies",
      entityType: "Case Study",
      entityTypePlural: "caseStudies",
      queryKey: "/api/manufacturing-case-studies",
      onSuccess: () => {
        setShowCaseStudyDialog(false);
        setEditingCaseStudy(null);
        resetCaseStudyForm();
      },
    });

  const [_state, formAction, isPending] = useActionState(
    async (_prevState: { success: boolean } | null, formData: FormData) => {
      const data = {
        client: formData.get("client") as string,
        type: formData.get("type") as string,
        metric: formData.get("metric") as string,
        description: formData.get("description") as string,
        quote: formData.get("quote") as string,
        author: formData.get("author") as string,
        isActive: formData.get("isActive") === "on",
        imageId: caseStudyData.imageId,
      };

      if (editingCaseStudy) {
        setOptimisticCaseStudies({
          type: "update",
          payload: {
            ...editingCaseStudy,
            ...data,
            imageId: data.imageId ?? null,
            updatedAt: new Date(),
          },
        });
        await updateMutation.mutateAsync({ id: editingCaseStudy.id, data });
      } else {
        const tempId = Date.now();
        setOptimisticCaseStudies({
          type: "add",
          payload: {
            ...data,
            id: tempId,
            sortOrder: caseStudies.length,
            imageId: data.imageId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as ManufacturingCaseStudy,
        });
        await createMutation.mutateAsync({ ...data, sortOrder: caseStudies.length });
      }
      return { success: true };
    },
    { success: false },
  );

  const resetCaseStudyForm = () => {
    setCaseStudyData({
      client: "",
      type: "",
      metric: "",
      description: "",
      quote: "",
      author: "",
      isActive: true,
      imageId: null,
    });
  };

  const handleEditCaseStudy = (caseStudy: ManufacturingCaseStudy) => {
    setEditingCaseStudy(caseStudy);
    setCaseStudyData(caseStudy);
    setShowCaseStudyDialog(true);
  };

  const handleCaseStudyDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = optimisticCaseStudies.findIndex((p) => p.id === active.id);
      const newIndex = optimisticCaseStudies.findIndex((p) => p.id === over.id);
      const newCaseStudies = arrayMove(optimisticCaseStudies, oldIndex, newIndex);

      setOptimisticCaseStudies({ type: "reorder", payload: newCaseStudies });

      const updates = newCaseStudies.map((item, index) => ({
        id: item.id,
        position: index,
      }));
      reorderMutation.mutate(updates);
    }
  };

  const selectedImage = mediaAssets.find((a) => a.id === caseStudyData.imageId);

  return (
    <Card variant="glass-premium">
      <CardContent className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Success Stories</h2>
            <p className="text-sm text-[#68869A]">
              Highlight manufacturing wins and B2B partnerships
            </p>
          </div>
          <Button
            onClick={() => {
              resetCaseStudyForm();
              setShowCaseStudyDialog(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold transition-all px-6 py-5 uppercase text-[10px] tracking-widest"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Story
          </Button>
        </div>

        <div className="min-h-[400px]">
          {caseStudiesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853] [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853] [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853]"></div>
              </div>
              <p className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                Retrieving Stories...
              </p>
            </div>
          ) : optimisticCaseStudies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01]">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Trophy className="size-8 text-white/10" />
              </div>
              <p className="text-white/40 font-medium">No success stories found.</p>
              <p className="text-[#68869A] text-sm mt-1">
                Share your first manufacturing partnership win.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCaseStudyDragEnd}
            >
              <SortableContext
                items={optimisticCaseStudies.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-3">
                  {optimisticCaseStudies.map((caseStudy) => (
                    <SortableCaseStudyItem
                      key={caseStudy.id}
                      caseStudy={caseStudy}
                      onEdit={handleEditCaseStudy}
                      onDelete={(id) => {
                        setOptimisticCaseStudies({ type: "delete", payload: id });
                        deleteMutation.mutate(id);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <Dialog open={showCaseStudyDialog} onOpenChange={setShowCaseStudyDialog}>
          <DialogContent className="bg-[#0A0A0A]/95 border-white/10 backdrop-blur-2xl text-white rounded-3xl p-0 overflow-hidden max-w-xl">
            <div className="p-8 border-b border-white/5">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {editingCaseStudy ? "Edit Success Story" : "Add Success Story"}
              </DialogTitle>
              <DialogDescription className="text-[#68869A]">
                Configure case study details and partnership highlights
              </DialogDescription>
            </div>

            <form action={formAction} className="flex-1 overflow-y-auto max-h-[70vh]">
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                      Client Name
                    </Label>
                    <Input
                      name="client"
                      value={caseStudyData.client}
                      onChange={(e) =>
                        setCaseStudyData({ ...caseStudyData, client: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white rounded-xl py-6"
                      placeholder="e.g., Global Athletics"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                      Project Type
                    </Label>
                    <Input
                      name="type"
                      value={caseStudyData.type}
                      onChange={(e) => setCaseStudyData({ ...caseStudyData, type: e.target.value })}
                      className="bg-white/5 border-white/10 text-white rounded-xl py-6"
                      placeholder="e.g., Teamwear Pro"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                    Key Performance Metric
                  </Label>
                  <Input
                    name="metric"
                    value={caseStudyData.metric}
                    onChange={(e) => setCaseStudyData({ ...caseStudyData, metric: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6"
                    placeholder="e.g., -15% Production Waste"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                    Client Quote
                  </Label>
                  <Textarea
                    name="quote"
                    value={caseStudyData.quote}
                    onChange={(e) => setCaseStudyData({ ...caseStudyData, quote: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl min-h-[80px]"
                    placeholder="Their manufacturing speed changed our seasonal rollout..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                    Quote Author
                  </Label>
                  <Input
                    name="author"
                    value={caseStudyData.author}
                    onChange={(e) => setCaseStudyData({ ...caseStudyData, author: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6"
                    placeholder="e.g., Jane Doe, Product Director"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                    Detailed Description
                  </Label>
                  <Textarea
                    name="description"
                    value={caseStudyData.description}
                    onChange={(e) =>
                      setCaseStudyData({ ...caseStudyData, description: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px]"
                    placeholder="Dive deeper into the technical challenges and solutions..."
                    required
                  />
                </div>

                <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <Switch
                    id="case-active"
                    name="isActive"
                    checked={caseStudyData.isActive ?? true}
                    onCheckedChange={(checked) =>
                      setCaseStudyData({ ...caseStudyData, isActive: checked })
                    }
                    className="data-[state=checked]:bg-[#D4A853]"
                  />
                  <Label
                    htmlFor="case-active"
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer"
                  >
                    Show in Public Feed
                  </Label>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                    Cover Image
                  </Label>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="size-16 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
                      {selectedImage ? (
                        <img
                          src={selectedImage.url}
                          className="size-full object-cover"
                          alt="Preview"
                        />
                      ) : (
                        <Trophy className="size-6 text-white/10" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white truncate mb-1">
                        {selectedImage?.filename || "No image selected"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCaseStudyImagePicker(true)}
                        className="text-[10px] font-bold text-[#D4A853] uppercase tracking-wider"
                      >
                        {selectedImage ? "Change" : "Select Image"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCaseStudyDialog(false)}
                  className="text-[#68869A] hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-8 py-6 font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  {isPending ? "Syncing..." : editingCaseStudy ? "Update Story" : "Publish Story"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <MediaPickerModal
          isOpen={showCaseStudyImagePicker}
          onClose={() => setShowCaseStudyImagePicker(false)}
          onSelect={(asset) => {
            setCaseStudyData({ ...caseStudyData, imageId: Number(asset.id) });
            setShowCaseStudyImagePicker(false);
          }}
          title="Select Story Cover"
        />
      </CardContent>
    </Card>
  );
}
