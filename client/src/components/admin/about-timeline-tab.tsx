import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ADMIN_MEDIA_QUERIES, buildMediaApiParams } from "@shared/api-constants";
import type { AboutTimelineEntry, MediaAsset } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Edit, GripVertical, Image, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedDialog, EnhancedDialogContent, EnhancedDialogFooter, EnhancedDialogHeader, EnhancedDialogTitle } from "@/components/ui/enhanced-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createMediaQueryKey } from '@/lib/media-query-keys';
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface TimelineItemProps {
  entry: AboutTimelineEntry;
  onEdit: (entry: AboutTimelineEntry) => void;
  onDelete: (id: number) => void;
}

function SortableTimelineItem({ entry, onEdit, onDelete }: TimelineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-950 border rounded-lg p-4 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-4">
        <button
          className="mt-1 cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-primary">{entry.year}</span>
            <h3 className="text-lg font-semibold">{entry.title}</h3>
          </div>
          {entry.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{entry.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(entry)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AboutTimelineTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AboutTimelineEntry | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    title: "",
    description: "",
    imageId: undefined as number | undefined,
    isActive: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: entries = [], isLoading } = useQuery<AboutTimelineEntry[]>({
    queryKey: ['/api/about-timeline'],
  });

  const { data: mediaResponse } = useQuery<{ success: boolean; data: { data: MediaAsset[] } }>({
    queryKey: createMediaQueryKey.recent(50),
    queryFn: async () => {
      // Only fetch 50 recent media assets instead of 1000+
      const response = await fetch(`/api/media?${buildMediaApiParams(ADMIN_MEDIA_QUERIES.RECENT_ADMIN)}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    },
  });

  const mediaAssets = mediaResponse?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/about-timeline', { method: 'POST', body: data });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-timeline'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Timeline entry created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create timeline entry", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/about-timeline/${id}`, { method: 'PATCH', body: data });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-timeline'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Timeline entry updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update timeline entry", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/about-timeline/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-timeline'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Timeline entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete timeline entry", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (entries: { id: number; position: number }[]) => {
      return apiRequest('/api/about-timeline/reorder', { method: 'PATCH', body: { entries } });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-timeline'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = entries.findIndex((item) => item.id === active.id);
      const newIndex = entries.findIndex((item) => item.id === over.id);

      const newEntries = arrayMove(entries, oldIndex, newIndex);
      const reorderedEntries = newEntries.map((entry, index) => ({
        id: entry.id,
        position: index
      }));

      getQueryClient().setQueryData(['/api/about-timeline'], newEntries);
      reorderMutation.mutate(reorderedEntries);
    }
  };

  const handleEdit = (entry: AboutTimelineEntry) => {
    setEditingEntry(entry);
    setFormData({
      year: entry.year.toString(),
      title: entry.title,
      description: entry.description || "",
      imageId: entry.imageId || undefined,
      isActive: entry.isActive !== false
    });
    // Load existing media only when opening dialog for edit
    if (entry.imageId) {
      const media = mediaAssets.find((m: MediaAsset) => m.id === entry.imageId);
      if (media) {
        setSelectedMedia(media);
      } else {
        // If not in cache, fetch by ID
        fetch(`/api/media/${entry.imageId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.success && data?.data) {
              setSelectedMedia(data.data);
            }
          })
          .catch(() => setSelectedMedia(null));
      }
    } else {
      setSelectedMedia(null);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this timeline entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    setSelectedMedia(null);
    setFormData({
      year: new Date().getFullYear().toString(),
      title: "",
      description: "",
      imageId: undefined,
      isActive: true
    });
  };


  const sortedEntries = [...entries].sort((a, b) => (a.position || 0) - (b.position || 0));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Company Timeline</CardTitle>
              <CardDescription>
                Manage your company's historical milestones and achievements
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto"
              aria-describedby="add-timeline-description"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Entry
            </Button>
            <div id="add-timeline-description" className="sr-only">
              Add a new milestone to the company timeline
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No timeline entries yet. Add your first milestone!
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedEntries.map(e => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {sortedEntries.map((entry) => (
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
      </Card>

      <EnhancedDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <EnhancedDialogContent contentType="form">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>
              {editingEntry ? "Edit Timeline Entry" : "Add Timeline Entry"}
            </EnhancedDialogTitle>
          </EnhancedDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1889"
                max={new Date().getFullYear()}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Major milestone or achievement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the milestone"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <div className="flex items-center gap-4">
                {selectedMedia ? (
                  <div className="relative">
                    <img
                      src={selectedMedia.id && selectedMedia.id < 1000000000000 ? `/api/media/${selectedMedia.id}/content` : undefined}
                      alt="Timeline"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => {
                        setSelectedMedia(null);
                        setFormData({ ...formData, imageId: undefined });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Image className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <Button onClick={() => setIsMediaPickerOpen(true)} variant="outline" size="sm">
                  Select Image
                </Button>
              </div>
            </div>
          </div>

          <EnhancedDialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.year}>
              {editingEntry ? "Update" : "Create"}
            </Button>
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset: MediaAsset | MediaAsset[]) => {
          const selectedAsset = Array.isArray(asset) ? asset[0] : asset;
          if (selectedAsset) {
            setSelectedMedia(selectedAsset);
            setFormData({ ...formData, imageId: selectedAsset.id });
          }
        }}
        title="Select Timeline Image"
        mediaPickerTarget="timeline-image"
        selectionMode="single"
      />
    </div>
  );
}