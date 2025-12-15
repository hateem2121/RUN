import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { HomepageSlogan, HomepageSection } from "@shared/schema";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface HomepageSlogansManagerProps {
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

export function HomepageSlogansManager({
  sectionData,
  onUpdateSection,
}: HomepageSlogansManagerProps) {
  // Fetch slogans locally
  const { data: slogansData } = useQuery<HomepageSlogan[]>({
    queryKey: ["/api/homepage-slogans"],
  });

  const [slogans, setSlogans] = useState<HomepageSlogan[]>([]);

  useEffect(() => {
    if (slogansData) {
      setSlogans(slogansData);
    }
  }, [slogansData]);
  const [newSloganText, setNewSloganText] = useState("");

  // Local state for section title editing
  const [sectionTitle, setSectionTitle] = useState(sectionData?.title || "");

  // Update local state when sectionData changes
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

  // Optimistic position counter to prevent race conditions during rapid additions
  const nextPositionRef = useRef(0);

  // Sync nextPosition with actual slogans data when it changes
  useEffect(() => {
    if (slogans.length > 0) {
      const positions = slogans
        .map((s) => parseInt(String(s.position ?? 0)))
        .filter((p) => !isNaN(p));
      nextPositionRef.current = positions.length > 0 ? Math.max(...positions) + 1 : 0;
    } else {
      nextPositionRef.current = 0;
    }
  }, [slogans]);

  const createSloganMutation = useMutation({
    mutationFn: async (data: { text: string; position: number; isActive: boolean }) => {
      return await apiRequest("/api/homepage-slogans", { method: "POST", body: data });
    },
    onMutate: async () => {
      // Cancel outgoing queries
      await getQueryClient().cancelQueries({ queryKey: ["/api/homepage-slogans"] });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-slogans"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
      setNewSloganText("");
      toast({
        title: "Success",
        description: "Slogan added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add slogan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSloganMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HomepageSlogan> }) => {
      return await apiRequest(`/api/homepage-slogans/${id}`, { method: "PATCH", body: data });
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await getQueryClient().cancelQueries({ queryKey: ["/api/homepage-slogans"] });

      // Snapshot previous value
      const previousSlogans = getQueryClient().getQueryData(["/api/homepage-slogans"]);

      // Optimistically update
      getQueryClient().setQueryData<HomepageSlogan[]>(["/api/homepage-slogans"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((slogan) => (slogan.id === id ? { ...slogan, ...data } : slogan));
      });

      return { previousSlogans };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSlogans) {
        getQueryClient().setQueryData(["/api/homepage-slogans"], context.previousSlogans);
      }
      toast({
        title: "Error",
        description: "Failed to update slogan. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-slogans"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
    },
  });

  const deleteSloganMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/homepage-slogans/${id}`, { method: "DELETE" });
    },
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await getQueryClient().cancelQueries({ queryKey: ["/api/homepage-slogans"] });

      // Snapshot previous value
      const previousSlogans = getQueryClient().getQueryData(["/api/homepage-slogans"]);

      // Optimistically update
      getQueryClient().setQueryData<HomepageSlogan[]>(["/api/homepage-slogans"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((slogan) => slogan.id !== deletedId);
      });

      return { previousSlogans };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSlogans) {
        getQueryClient().setQueryData(["/api/homepage-slogans"], context.previousSlogans);
      }
      toast({
        title: "Error",
        description: "Failed to delete slogan. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-slogans"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
      toast({
        title: "Success",
        description: "Slogan deleted successfully",
      });
    },
  });

  const reorderSlogansMutation = useMutation({
    mutationFn: async (slogans: { id: number; position: number }[]) => {
      return await apiRequest("/api/homepage-slogans/reorder", {
        method: "PATCH",
        body: { slogans },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-slogans"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = slogans.findIndex((s) => s.id.toString() === active.id);
    const newIndex = slogans.findIndex((s) => s.id.toString() === over.id);

    const newSlogans = arrayMove(slogans, oldIndex, newIndex);
    setSlogans(newSlogans);

    // Update positions
    const updates = newSlogans.map((slogan, index) => ({
      id: slogan.id,
      position: index,
    }));

    // Client-side validation prevents ID/name confusion reaching backend.
    const isValid = updates.every((update) => {
      const hasValidId = typeof update.id === "number" && Number.isFinite(update.id);
      const hasValidPosition =
        typeof update.position === "number" && Number.isFinite(update.position);

      if (!hasValidId || !hasValidPosition) {
        console.error("[HomepageSlogansManager] Invalid reorder data:", {
          id: update.id,
          position: update.position,
          hasValidId,
          hasValidPosition,
        });
        return false;
      }
      return true;
    });

    if (!isValid) {
      toast({
        title: "Error",
        description: "Invalid slogan data - cannot reorder",
        variant: "destructive",
      });
      return;
    }

    // Ensure positions are integers
    const validatedUpdates = updates.map((update) => ({
      id: update.id,
      position: parseInt(String(update.position), 10),
    }));

    reorderSlogansMutation.mutate(validatedUpdates);
  };

  const handleAddSlogan = () => {
    if (newSloganText.trim()) {
      // Use optimistic counter and increment immediately to prevent race conditions
      const position = nextPositionRef.current;
      nextPositionRef.current += 1;

      createSloganMutation.mutate({
        text: newSloganText.trim(),
        position,
        isActive: true,
      });
    }
  };

  const handleToggleSlogan = (slogan: HomepageSlogan) => {
    updateSloganMutation.mutate({
      id: slogan.id,
      data: { isActive: !slogan.isActive },
    });
  };

  return (
    <div className="space-y-6">
      {/* Generic Section Settings (Visibility & Title) */}
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
                <div className="text-sm text-muted-foreground">
                  Toggle whether this whole section is visible to visitors.
                </div>
              </div>
              <Switch
                checked={sectionData.isActive ?? true}
                onCheckedChange={(checked) => handleUpdateSection({ isActive: checked })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="section-title">Section Title (Internal/Display)</Label>
              <div className="flex gap-2">
                <Input
                  id="section-title"
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

      {/* Slogans List Management */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Slogans</CardTitle>
          <CardDescription>
            Manage animated text slogans that appear on the homepage. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Slogan */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter new slogan"
              value={newSloganText}
              onChange={(e) => setNewSloganText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSlogan()}
            />
            <Button
              onClick={handleAddSlogan}
              disabled={!newSloganText.trim() || createSloganMutation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Slogans List with Drag and Drop */}
          {slogans.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slogans.map((s) => s.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {slogans.map((slogan) => (
                    <SortableItem key={slogan.id} id={slogan.id.toString()}>
                      {({ listeners }) => (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                          <div {...listeners} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <span
                              className="font-medium"
                              style={{ color: slogan.color || undefined }}
                            >
                              {slogan.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Label
                                htmlFor={`color-${slogan.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Color:
                              </Label>
                              <input
                                id={`color-${slogan.id}`}
                                type="color"
                                value={slogan.color || "#000000"}
                                onChange={(e) =>
                                  updateSloganMutation.mutate({
                                    id: slogan.id,
                                    data: { color: e.target.value },
                                  })
                                }
                                className="w-10 h-8 cursor-pointer border rounded"
                                title="Slogan color"
                              />
                            </div>
                            <Switch
                              checked={slogan.isActive ?? false}
                              onCheckedChange={() => handleToggleSlogan(slogan)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSloganMutation.mutate(slogan.id)}
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No slogans added yet. Create your first slogan above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
