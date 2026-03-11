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
import { Clock, FlaskConical, Layout, Plus, Save, Search, Settings2, X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { SortableResearchItem } from "./SortableResearchItem";

// Types
interface ResearchProject {
  name: string;
  status: "Planning" | "In Progress" | "Testing" | "Completed";
  progress: number;
}

interface ResearchFormData {
  title: string;
  description: string;
  researchArea: string;
  status: string;
  startDate: Date | null;
  expectedCompletion: Date | null;
  funding: number;
  teamMembers: string[];
  objectives: string[];
  currentProjects: ResearchProject[];
  publications: string[];
  partners: string[];
  outcomes: string[];
  icon: string;
  isActive: boolean;
}

interface TechnologyResearch {
  id: number;
  title: string;
  description?: string;
  researchArea?: string;
  status?: "Planning" | "In Progress" | "Testing" | "Completed" | "Ongoing";
  startDate?: Date | null;
  expectedCompletion?: Date | null;
  funding?: number;
  teamMembers?: string[];
  objectives?: string[];
  currentProjects?: ResearchProject[];
  publications?: string[];
  partners?: string[];
  outcomes?: string[];
  icon?: string;
  isActive?: boolean;
  position?: number;
}

interface TechnologyResearchManagementProps {
  isLoading?: boolean;
}

export function TechnologyResearchManagement({
  isLoading: externalLoading,
}: TechnologyResearchManagementProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // State
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const [editingResearch, setEditingResearch] = useState<TechnologyResearch | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [researchForm, setResearchForm] = useState<ResearchFormData>({
    title: "",
    description: "",
    researchArea: "",
    status: "Ongoing",
    startDate: null,
    expectedCompletion: null,
    funding: 0,
    teamMembers: [],
    objectives: [],
    currentProjects: [],
    publications: [],
    partners: [],
    outcomes: [],
    icon: "Microscope",
    isActive: true,
  });

  // Dynamic form fields state
  const [newOutcome, setNewOutcome] = useState("");
  const [newObjective, setNewObjective] = useState("");

  // Queries and Mutations
  const { data: research = [], isPending: researchLoading } = useQuery<TechnologyResearch[]>({
    queryKey: ["/api/technology-research"],
  });

  const createResearchMutation = useMutation({
    mutationFn: (data: ResearchFormData) =>
      apiRequest("/api/technology-research", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          position: research.length,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-research"] });
      setShowResearchDialog(false);
      setEditingResearch(null);
      resetForm();
      toast({
        title: "Success",
        description: "Research item created successfully",
      });
    },
  });

  const updateResearchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ResearchFormData> }) =>
      apiRequest(`/api/technology-research/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-research"] });
      setShowResearchDialog(false);
      setEditingResearch(null);
      toast({
        title: "Success",
        description: "Research item updated successfully",
      });
    },
  });

  const deleteResearchMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/technology-research/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-research"] });
      toast({
        title: "Success",
        description: "Research item deleted successfully",
      });
    },
  });

  const reorderResearchMutation = useMutation({
    mutationFn: (research: { id: number; position: number }[]) =>
      apiRequest("/api/technology-research/reorder", {
        method: "PATCH",
        body: JSON.stringify({ research }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-research"] });
    },
  });

  const resetForm = () => {
    setResearchForm({
      title: "",
      description: "",
      researchArea: "",
      status: "Ongoing",
      startDate: null,
      expectedCompletion: null,
      funding: 0,
      teamMembers: [],
      objectives: [],
      currentProjects: [],
      publications: [],
      partners: [],
      outcomes: [],
      icon: "Microscope",
      isActive: true,
    });
    setNewOutcome("");
    setNewObjective("");
  };

  // Event Handlers
  const handleResearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingResearch) {
      updateResearchMutation.mutate({
        id: editingResearch.id,
        data: researchForm,
      });
    } else {
      createResearchMutation.mutate(researchForm);
    }
  };

  const handleEditResearch = (research: TechnologyResearch) => {
    setEditingResearch(research);
    setResearchForm({
      title: research.title,
      description: research.description || "",
      researchArea: research.researchArea || "",
      status: research.status || "Ongoing",
      startDate: research.startDate || null,
      expectedCompletion: research.expectedCompletion || null,
      funding: research.funding ? Number(research.funding) : 0,
      teamMembers: research.teamMembers || [],
      objectives: research.objectives || [],
      currentProjects: research.currentProjects || [],
      publications: research.publications || [],
      partners: research.partners || [],
      outcomes: research.outcomes || [],
      icon: research.icon || "Microscope",
      isActive: research.isActive ?? true,
    });
    setShowResearchDialog(true);
  };

  const handleResearchDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = research.findIndex((r) => r.id === active.id);
      const newIndex = research.findIndex((r) => r.id === over.id);
      const newResearch = arrayMove(research, oldIndex, newIndex);
      const updates = newResearch.map((res, index) => ({
        id: res.id,
        position: index,
      }));
      reorderResearchMutation.mutate(updates);
    }
  };

  const filteredResearch = useMemo(() => {
    return research.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.researchArea?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [research, searchQuery]);

  const loading = externalLoading || researchLoading;

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setResearchForm({
        ...researchForm,
        objectives: [...researchForm.objectives, newObjective.trim()],
      });
      setNewObjective("");
    }
  };

  const handleAddOutcome = () => {
    if (newOutcome.trim()) {
      setResearchForm({ ...researchForm, outcomes: [...researchForm.outcomes, newOutcome.trim()] });
      setNewOutcome("");
    }
  };

  return (
    <div className="space-y-12">
      {/* Header & Controls Overlay */}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between font-display">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.15)]">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
                Research <span className="text-[#00D4FF]">&</span> Development
              </h2>
              <p className="text-sm font-medium tracking-wide text-[#E3DFD6]/40">
                Manage core scientific initiatives and material innovation streams.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E3DFD6]/20 transition-colors group-focus-within:text-[#00D4FF]" />
            <Input
              placeholder="Filter by title or focus area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-white/[0.08] bg-white/[0.03] pl-10 text-xs font-medium tracking-wider text-white transition-all focus:border-[#00D4FF]/50 focus:ring-[#00D4FF]/20 sm:w-80"
            />
          </div>
          <Button
            onClick={() => {
              setEditingResearch(null);
              resetForm();
              setShowResearchDialog(true);
            }}
            className="group relative overflow-hidden bg-[#00D4FF] px-6 py-6 font-black text-[#0A0A0A] hover:bg-[#00D4FF]/90 transition-all active:scale-95"
          >
            <div className="relative z-10 flex items-center gap-2 uppercase tracking-widest">
              <Plus className="h-5 w-5" />
              Initialize Research
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#00D4FF] via-white/20 to-[#00D4FF] opacity-0 transition-opacity group-hover:opacity-10" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h3 className="text-sm font-black tracking-[0.2em] text-[#00D4FF] uppercase">
            Active Research Streams
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#E3DFD6]/40 uppercase tracking-widest">
            {filteredResearch.length} INITIATIVES IDENTIFIED
          </span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00D4FF] border-t-transparent" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#00D4FF]">
                Syncing Ecosystem Data...
              </p>
            </div>
          </div>
        ) : filteredResearch.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] p-12 text-center backdrop-blur-xl">
            <div className="mb-4 rounded-full bg-white/[0.05] p-4 text-[#E3DFD6]/20">
              <FlaskConical className="h-12 w-12" />
            </div>
            <p className="max-w-xs text-sm font-medium text-[#E3DFD6]/40">
              No research initiatives matching your search filters. Adjust parameters or initialize
              a new asset.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleResearchDragEnd}
          >
            <SortableContext
              items={filteredResearch.map((r: TechnologyResearch) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {filteredResearch.map((res: TechnologyResearch) => (
                  <SortableResearchItem
                    key={res.id}
                    research={res}
                    onEdit={handleEditResearch}
                    onDelete={(id: number) => deleteResearchMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Ecosystem Stats (from Screen #22) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 font-display pt-8 border-t border-white/[0.08]">
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-[#00D4FF]/30 backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#00D4FF]/20 group-hover:bg-[#00D4FF] transition-all" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E3DFD6]/40 mb-1">
            R&D Budget Allocation
          </p>
          <div className="text-3xl font-black text-white">64.2%</div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full w-[64.2%] rounded-full bg-gradient-to-r from-[#00D4FF] to-[#00D4FF]/50 shadow-[0_0_15px_#00D4FF]" />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-[#00D4FF]/30 backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#00D4FF]/20 group-hover:bg-[#00D4FF] transition-all" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E3DFD6]/40 mb-1">
            Active Researchers
          </p>
          <div className="text-3xl font-black text-white">24</div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#00D4FF]">
            +3 since last cycle
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-[#00D4FF]/30 backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#00D4FF]/20 group-hover:bg-[#00D4FF] transition-all" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E3DFD6]/40 mb-1">
            Pending IP/Patents
          </p>
          <div className="text-3xl font-black text-white">09</div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            2 Approved this month
          </p>
        </div>
      </div>

      {/* Research Form Dialog */}
      <Dialog open={showResearchDialog} onOpenChange={setShowResearchDialog}>
        <DialogContent
          contentType="form"
          preferredSize="4xl"
          className="overflow-hidden bg-[#0A0A0A] border-[#00D4FF]/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <DialogHeader className="border-b border-white/[0.08] bg-white/[0.02] px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
                {editingResearch ? <Settings2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white uppercase font-display">
                  {editingResearch ? "Reconfigure" : "Initialize"}{" "}
                  <span className="text-[#00D4FF]">Research</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-[#E3DFD6]/40">
                  Document and track high-impact scientific initiatives.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={handleResearchSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-hidden font-display"
          >
            <DialogBody className="custom-scrollbar space-y-8 px-8 py-8">
              {/* Primary Configuration */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-2 border-[#00D4FF] pl-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D4FF]">
                    Primary Stream
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Initiative Title *
                    </Label>
                    <Input
                      value={researchForm.title}
                      onChange={(e) => setResearchForm({ ...researchForm, title: e.target.value })}
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., Biomechanical Mesh Optimization phase II"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Research Focus
                    </Label>
                    <Input
                      value={researchForm.researchArea}
                      onChange={(e) =>
                        setResearchForm({ ...researchForm, researchArea: e.target.value })
                      }
                      className="border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                      placeholder="e.g., Sustainable Polymers, Ergonomics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                      Current Status
                    </Label>
                    <Select
                      value={researchForm.status}
                      onValueChange={(value) => setResearchForm({ ...researchForm, status: value })}
                    >
                      <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/[0.1]">
                        <SelectItem value="Planning">Planned / Theoretical</SelectItem>
                        <SelectItem value="In Progress">Active Benchwork</SelectItem>
                        <SelectItem value="Testing" className="text-amber-400">
                          Beta Testing / QA
                        </SelectItem>
                        <SelectItem value="Completed" className="text-emerald-400">
                          Concluded / Published
                        </SelectItem>
                        <SelectItem value="Ongoing">Standard Initiative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-[#E3DFD6]/60">
                    Research Abstract
                  </Label>
                  <Textarea
                    value={researchForm.description}
                    onChange={(e) =>
                      setResearchForm({ ...researchForm, description: e.target.value })
                    }
                    className="min-h-[100px] border-white/[0.08] bg-white/[0.03] text-sm focus-visible:ring-[#00D4FF]/30"
                    placeholder="Provide a comprehensive technical summary of the research goals and methodology..."
                  />
                </div>
              </div>

              {/* Dynamic Sections Grid */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Objectives Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-l-2 border-[#00D4FF] pl-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D4FF]">
                      Key Objectives
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="Identify specific milestone..."
                        className="h-10 border-white/[0.08] bg-white/[0.03] text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddObjective();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddObjective}
                        className="bg-white/[0.05] hover:bg-white/[0.1] text-[#00D4FF]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {researchForm.objectives.map((obj, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.05] px-4 py-2"
                        >
                          <span className="text-xs text-[#E3DFD6]/60 line-clamp-1">{obj}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-rose-500"
                            onClick={() =>
                              setResearchForm({
                                ...researchForm,
                                objectives: researchForm.objectives.filter((_, idx) => idx !== i),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Outcomes Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                      Targeted Outcomes
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newOutcome}
                        onChange={(e) => setNewOutcome(e.target.value)}
                        placeholder="Specific yield or result..."
                        className="h-10 border-white/[0.08] bg-white/[0.03] text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddOutcome();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddOutcome}
                        className="bg-white/[0.05] hover:bg-white/[0.1] text-emerald-500"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {researchForm.outcomes.map((out, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.05] px-4 py-2"
                        >
                          <span className="text-xs text-[#E3DFD6]/60 line-clamp-1">{out}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-rose-500"
                            onClick={() =>
                              setResearchForm({
                                ...researchForm,
                                outcomes: researchForm.outcomes.filter((_, idx) => idx !== i),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
                    <Layout className="h-5 w-5 text-[#E3DFD6]/40" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white uppercase tracking-wider">
                      Ecosystem Visibility
                    </h5>
                    <p className="text-[10px] font-medium text-[#E3DFD6]/40">
                      Toggle public indexing for this research stream.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "text-[10px] font-black tracking-widest uppercase transition-colors",
                      researchForm.isActive ? "text-[#00D4FF]" : "text-[#E3DFD6]/20",
                    )}
                  >
                    {researchForm.isActive ? "Indexed" : "Hidden"}
                  </span>
                  <Switch
                    checked={researchForm.isActive}
                    onCheckedChange={(checked) =>
                      setResearchForm({ ...researchForm, isActive: checked })
                    }
                    className="data-[state=checked]:bg-[#00D4FF]"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-white/[0.08] bg-white/[0.02] px-8 py-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowResearchDialog(false)}
                className="text-[#E3DFD6]/60 hover:text-white"
              >
                DISCARD CHANGES
              </Button>
              <Button
                type="submit"
                disabled={createResearchMutation.isPending || updateResearchMutation.isPending}
                className="bg-[#00D4FF] px-8 font-black text-[#0A0A0A] hover:bg-[#00D4FF]/90 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
              >
                {createResearchMutation.isPending || updateResearchMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    SYNCING...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 uppercase tracking-widest">
                    <Save className="h-4 w-4" />
                    {editingResearch ? "Push Config" : "Initialize Stream"}
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
