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
import { Plus, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
  description?: string | undefined;
  researchArea?: string | undefined;
  status?: "Planning" | "In Progress" | "Testing" | "Completed" | "Ongoing";
  startDate?: Date | null;
  expectedCompletion?: Date | null;
  funding?: number | undefined;
  teamMembers?: string[];
  objectives?: string[];
  currentProjects?: ResearchProject[];
  publications?: string[];
  partners?: string[];
  outcomes?: string[];
  icon?: string | undefined;
  isActive?: boolean | undefined;
  position?: number | undefined;
}

interface TechnologyResearchManagementProps {
  isLoading?: boolean | undefined;
}

export function TechnologyResearchManagement({
  isLoading: externalLoading,
}: TechnologyResearchManagementProps) {
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
  const [newProject, setNewProject] = useState<ResearchProject>({
    name: "",
    status: "Planning",
    progress: 0,
  });
  const [newPublication, setNewPublication] = useState("");
  const [newPartner, setNewPartner] = useState("");
  const [newOutcome, setNewOutcome] = useState("");
  const [newTeamMember, setNewTeamMember] = useState("");
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
      setNewProject({ name: "", status: "Planning", progress: 0 });
      setNewPublication("");
      setNewPartner("");
      setNewOutcome("");
      setNewTeamMember("");
      setNewObjective("");
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
      icon: research.icon || "Microscope", // Default as it's not in schema but used in UI
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

  const handleAddProject = () => {
    if (newProject.name) {
      setResearchForm({
        ...researchForm,
        currentProjects: [...researchForm.currentProjects, newProject],
      });
      setNewProject({
        name: "",
        status: "Planning",
        progress: 0,
      });
    }
  };

  const handleRemoveProject = (index: number) => {
    setResearchForm({
      ...researchForm,
      currentProjects: researchForm.currentProjects.filter((_, i) => i !== index),
    });
  };

  const handleAddPublication = () => {
    if (newPublication) {
      setResearchForm({
        ...researchForm,
        publications: [...researchForm.publications, newPublication],
      });
      setNewPublication("");
    }
  };

  const handleRemovePublication = (index: number) => {
    setResearchForm({
      ...researchForm,
      publications: researchForm.publications.filter((_, i) => i !== index),
    });
  };

  const handleAddPartner = () => {
    if (newPartner) {
      setResearchForm({
        ...researchForm,
        partners: [...researchForm.partners, newPartner],
      });
      setNewPartner("");
    }
  };

  const handleRemovePartner = (index: number) => {
    setResearchForm({
      ...researchForm,
      partners: researchForm.partners.filter((_, i) => i !== index),
    });
  };

  const handleAddOutcome = () => {
    if (newOutcome) {
      setResearchForm({
        ...researchForm,
        outcomes: [...researchForm.outcomes, newOutcome],
      });
      setNewOutcome("");
    }
  };

  const handleRemoveOutcome = (index: number) => {
    setResearchForm({
      ...researchForm,
      outcomes: researchForm.outcomes.filter((_, i) => i !== index),
    });
  };

  const handleAddTeamMember = () => {
    if (newTeamMember) {
      setResearchForm({
        ...researchForm,
        teamMembers: [...researchForm.teamMembers, newTeamMember],
      });
      setNewTeamMember("");
    }
  };

  const handleRemoveTeamMember = (index: number) => {
    setResearchForm({
      ...researchForm,
      teamMembers: researchForm.teamMembers.filter((_, i) => i !== index),
    });
  };

  const handleAddObjective = () => {
    if (newObjective) {
      setResearchForm({
        ...researchForm,
        objectives: [...researchForm.objectives, newObjective],
      });
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (index: number) => {
    setResearchForm({
      ...researchForm,
      objectives: researchForm.objectives.filter((_, i) => i !== index),
    });
  };

  const loading = externalLoading || researchLoading;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Research & Development</CardTitle>
            <CardDescription>Manage your R&D projects and initiatives</CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingResearch(null);
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
              setNewProject({ name: "", status: "Planning", progress: 0 });
              setNewPublication("");
              setNewPartner("");
              setNewOutcome("");
              setNewTeamMember("");
              setNewObjective("");
              setShowResearchDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Research Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : research.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No research items added yet. Click "Add Research Item" to showcase your R&D efforts.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleResearchDragEnd}
          >
            <SortableContext
              items={research.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {research.map((res) => (
                <SortableResearchItem
                  key={res.id}
                  research={res}
                  onEdit={handleEditResearch}
                  onDelete={(id: number) => deleteResearchMutation.mutate(id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {/* Research Form Dialog */}
      <Dialog open={showResearchDialog} onOpenChange={setShowResearchDialog}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>
              {editingResearch ? "Edit Research Item" : "Add New Research Item"}
            </DialogTitle>
            <DialogDescription>
              {editingResearch ? "Update the research item details" : "Create a new research item"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResearchSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={researchForm.title}
                  onChange={(e) => setResearchForm({ ...researchForm, title: e.target.value })}
                  placeholder="e.g., Smart Fabric Research Lab"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="researchArea">Research Area</Label>
                  <Input
                    id="researchArea"
                    value={researchForm.researchArea}
                    onChange={(e) =>
                      setResearchForm({
                        ...researchForm,
                        researchArea: e.target.value,
                      })
                    }
                    placeholder="e.g., Sustainable Materials"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={researchForm.status}
                    onValueChange={(value: "Ongoing" | "Completed" | "Planned") =>
                      setResearchForm({ ...researchForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={
                      researchForm.startDate
                        ? new Date(researchForm.startDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setResearchForm({
                        ...researchForm,
                        startDate: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="expectedCompletion">Expected Completion</Label>
                  <Input
                    id="expectedCompletion"
                    type="date"
                    value={
                      researchForm.expectedCompletion
                        ? new Date(researchForm.expectedCompletion).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setResearchForm({
                        ...researchForm,
                        expectedCompletion: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="funding">Funding Amount</Label>
                <Input
                  id="funding"
                  type="number"
                  value={researchForm.funding}
                  onChange={(e) =>
                    setResearchForm({
                      ...researchForm,
                      funding: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={researchForm.description}
                  onChange={(e) =>
                    setResearchForm({
                      ...researchForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the research initiative"
                  rows={3}
                />
              </div>

              {/* Objectives Section */}
              <div>
                <Label>Objectives</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Enter objective"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddObjective();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddObjective}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {researchForm.objectives.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {researchForm.objectives.map((objective, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded bg-background p-2"
                      >
                        <span className="text-sm">{objective}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveObjective(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Team Members Section */}
              <div>
                <Label>Team Members</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newTeamMember}
                    onChange={(e) => setNewTeamMember(e.target.value)}
                    placeholder="Enter team member name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTeamMember();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTeamMember}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {researchForm.teamMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {researchForm.teamMembers.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-purple-700 text-sm"
                      >
                        {member}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-purple-200"
                          onClick={() => handleRemoveTeamMember(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Current Projects</Label>
                <div className="mb-3 space-y-2">
                  {researchForm.currentProjects.map((project, index) => (
                    <div key={index} className="rounded-md bg-background p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{project.name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-xs ${
                                project.status === "Completed"
                                  ? "bg-green-100 text-green-700"
                                  : project.status === "In Progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : project.status === "Testing"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-muted text-foreground/80"
                              }`}
                            >
                              {project.status}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Progress value={project.progress} className="h-1.5" />
                            <span className="text-muted-foreground text-xs">
                              {project.progress}% complete
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProject(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Project name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                  <Select
                    value={newProject.status}
                    onValueChange={(value: "Planning" | "In Progress" | "Testing" | "Completed") =>
                      setNewProject({ ...newProject, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Testing">Testing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Progress %"
                      min="0"
                      max="100"
                      value={newProject.progress}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          progress: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                    <Button type="button" onClick={handleAddProject}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Publications</Label>
                <div className="mb-3 space-y-2">
                  {researchForm.publications.map((publication, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-background p-2"
                    >
                      <span className="text-sm">{publication}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePublication(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Publication title or link"
                    value={newPublication}
                    onChange={(e) => setNewPublication(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddPublication}>
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Research Partners</Label>
                <div className="mb-3 space-y-2">
                  {researchForm.partners.map((partner, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-background p-2"
                    >
                      <span className="text-sm">{partner}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePartner(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Partner name"
                    value={newPartner}
                    onChange={(e) => setNewPartner(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddPartner}>
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Research Outcomes</Label>
                <div className="mb-3 space-y-2">
                  {researchForm.outcomes.map((outcome, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-background p-2"
                    >
                      <span className="text-sm">{outcome}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOutcome(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Research outcome"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddOutcome}>
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Icon</Label>
                <Select
                  value={researchForm.icon}
                  onValueChange={(value) => setResearchForm({ ...researchForm, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Microscope">Microscope</SelectItem>
                    <SelectItem value="Flask">Flask</SelectItem>
                    <SelectItem value="Atom">Atom</SelectItem>
                    <SelectItem value="Dna">DNA</SelectItem>
                    <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                    <SelectItem value="Cpu">CPU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={researchForm.isActive}
                  onCheckedChange={(checked) =>
                    setResearchForm({ ...researchForm, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="submit">
                {editingResearch ? "Update Research" : "Create Research"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
