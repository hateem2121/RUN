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
import { ABOUT_API } from "@shared/api-constants";
import type { AboutTimelineEntry, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { Edit, GripVertical, Image, Plus, Trash2 } from "lucide-react";
import { useActionState, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface TimelineItemProps {
  entry: AboutTimelineEntry;
  onEdit: (entry: AboutTimelineEntry) => void;
  onDelete: (id: number) => void;
}

function SortableTimelineItem({ entry, onEdit, onDelete }: TimelineItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-white/[0.03] p-4 ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-4">
        <button
          className="mt-1 cursor-grab"
          aria-label="Drag to reorder timeline entry"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-admin-muted/70" aria-hidden="true" />
        </button>

        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-bold text-lg text-primary">{entry.year}</span>
            <h3 className="font-semibold text-lg">{entry.title}</h3>
            {entry.isActive === false && (
              <span className="rounded bg-red-100 px-2 py-1 text-red-600 text-sm dark:bg-red-900/20">
                Hidden
              </span>
            )}
          </div>
          {entry.description && (
            <p className="line-clamp-2 text-admin-muted text-sm">{entry.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(entry)}
            aria-label={`Edit ${entry.year} entry`}
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(entry.id)}
            aria-label={`Delete ${entry.year} entry`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AboutTimelineTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AboutTimelineEntry | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: entries = [], isLoading } = useQuery<AboutTimelineEntry[]>({
    queryKey: [ABOUT_API.TIMELINE],
  });

  const [optimisticEntries, setOptimisticEntries] = useOptimistic(
    entries,
    (
      current,
      action:
        | { type: "reorder"; newEntries: AboutTimelineEntry[] }
        | { type: "delete"; id: number },
    ) => {
      if (action.type === "reorder") return action.newEntries;
      if (action.type === "delete") return current.filter((e) => e.id !== action.id);
      return current;
    },
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = optimisticEntries.findIndex((e) => e.id === active.id);
      const newIndex = optimisticEntries.findIndex((e) => e.id === over.id);

      const newEntries = arrayMove(optimisticEntries, oldIndex, newIndex);
      setOptimisticEntries({ type: "reorder", newEntries });

      try {
        const reorderData = newEntries.map((entry, index) => ({
          id: entry.id,
          sortOrder: index,
        }));

        await apiRequest(ABOUT_API.TIMELINE_REORDER, {
          method: "PATCH",
          body: JSON.stringify({ entries: reorderData }),
        });

        toast.success("Timeline order updated");
        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.TIMELINE] });
        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });
      } catch (_error) {
        toast.error("Failed to update timeline order");
        setOptimisticEntries({ type: "reorder", newEntries: entries });
      }
    }
  }

  const [, submitAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const id = formData.get("id");
      const data = {
        year: formData.get("year"),
        title: formData.get("title"),
        description: formData.get("description"),
        imageId: formData.get("imageId") ? Number(formData.get("imageId")) : null,
        isActive: formData.get("isActive") === "on",
      };

      try {
        if (id) {
          await apiRequest(`${ABOUT_API.TIMELINE}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          });
          toast.success("Timeline entry updated");
        } else {
          await apiRequest(ABOUT_API.TIMELINE, {
            method: "POST",
            body: JSON.stringify(data),
          });
          toast.success("Timeline entry created");
        }

        setIsDialogOpen(false);
        setEditingEntry(null);
        setSelectedImageId(null);
        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.TIMELINE] });
        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });
        return { success: true };
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save timeline entry");
        return { success: false, error };
      }
    },
    null,
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this timeline entry?")) return;

    setOptimisticEntries({ type: "delete", id });
    try {
      await apiRequest(`${ABOUT_API.TIMELINE}/${id}`, {
        method: "DELETE",
      });
      toast.success("Timeline entry deleted");
      getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.TIMELINE] });
      getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });
    } catch (_error) {
      toast.error("Failed to delete timeline entry");
      getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.TIMELINE] });
    }
  };

  const handleEdit = (entry: AboutTimelineEntry) => {
    setEditingEntry(entry);
    setSelectedImageId(entry.imageId || null);
    setIsDialogOpen(true);
  };

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Timeline Events</CardTitle>
          <CardDescription>Manage the history and milestones of RUN Apparel.</CardDescription>
        </div>
        <Button
          onClick={() => {
            setEditingEntry(null);
            setSelectedImageId(null);
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Event
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : optimisticEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-admin-muted">No timeline events found. Start by adding one.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={optimisticEntries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {optimisticEntries.map((entry) => (
                  <SortableTimelineItem
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Timeline Event" : "Add Timeline Event"}</DialogTitle>
          </DialogHeader>
          <form action={submitAction}>
            <DialogBody className="space-y-4">
              {editingEntry && <input type="hidden" name="id" value={editingEntry.id} />}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Year
                </Label>
                <Input
                  id="year"
                  name="year"
                  defaultValue={editingEntry?.year || ""}
                  placeholder="e.g. 1889"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingEntry?.title || ""}
                  placeholder="Event title"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingEntry?.description || ""}
                  placeholder="Event details"
                  className="col-span-3 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Image</Label>
                <div className="col-span-3 flex items-center gap-3">
                  <input type="hidden" name="imageId" value={selectedImageId || ""} />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 text-admin-muted"
                    onClick={() => setIsMediaPickerOpen(true)}
                    aria-label="Select event image"
                  >
                    <Image className="h-4 w-4" aria-hidden="true" />
                    {selectedImageId ? `Asset ID: ${selectedImageId}` : "Select Image"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <div className="col-span-3">
                  <Switch
                    id="isActive"
                    name="isActive"
                    defaultChecked={editingEntry ? editingEntry.isActive === true : true}
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingEntry ? "Save Changes" : "Add Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(assets: MediaAsset[] | MediaAsset) => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) {
            setSelectedImageId(asset.id);
          }
          setIsMediaPickerOpen(false);
        }}
        mediaPickerTarget="about-timeline"
        selectionMode="single"
      />
    </Card>
  );
}
