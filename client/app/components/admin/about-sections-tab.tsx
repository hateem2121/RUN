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
import { ADMIN_MEDIA_QUERIES, buildMediaApiParams } from "@shared/api-constants";
import type { AboutSection, MediaAsset } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Edit, GripVertical, Image, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { CustomDropdown } from "@/components/admin/CustomDropdown";
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
import { useToast } from "@/hooks/use-toast";
import { createMediaQueryKey } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface SectionItemProps {
  section: AboutSection;
  onEdit: (section: AboutSection) => void;
  onDelete: (id: number) => void;
}

function SortableSectionItem({ section, onEdit, onDelete }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSectionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      manufacturing_process: "Manufacturing Process",
      factory_gallery: "Factory Gallery",
      certifications: "Certifications",
      custom: "Custom Section",
    };
    return typeMap[type] || type;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-white p-4 dark:bg-background ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-4">
        <button className="mt-1 cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground/70" />
        </button>

        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-semibold text-lg">{section.title || "Untitled Section"}</h3>
            <span className="rounded bg-muted px-2 py-1 text-muted-foreground text-sm dark:bg-muted/80">
              {getSectionTypeLabel(section.sectionType)}
            </span>
            {section.isActive === false && (
              <span className="rounded bg-red-100 px-2 py-1 text-red-600 text-sm dark:bg-red-900/20">
                Hidden
              </span>
            )}
          </div>
          {section.content && (
            <p className="line-clamp-2 text-muted-foreground text-sm dark:text-muted-foreground/70">
              {section.content}
            </p>
          )}
          {section.mediaIds && section.mediaIds.length > 0 && (
            <p className="mt-1 text-muted-foreground text-sm">
              {section.mediaIds.length} media item
              {section.mediaIds.length > 1 ? "s" : ""} attached
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(section)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(section.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AboutSectionsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AboutSection | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset[]>([]);
  const [formData, setFormData] = useState({
    sectionType: "custom",
    title: "",
    content: "",
    mediaIds: [] as number[],
    isActive: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: sections = [], isLoading } = useQuery<AboutSection[]>({
    queryKey: ["/api/about-sections"],
  });

  const { data: mediaResponse } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[] };
  }>({
    queryKey: createMediaQueryKey.recent(50),
    queryFn: async () => {
      // Only fetch 50 recent media assets instead of 1000+
      const response = await fetch(
        `/api/media?${buildMediaApiParams(ADMIN_MEDIA_QUERIES.RECENT_ADMIN)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch media");
      return response.json();
    },
  });

  const mediaAssets = mediaResponse?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/about-sections", { method: "POST", body: JSON.stringify(data) }) as Promise<any>;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-sections"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-batch"] });
      toast({ title: "Success", description: "Section created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/about-sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<any>;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-sections"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-batch"] });
      toast({ title: "Success", description: "Section updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/about-sections/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-sections"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-batch"] });
      toast({ title: "Success", description: "Section deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (sections: { id: number; position: number }[]) => {
      return apiRequest("/api/about-sections/reorder", {
        method: "PATCH",
        body: JSON.stringify({ sections }),
      }) as Promise<any>;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-sections"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-batch"] });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      const reorderedSections = newSections.map((section, index) => ({
        id: section.id,
        position: index,
      }));

      getQueryClient().setQueryData(["/api/about-sections"], newSections);
      reorderMutation.mutate(reorderedSections);
    }
  };

  const handleEdit = (section: AboutSection) => {
    setEditingSection(section);
    setFormData({
      sectionType: section.sectionType,
      title: section.title || "",
      content: section.content || "",
      mediaIds: section.mediaIds || [],
      isActive: section.isActive !== false,
    });
    if (section.mediaIds && section.mediaIds.length > 0) {
      const media = mediaAssets.filter((m: MediaAsset) => section.mediaIds?.includes(m.id));

      // Check if we have all media in cache
      const missingIds = section.mediaIds.filter((id) => !media.find((m) => m.id === id));

      if (missingIds.length > 0) {
        // Fetch missing media by ID
        Promise.all(
          missingIds.map((id) =>
            fetch(`/api/media/${id}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => (data?.success ? data.data : null))
              .catch(() => null),
          ),
        ).then((fetchedMedia) => {
          const validFetched = fetchedMedia.filter((m) => m !== null);
          const allMedia = [...media, ...validFetched];

          // Reconcile: preserve order from mediaIds, remove missing IDs
          // Reconcile: preserve order from mediaIds, remove missing IDs
          const validIds = allMedia.map((m) => m.id);
          const reconciled = section.mediaIds?.filter((id) => validIds.includes(id)) || [];
          const orderedMedia = reconciled.map((id) => allMedia.find((m) => m.id === id)!);

          setSelectedMedia(orderedMedia);
          setFormData((prev) => ({ ...prev, mediaIds: reconciled }));
        });
      } else {
        // Always preserve order from section.mediaIds, even when all cached
        const orderedMedia = section.mediaIds
          .map((id) => media.find((m) => m.id === id))
          .filter((m): m is MediaAsset => m !== undefined);
        setSelectedMedia(orderedMedia);
      }
    } else {
      setSelectedMedia([]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this section?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSection(null);
    setSelectedMedia([]);
    setFormData({
      sectionType: "custom",
      title: "",
      content: "",
      mediaIds: [],
      isActive: true,
    });
  };

  const removeMedia = (mediaId: number) => {
    setSelectedMedia(selectedMedia.filter((m) => m.id !== mediaId));
    setFormData({
      ...formData,
      mediaIds: formData.mediaIds.filter((id) => id !== mediaId),
    });
  };

  const sortedSections = [...sections].sort((a, b) => (a.position || 0) - (b.position || 0));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Content Sections</CardTitle>
              <CardDescription>
                Manage manufacturing process, factory gallery, and custom sections
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto"
              aria-describedby="add-section-description"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Section
            </Button>
            <div id="add-section-description" className="sr-only">
              Create a new content section for the about page
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedSections.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No sections yet. Add your first content section!
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedSections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {sortedSections.map((section) => (
                    <SortableSectionItem
                      key={section.id}
                      section={section}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-4">
              <CustomDropdown
                value={formData.sectionType}
                onChange={(value) => {
                  setFormData({ ...formData, sectionType: value });
                }}
                options={[
                  {
                    value: "manufacturing_process",
                    label: "Manufacturing Process",
                  },
                  { value: "factory_gallery", label: "Factory Gallery" },
                  { value: "certifications", label: "Certifications" },
                  { value: "custom", label: "Custom Section" },
                ]}
                label="Section Type"
                placeholder="Select section type"
                required={true}
              />

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Section title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Section content..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Media</Label>
                <div className="space-y-2">
                  {selectedMedia.length > 0 && (
                    <div className="mb-2 grid grid-cols-4 gap-2">
                      {selectedMedia.map((media) => (
                        <div key={media.id} className="group relative">
                          {media.type === "video" ? (
                            <video
                              src={`/api/media/${media.id}/content`}
                              className="h-24 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <img
                              src={`/api/media/${media.id}/content`}
                              alt=""
                              className="h-24 w-full rounded-lg object-cover"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => removeMedia(media.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => setIsMediaPickerOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {selectedMedia.length > 0 ? "Change Media" : "Select Media"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="active">Active (show on About page)</Label>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingSection ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset: MediaAsset | MediaAsset[]) => {
          const newSelectedMedia = Array.isArray(asset) ? asset : [asset];
          const ids = newSelectedMedia.map((a) => a.id);
          setSelectedMedia(newSelectedMedia);
          setFormData({ ...formData, mediaIds: ids });
        }}
        title="Select Section Media"
        mediaPickerTarget="section-media"
        selectionMode="multiple"
        maxSelection={10}
      />
    </div>
  );
}
