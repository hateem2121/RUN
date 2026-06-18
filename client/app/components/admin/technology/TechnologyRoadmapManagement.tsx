import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  FastForward,
  LayoutGrid,
  List,
  Milestone,
  Plus,
  Save,
  Search,
  Settings2,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { RoadmapKanbanBoard } from "./RoadmapKanbanBoard";
import { SortableRoadmapItem } from "./SortableRoadmapItem";

// Types
interface RoadmapFormData {
  title: string;
  timeline: string;
  description: string;
  impact: string[];
  imageId: number | null;
  videoId: number | null;
  status: string;
  priority: string;
  isActive: boolean;
}

export interface TechnologyRoadmap {
  id: number;
  title: string;
  timeline: string;
  description?: string;
  impact?: string[];
  imageId?: number | null;
  videoId?: number | null;
  status?: string;
  priority?: string;
  isActive?: boolean;
  position?: number;
}

export function TechnologyRoadmapManagement() {
  const queryClient = useQueryClient();

  // State
  const [showRoadmapDialog, setShowRoadmapDialog] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<TechnologyRoadmap | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "kanban">("kanban");

  const [roadmapForm, setRoadmapForm] = useState<RoadmapFormData>({
    title: "",
    timeline: "",
    description: "",
    impact: [],
    imageId: null,
    videoId: null,
    status: "planned",
    priority: "medium",
    isActive: true,
  });

  const [newImpact, setNewImpact] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Queries and Mutations
  const { data: roadmap = [], isLoading } = useQuery<TechnologyRoadmap[]>({
    queryKey: ["/api/technology-roadmap"],
  });

  const createRoadmapMutation = useMutation({
    mutationFn: (data: RoadmapFormData) =>
      apiRequest("/api/technology-roadmap", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          position: roadmap.length,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-roadmap"] });
      setShowRoadmapDialog(false);
      resetForm();
      toast.success("Success", { description: "Milestone created" });
    },
  });

  const updateRoadmapMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoadmapFormData> }) =>
      apiRequest(`/api/technology-roadmap/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-roadmap"] });
      setShowRoadmapDialog(false);
      setEditingRoadmap(null);
      toast.success("Success", { description: "Milestone updated" });
    },
  });

  const deleteRoadmapMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/technology-roadmap/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-roadmap"] });
      toast.success("Success", { description: "Milestone deleted" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: TechnologyRoadmap[]) =>
      apiRequest("/api/technology-roadmap/reorder", {
        method: "POST",
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-roadmap"] });
    },
  });

  // Filtered Roadmap
  const filteredRoadmap = useMemo(() => {
    return roadmap
      .filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [roadmap, searchQuery]);

  // Handlers
  const handleRoadmapSubmit = (_formDataAction: FormData) => {
    if (editingRoadmap) {
      updateRoadmapMutation.mutate({ id: editingRoadmap.id, data: roadmapForm });
    } else {
      createRoadmapMutation.mutate(roadmapForm);
    }
  };

  const handleEditRoadmap = (item: TechnologyRoadmap) => {
    setEditingRoadmap(item);
    setRoadmapForm({
      title: item.title,
      timeline: item.timeline,
      description: item.description || "",
      impact: item.impact || [],
      imageId: item.imageId || null,
      videoId: item.videoId || null,
      status: item.status || "planned",
      priority: item.priority || "medium",
      isActive: item.isActive ?? true,
    });
    setShowRoadmapDialog(true);
  };

  const handleRoadmapDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = roadmap.findIndex((r) => r.id === active.id);
      const newIndex = roadmap.findIndex((r) => r.id === over.id);
      const newItems = arrayMove(roadmap, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        position: idx,
      }));
      reorderMutation.mutate(newItems);
    }
  };

  const resetForm = () => {
    setEditingRoadmap(null);
    setRoadmapForm({
      title: "",
      timeline: "",
      description: "",
      impact: [],
      imageId: null,
      videoId: null,
      status: "planned",
      priority: "medium",
      isActive: true,
    });
  };

  const activeCount = roadmap.filter((r) => r.isActive).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header Panel */}
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex flex-col gap-6 border-b border-white/10 bg-surface-black/80 p-6 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
              Technology <span className="text-custom-color-205">Roadmap</span>
            </h2>
            <p className="text-admin-foreground/60 text-sm font-medium tracking-wide italic">
              Future pipeline and strategic milestones
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-foreground/30 transition-colors group-focus-within:text-custom-color-206" />
              <Input
                placeholder="Search milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-custom-space-126 border-white/5 bg-white/[0.03] pl-10 text-admin-foreground transition-all focus:border-custom-color-207/40 focus:bg-white/[0.06] focus:ring-0"
              />
            </div>

            <Button
              onClick={() => {
                resetForm();
                setShowRoadmapDialog(true);
              }}
              className="group h-11 border-none bg-custom-color-208 px-6 font-bold text-custom-color-209 transition-all hover:bg-custom-color-210/90 hover:shadow-custom-misc-136 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
              INITIALIZE MILESTONE
            </Button>

            <div className="flex bg-white/5 rounded-lg p-1 mr-2 border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("list")}
                className={cn(
                  "h-8 px-2 rounded-md transition-all",
                  view === "list"
                    ? "bg-custom-color-211 text-custom-color-212 font-bold"
                    : "text-admin-muted hover:text-white",
                )}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("kanban")}
                className={cn(
                  "h-8 px-2 rounded-md transition-all",
                  view === "kanban"
                    ? "bg-custom-color-213 text-custom-color-214 font-bold"
                    : "text-admin-muted hover:text-white",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-11 border-white/10 bg-white/5 px-4 text-admin-foreground hover:bg-white/10"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Roadmap List */}
      <div className="relative min-h-custom-space-127">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-white/[0.02]" />
            ))}
          </div>
        ) : filteredRoadmap.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] p-12 text-center backdrop-blur-xl">
            <div className="mb-4 rounded-full bg-white/[0.05] p-4 text-admin-foreground/20">
              <Milestone className="h-12 w-12" />
            </div>
            <p className="max-w-xs text-sm font-medium text-admin-foreground/40">
              No strategic milestones matching your search. Add a new roadmap target to visualize
              the future.
            </p>
          </div>
        ) : view === "kanban" ? (
          <RoadmapKanbanBoard
            items={filteredRoadmap}
            onEdit={handleEditRoadmap}
            onDelete={(id) => deleteRoadmapMutation.mutate(id)}
            onReorder={(items) => reorderMutation.mutate(items)}
            onStatusChange={(id, status) => updateRoadmapMutation.mutate({ id, data: { status } })}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRoadmapDragEnd}
          >
            <SortableContext
              items={filteredRoadmap.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {filteredRoadmap.map((item) => (
                  <SortableRoadmapItem
                    key={item.id}
                    item={item}
                    onEdit={handleEditRoadmap}
                    onDelete={(id) => deleteRoadmapMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Stats - Pipeline Growth */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-custom-color-215/10 text-custom-color-216">
            <Zap className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">{activeCount}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Active Milestones
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-admin-foreground/40">
            <FastForward className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">{roadmap.length - activeCount}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Future Pipeline
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Target className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">94%</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Impact Accuracy
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">18M</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Avg. Roadmap Horizon
          </div>
        </div>
      </div>

      {/* Roadmap Form Dialog */}
      <Dialog open={showRoadmapDialog} onOpenChange={setShowRoadmapDialog}>
        <DialogContent className="max-w-2xl border-white/10 bg-surface-black/95 text-admin-foreground backdrop-blur-2xl">
          <DialogHeader className="border-b border-white/10 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-custom-color-217/10 text-custom-color-218 mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-white uppercase italic">
              {editingRoadmap ? "Update" : "Initialize"}{" "}
              <span className="text-custom-color-219">Milestone</span>
            </DialogTitle>
            <DialogDescription className="text-admin-muted font-medium tracking-wide">
              Define the strategic objectives and expected impact for this roadmap target.
            </DialogDescription>
          </DialogHeader>

          <form action={handleRoadmapSubmit} className="space-y-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xxs font-black uppercase tracking-custom-misc-137 text-admin-muted">
                    Milestone Title
                  </Label>
                  <Input
                    value={roadmapForm.title}
                    onChange={(e) => setRoadmapForm({ ...roadmapForm, title: e.target.value })}
                    className="border-white/5 bg-white/[0.03] text-white focus:border-custom-color-220/40"
                    placeholder="Enter milestone title..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xxs font-black uppercase tracking-custom-misc-138 text-admin-muted">
                    Timeline Horizon
                  </Label>
                  <Input
                    value={roadmapForm.timeline}
                    onChange={(e) => setRoadmapForm({ ...roadmapForm, timeline: e.target.value })}
                    className="border-white/5 bg-white/[0.03] text-white focus:border-custom-color-221/40"
                    placeholder="e.g., Q3 2025"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xxs font-black uppercase tracking-custom-misc-139 text-admin-muted">
                      Current Status
                    </Label>
                    <select
                      title="Milestone Status"
                      value={roadmapForm.status}
                      onChange={(e) => setRoadmapForm({ ...roadmapForm, status: e.target.value })}
                      className="w-full h-10 rounded-md border border-white/5 bg-white/[0.03] text-white focus:border-custom-color-222/40 outline-none px-3 text-sm"
                    >
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="validated">Validated</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xxs font-black uppercase tracking-custom-misc-140 text-admin-muted">
                      Priority Level
                    </Label>
                    <select
                      title="Priority Level"
                      value={roadmapForm.priority}
                      onChange={(e) => setRoadmapForm({ ...roadmapForm, priority: e.target.value })}
                      className="w-full h-10 rounded-md border border-white/5 bg-white/[0.03] text-white focus:border-custom-color-223/40 outline-none px-3 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <Label className="text-xxs font-black uppercase tracking-custom-misc-141 text-admin-muted">
                  Executive Summary
                </Label>
                <Textarea
                  value={roadmapForm.description}
                  onChange={(e) => setRoadmapForm({ ...roadmapForm, description: e.target.value })}
                  className="h-custom-space-128 resize-none border-white/5 bg-white/[0.03] text-white focus:border-custom-color-224/40"
                  placeholder="Strategic overview..."
                />
              </div>
            </div>

            {/* Impact Section */}
            <div className="space-y-4 rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/5">
              <div className="flex items-center justify-between">
                <Label className="text-xxs font-black uppercase tracking-custom-misc-142 text-admin-muted">
                  Strategic Impact
                </Label>
                <Badge
                  variant="outline"
                  className="border-custom-color-225/20 text-custom-color-226 text-xxs"
                >
                  {roadmapForm.impact.length} Targets Defined
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {roadmapForm.impact.map((impact, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg bg-custom-color-227/5 px-3 py-1.5 ring-1 ring-custom-color-228/20"
                  >
                    <span className="text-sm font-medium text-admin-foreground">{impact}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setRoadmapForm({
                          ...roadmapForm,
                          impact: roadmapForm.impact.filter((_, i) => i !== index),
                        })
                      }
                      title="Remove Target"
                      aria-label="Remove Target"
                    >
                      <X className="h-3 w-3 text-admin-muted hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  className="border-white/5 bg-white/[0.03]"
                  placeholder="Add target impact..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newImpact) {
                        setRoadmapForm({
                          ...roadmapForm,
                          impact: [...roadmapForm.impact, newImpact],
                        });
                        setNewImpact("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newImpact) {
                      setRoadmapForm({
                        ...roadmapForm,
                        impact: [...roadmapForm.impact, newImpact],
                      });
                      setNewImpact("");
                    }
                  }}
                  className="border-white/10"
                >
                  ADD
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-white uppercase italic">
                  Active Phase
                </Label>
                <p className="text-xs text-admin-muted">Toggle visibility in public roadmap</p>
              </div>
              <Switch
                checked={roadmapForm.isActive}
                onCheckedChange={(checked) => setRoadmapForm({ ...roadmapForm, isActive: checked })}
                className="data-custom-misc-143:bg-custom-color-229"
              />
            </div>

            <DialogFooter className="border-t border-white/10 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRoadmapDialog(false)}
                className="text-admin-muted"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                className="bg-custom-color-230 font-black text-custom-color-231 hover:bg-custom-color-232/90"
              >
                <Save className="mr-2 h-4 w-4" />
                {editingRoadmap ? "UPDATE MILESTONE" : "SAVE MILESTONE"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Media Pickers */}
      <StandardMediaSelectionDialog
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(assets) => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) setRoadmapForm({ ...roadmapForm, imageId: asset.id });
        }}
        title="Select Milestone Image"
        mediaPickerTarget="roadmap-image"
      />
      <StandardMediaSelectionDialog
        isOpen={showVideoPicker}
        onClose={() => setShowVideoPicker(false)}
        onSelect={(assets) => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) setRoadmapForm({ ...roadmapForm, videoId: asset.id });
        }}
        title="Select Milestone Video"
        mediaPickerTarget="roadmap-video"
      />
    </div>
  );
}
