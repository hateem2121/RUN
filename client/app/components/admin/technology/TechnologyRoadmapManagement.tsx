import type { MediaAsset } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Edit,
  Image as ImageIcon,
  Plus,
  Target,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface RoadmapFormData {
  title: string;
  timeline: string;
  description: string;
  impact: string[];
  imageId: number | null;
  videoId: number | null;
  isActive: boolean;
}

interface TechnologyRoadmap {
  id: number;
  title: string;
  timeline: string;
  description?: string | undefined;
  impact?: string[];
  imageId?: number | null;
  videoId?: number | null;
  isActive?: boolean | undefined;
  position?: number | undefined;
}

interface TechnologyRoadmapManagementProps {
  isLoading?: boolean | undefined;
}

export function TechnologyRoadmapManagement({
  isLoading: externalLoading,
}: TechnologyRoadmapManagementProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [showRoadmapDialog, setShowRoadmapDialog] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<TechnologyRoadmap | null>(null);

  const [roadmapForm, setRoadmapForm] = useState<RoadmapFormData>({
    title: "",
    timeline: "",
    description: "",
    impact: [],
    imageId: null,
    videoId: null,
    isActive: true,
  });

  const [newImpact, setNewImpact] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  // Queries and Mutations
  const { data: roadmap = [], isPending: roadmapLoading } = useQuery<TechnologyRoadmap[]>({
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
      setEditingRoadmap(null);
      setRoadmapForm({
        title: "",
        timeline: "",
        description: "",
        impact: [],
        imageId: null,
        videoId: null,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Roadmap milestone created successfully",
      });
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
      toast({
        title: "Success",
        description: "Roadmap milestone updated successfully",
      });
    },
  });

  const deleteRoadmapMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/technology-roadmap/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-roadmap"] });
      toast({
        title: "Success",
        description: "Roadmap milestone deleted successfully",
      });
    },
  });

  // Event Handlers
  const handleRoadmapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoadmap) {
      updateRoadmapMutation.mutate({
        id: editingRoadmap.id,
        data: roadmapForm,
      });
    } else {
      createRoadmapMutation.mutate(roadmapForm);
    }
  };

  const handleEditRoadmap = (roadmap: TechnologyRoadmap) => {
    setEditingRoadmap(roadmap);
    setRoadmapForm({
      title: roadmap.title,
      timeline: roadmap.timeline,
      description: roadmap.description || "",
      impact: roadmap.impact || [],
      imageId: roadmap.imageId || null,
      videoId: roadmap.videoId || null,
      isActive: roadmap.isActive ?? true,
    });
    setShowRoadmapDialog(true);
  };

  const handleAddImpact = () => {
    if (newImpact) {
      setRoadmapForm({
        ...roadmapForm,
        impact: [...roadmapForm.impact, newImpact],
      });
      setNewImpact("");
    }
  };

  const handleRemoveImpact = (index: number) => {
    setRoadmapForm({
      ...roadmapForm,
      impact: roadmapForm.impact.filter((_, i) => i !== index),
    });
  };

  const loading = externalLoading || roadmapLoading;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Technology Roadmap</CardTitle>
            <CardDescription>
              Plan and showcase future technology developments and milestones
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingRoadmap(null);
              setRoadmapForm({
                title: "",
                timeline: "",
                description: "",
                impact: [],
                imageId: null,
                videoId: null,
                isActive: true,
              });
              setShowRoadmapDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Roadmap Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : roadmap.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No roadmap milestones added yet. Click "Add Roadmap Milestone" to showcase your
            technology development plans.
          </div>
        ) : (
          <div className="space-y-4">
            {roadmap.map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-4 shadow-sm-xs">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.timeline}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="mt-2 text-muted-foreground text-sm">{item.description}</p>
                          )}
                          {item.impact && item.impact.length > 0 && (
                            <div className="mt-2">
                              <p className="mb-1 font-medium text-muted-foreground text-xs">
                                Expected Impact:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {item.impact.slice(0, 3).map((impact, index) => (
                                  <span
                                    key={index}
                                    className="rounded bg-green-100 px-2 py-0.5 text-green-700 text-xs"
                                  >
                                    <Target className="mr-1 inline h-3 w-3" />
                                    {impact}
                                  </span>
                                ))}
                                {item.impact.length > 3 && (
                                  <span className="text-muted-foreground text-xs">
                                    +{item.impact.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {(item.imageId || item.videoId) && (
                            <div className="mt-2 flex gap-2">
                              {item.imageId && (
                                <Badge variant="secondary" className="text-xs">
                                  <ImageIcon className="mr-1 h-3 w-3" /> Image
                                </Badge>
                              )}
                              {item.videoId && (
                                <Badge variant="secondary" className="text-xs">
                                  <VideoIcon className="mr-1 h-3 w-3" /> Video
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-start gap-2">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEditRoadmap(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteRoadmapMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Roadmap Form Dialog */}
      <Dialog open={showRoadmapDialog} onOpenChange={setShowRoadmapDialog}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>
              {editingRoadmap ? "Edit Roadmap Milestone" : "Add New Roadmap Milestone"}
            </DialogTitle>
            <DialogDescription>
              {editingRoadmap
                ? "Update the roadmap milestone details"
                : "Create a new roadmap milestone"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRoadmapSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={roadmapForm.title}
                  onChange={(e) => setRoadmapForm({ ...roadmapForm, title: e.target.value })}
                  placeholder="e.g., Smart Sensor Integration"
                  required
                />
              </div>
              <div>
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                  id="timeline"
                  value={roadmapForm.timeline}
                  onChange={(e) => setRoadmapForm({ ...roadmapForm, timeline: e.target.value })}
                  placeholder="e.g., Q2 2024, 6 months, 2024-2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={roadmapForm.description}
                  onChange={(e) =>
                    setRoadmapForm({
                      ...roadmapForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the milestone and its objectives"
                  rows={3}
                />
              </div>

              {/* Media Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Milestone Image</Label>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowImagePicker(true)}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                    {roadmapForm.imageId && (
                      <div className="mt-2 flex items-center justify-between rounded bg-background p-2 text-muted-foreground text-sm">
                        <span>Image ID: {roadmapForm.imageId}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600"
                          onClick={() => setRoadmapForm({ ...roadmapForm, imageId: null })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Milestone Video</Label>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowVideoPicker(true)}
                    >
                      <VideoIcon className="mr-2 h-4 w-4" />
                      Select Video
                    </Button>
                    {roadmapForm.videoId && (
                      <div className="mt-2 flex items-center justify-between rounded bg-background p-2 text-muted-foreground text-sm">
                        <span>Video ID: {roadmapForm.videoId}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600"
                          onClick={() => setRoadmapForm({ ...roadmapForm, videoId: null })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Expected Impact</Label>
                <div className="mb-3 space-y-2">
                  {roadmapForm.impact.map((impact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-background p-2"
                    >
                      <span className="flex items-center text-sm">
                        <Target className="mr-2 h-3 w-3 text-green-600" />
                        {impact}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImpact(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Expected impact or benefit"
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddImpact}>
                    Add
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={roadmapForm.isActive}
                  onCheckedChange={(checked) =>
                    setRoadmapForm({ ...roadmapForm, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="submit">
                {editingRoadmap ? "Update Milestone" : "Create Milestone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Media Selection Dialogs */}
      <StandardMediaSelectionDialog
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(assets: MediaAsset | MediaAsset[]) => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) {
            setRoadmapForm({ ...roadmapForm, imageId: asset.id });
          }
        }}
        title="Select Milestone Image"
        mediaPickerTarget="roadmap-image"
        selectionMode="single"
      />

      <StandardMediaSelectionDialog
        isOpen={showVideoPicker}
        onClose={() => setShowVideoPicker(false)}
        onSelect={(assets: MediaAsset | MediaAsset[]) => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) {
            setRoadmapForm({ ...roadmapForm, videoId: asset.id });
          }
        }}
        title="Select Milestone Video"
        mediaPickerTarget="roadmap-video"
        selectionMode="single"
      />
    </Card>
  );
}
