import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  HomepageProcessCard,
  HomepageSection,
  InsertHomepageProcessCard,
  MediaAsset,
} from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface ProcessCardForm {
  title: string;
  description: string;
  step: number;
  icon: string;
  iconMediaId: number | null;
  iconType: "text" | "image" | null;
  category: string;
  position: number;
  isActive: boolean;
}

interface HomepageProcessManagerProps {
  sectionData?: HomepageSection;
  onUpdateSection?: (params: { id: number; data: Partial<HomepageSection> }) => void;
}

function SortableItem({
  id,
  children,
}: {
  id: string;
  children:
    | React.ReactNode
    | (({ listeners }: { listeners: SyntheticListenerMap | undefined }) => React.ReactNode);
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {typeof children === "function" ? children({ listeners }) : children}
    </div>
  );
}

export function HomepageProcessManager({
  sectionData,
  onUpdateSection,
}: HomepageProcessManagerProps) {
  // Query for process cards (Decoupled state)
  const { data: processCardsData } = useQuery({
    queryKey: ["/api/homepage-process-cards/admin"],
    queryFn: async () => await apiRequest("/api/homepage-process-cards/admin"),
  });

  const processCards = Array.isArray(processCardsData)
    ? processCardsData
    : (processCardsData as any)?.result || [];

  // Media assets needed for selection
  const { data: mediaResponse } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[]; pagination: any };
  }>({
    queryKey: MediaQueryKeys.list,
  });
  const mediaAssets = mediaResponse?.data?.data || [];

  const [processCardForm, setProcessCardForm] = useState<ProcessCardForm>({
    title: "",
    description: "",
    step: 1,
    icon: "",
    iconMediaId: null,
    iconType: "image",
    category: "technology",
    position: 0,
    isActive: true,
  });

  const [editingProcessCardId, setEditingProcessCardId] = useState<number | null>(null);
  const [isProcessCardDialogOpen, setIsProcessCardDialogOpen] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Local state for section title editing
  const [sectionTitle, setSectionTitle] = useState(sectionData?.title || "");

  useEffect(() => {
    if (sectionData) {
      setSectionTitle(sectionData.title || "");
    }
  }, [sectionData]);

  const handleUpdateSection = (data: Partial<HomepageSection>) => {
    if (sectionData && onUpdateSection) {
      onUpdateSection({ id: sectionData.id, data });
    }
  };

  const createProcessCardMutation = useMutation({
    mutationFn: async (
      data: Omit<InsertHomepageProcessCard, "id" | "createdAt" | "imageId"> & {
        imageId: number | null;
      },
    ) => {
      // Ensure specific step number is handled or default to next sequence
      return await apiRequest("/api/homepage-process-cards", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/homepage-process-cards/admin"],
      });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
      setIsProcessCardDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Process card created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create process card.",
        variant: "destructive",
      });
    },
  });

  const updateProcessCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HomepageProcessCard> }) => {
      return await apiRequest(`/api/homepage-process-cards/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/homepage-process-cards/admin"],
      });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
      setIsProcessCardDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Process card updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update process card.",
        variant: "destructive",
      });
    },
  });

  const deleteProcessCardMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/homepage-process-cards/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/homepage-process-cards/admin"],
      });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
      toast({
        title: "Success",
        description: "Process card deleted successfully",
      });
    },
  });

  const reorderProcessCardsMutation = useMutation({
    mutationFn: async (cards: { id: number; position: number }[]) => {
      // Assuming generic batch update or reorder endpoint exists, if not using individual updates
      // The slogans manager uses a specific reorder endpoint. If process cards don't have one, we loop.
      // Checking misc/schema... usually reorder endpoints are custom.
      // Slogans has /reorder. If Process doesn't, we might need to add it or loop calls.
      // For safety, I'll loop PATCH requests if no bulk endpoint is known, OR mock it for now.
      // Use existing pattern: loop PATCH if unsure, or check API.
      // Slogans used /api/homepage-slogans/reorder.
      // I'll try /api/homepage-process-cards/reorder first if that exists, or just loop.
      // To be safe and fast: parallel patch.
      await Promise.all(
        cards.map((c) =>
          apiRequest(`/api/homepage-process-cards/${c.id}`, {
            method: "PATCH",
            body: { position: c.position },
          }),
        ),
      );
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/homepage-process-cards/admin"],
      });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
    },
  });

  const resetForm = () => {
    setProcessCardForm({
      title: "",
      description: "",
      step: 1,
      icon: "",
      iconMediaId: null,
      iconType: "image",
      category: "technology",
      position: 0,
      isActive: true,
    });
    setEditingProcessCardId(null);
  };

  const handleEditCard = (card: HomepageProcessCard) => {
    setProcessCardForm({
      title: card.title,
      description: card.description || "",
      step: card.step,
      icon: card.icon || "",
      iconMediaId: card.iconMediaId,
      iconType: card.iconType as "text" | "image" | null,
      category: card.category || "technology",
      position: card.position || 0,
      isActive: card.isActive ?? true,
    });
    setEditingProcessCardId(card.id);
    setIsProcessCardDialogOpen(true);
  };

  const handleSubmit = () => {
    if (processCardForm.iconType === "image" && !processCardForm.iconMediaId) {
      toast({
        title: "Validation Error",
        description: "Please select an image.",
        variant: "destructive",
      });
      return;
    }

    if (editingProcessCardId) {
      updateProcessCardMutation.mutate({
        id: editingProcessCardId,
        data: processCardForm,
      });
    } else {
      createProcessCardMutation.mutate({
        ...processCardForm,
        imageId: null,
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = processCards as HomepageProcessCard[];
    const oldIndex = items.findIndex((c) => c.id.toString() === active.id);
    const newIndex = items.findIndex((c) => c.id.toString() === over.id);

    const newCards = arrayMove(items, oldIndex, newIndex);

    // Update positions
    const updates = newCards.map((card, index) => ({
      id: card.id,
      position: index,
    }));

    reorderProcessCardsMutation.mutate(updates);
  };

  return (
    <div className="space-y-6">
      {/* Generic Section Settings */}
      {sectionData && (
        <Card>
          <CardHeader>
            <CardTitle>Section Settings</CardTitle>
            <CardDescription>
              Manage the visibility and generic title of this section on the homepage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Section Visibility</Label>
                <div className="text-muted-foreground text-sm">
                  Toggle whether this whole section is visible to visitors.
                </div>
              </div>
              <Switch
                checked={sectionData.isActive ?? true}
                onCheckedChange={(checked) => handleUpdateSection({ isActive: checked })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="process-section-title">Section Title (Internal/Display)</Label>
              <div className="flex gap-2">
                <Input
                  id="process-section-title"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Enter section title"
                />
                <Button
                  variant="outline"
                  onClick={() => handleUpdateSection({ title: sectionTitle })}
                  disabled={sectionTitle === sectionData.title}
                >
                  Save Title
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Process Cards</CardTitle>
          <CardDescription>Manage cards showing your process/technology steps.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {(processCards as any[]).length} cards
            </span>

            <Dialog open={isProcessCardDialogOpen} onOpenChange={setIsProcessCardDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Process Card
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" nestingLevel={0}>
                <div className="space-y-4 py-4">
                  <h2 className="font-bold text-lg">
                    {editingProcessCardId ? "Edit Process Card" : "New Process Card"}
                  </h2>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={processCardForm.title}
                        onChange={(e) =>
                          setProcessCardForm({
                            ...processCardForm,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={processCardForm.description}
                        onChange={(e) =>
                          setProcessCardForm({
                            ...processCardForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="step">Step Number</Label>
                        <Input
                          id="step"
                          type="number"
                          value={processCardForm.step}
                          onChange={(e) =>
                            setProcessCardForm({
                              ...processCardForm,
                              step: parseInt(e.target.value, 10) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={processCardForm.category}
                          onValueChange={(val) =>
                            setProcessCardForm({
                              ...processCardForm,
                              category: val,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="process">Process</SelectItem>
                            <SelectItem value="quality">Quality</SelectItem>
                            <SelectItem value="innovation">Innovation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Icon Selection */}
                    <div className="space-y-2">
                      <Label>Icon Image</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowMediaPicker(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Select Image
                        </Button>
                        {processCardForm.iconMediaId && (
                          <div className="relative h-10 w-10 overflow-hidden rounded border">
                            {/* Simple preview logic */}
                            <img
                              src={
                                mediaAssets.find((a) => a.id === processCardForm.iconMediaId)
                                  ?.url || ""
                              }
                              alt="preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSubmit}>
                        {editingProcessCardId ? "Update" : "Create"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Media Picker Dialog - Rendered at top level of component or here */}
            <StandardMediaSelectionDialog
              isOpen={showMediaPicker}
              onClose={() => setShowMediaPicker(false)}
              onSelect={(asset: MediaAsset | MediaAsset[]) => {
                const single = Array.isArray(asset) ? asset[0] : asset;
                if (single)
                  setProcessCardForm({
                    ...processCardForm,
                    iconMediaId: single.id,
                  });
              }}
              title="Select Icon"
              mediaPickerTarget="process-icon"
              selectionMode="single"
            />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={(processCards as any[]).map((c) => c.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {(processCards as any[]).map((card: HomepageProcessCard) => (
                  <SortableItem key={card.id} id={card.id.toString()}>
                    {({ listeners }) => (
                      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                        <div {...listeners} className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{card.title}</h4>
                          <p className="truncate text-muted-foreground text-xs">
                            {card.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCard(card)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProcessCardMutation.mutate(card.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
