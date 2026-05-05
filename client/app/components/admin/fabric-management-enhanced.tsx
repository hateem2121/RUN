import type { Certificate, Fabric, Fiber, MediaAsset } from "@shared/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shirt } from "lucide-react";
import { useMemo, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FabricCard } from "./fabric/FabricCard";
import { FabricFilters } from "./fabric/FabricFilters";
import { FabricForm } from "./fabric/FabricForm";
import { FabricStats } from "./fabric/FabricStats";
import {
  type EnhancedFormData,
  getButtonTestId,
  initialFormData,
  parseNumericValue,
} from "./fabric/types";

export function FabricManagementEnhancedV2() {
  const [formData, setFormData] = useState<EnhancedFormData>(initialFormData);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fabricToDelete, setFabricToDelete] = useState<Fabric | null>(null);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "detailed">("grid");
  const [sortBy] = useState("name");
  const [sortDirection] = useState<"asc" | "desc">("asc");
  const [filters] = useState({
    status: "all",
    weightCategory: "all",
    sustainability: "all",
    certification: "all",
    fabricType: "all",
    performanceFeatures: "all",
  });

  // Expandable Cards
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // Section Collapse States
  const [sectionsOpen, setSectionsOpen] = useState({
    classification: true,
    performance: true,
    durability: true,
    sustainability: true,
    care: true,
  });

  // Media Picker State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [selectedSwatchAsset, setSelectedSwatchAsset] = useState<MediaAsset | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: fabrics = [], isPending: isLoading } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });

  const { data: fibers = [] } = useQuery<Fiber[]>({
    queryKey: ["/api/fibers"],
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Filtered and sorted fabrics
  const filteredAndSortedFabrics = useMemo(() => {
    const filtered = fabrics.filter((fabric) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          fabric.name.toLowerCase().includes(searchLower) ||
          fabric.description?.toLowerCase().includes(searchLower) ||
          fabric.fabricType?.toLowerCase().includes(searchLower) ||
          (fabric.properties &&
            JSON.stringify(fabric.properties).toLowerCase().includes(searchLower));
        if (!matchesSearch) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== "all") {
        if (filterStatus === "active" && !fabric.isActive) {
          return false;
        }
        if (filterStatus === "inactive" && fabric.isActive) {
          return false;
        }
      }

      // Weight category filter
      if (filters.weightCategory !== "all" && fabric.weight) {
        const weight = parseNumericValue(fabric.weight);
        if (weight !== null) {
          if (filters.weightCategory === "light" && weight >= 150) {
            return false;
          }
          if (filters.weightCategory === "medium" && (weight < 150 || weight > 300)) {
            return false;
          }
          if (filters.weightCategory === "heavy" && weight <= 300) {
            return false;
          }
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "weight":
          aValue = a.weight || 0;
          bValue = b.weight || 0;
          break;
        case "sustainability":
          aValue = a.sustainabilityScore || 0;
          bValue = b.sustainabilityScore || 0;
          break;
        case "created":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default: // name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [fabrics, searchTerm, filterStatus, filters, sortBy, sortDirection]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("/api/fabrics", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabrics"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({ title: "Success", description: "Fabric created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create fabric",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiRequest(`/api/fabrics/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabrics"] });
      setIsEditModalOpen(false);
      setEditingFabric(null);
      resetForm();
      toast({ title: "Success", description: "Fabric updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fabric",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/fabrics/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabrics"] });
      setDeleteConfirmOpen(false);
      setFabricToDelete(null);
      toast({ title: "Success", description: "Fabric deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fabric",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedSwatchAsset(null);
  };

  const toggleSectionOpen = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCardExpanded = (fabricId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fabricId)) {
        newSet.delete(fabricId);
      } else {
        newSet.add(fabricId);
      }
      return newSet;
    });
  };

  // Media picker handlers
  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const selectedAsset = Array.isArray(assets) ? assets[0] : assets;
    if (!selectedAsset) {
      return;
    }

    if (selectedAsset.id) {
      setFormData((prev) => ({
        ...prev,
        visualSwatchId: selectedAsset.id,
      }));
      setSelectedSwatchAsset(selectedAsset);
      toast({
        title: "Visual Swatch Selected",
        description: `Selected: ${selectedAsset.filename || "Media asset"}`,
      });
    }
  };

  const handleEdit = (fabric: Fabric) => {
    setEditingFabric(fabric);
    const props = fabric.properties || {};

    setFormData({
      name: fabric.name || "",
      description: fabric.description || "",
      weight: fabric.weight?.toString() || "",
      isActive: fabric.isActive ?? true,
      sport: fabric.sport || "",
      marketSegment: fabric.marketSegment || "",
      seasonality: fabric.seasonality || "",
      compositions: props.compositions || [{ name: "Standard", isDefault: true, fibers: [] }],
      fabricType: fabric.fabricType || "",
      weave: fabric.weave || "",
      finish: props.finish || fabric.finishTreatment || "",
      keyApplications: fabric.keyApplications || [],
      weaveTypes: fabric.weaveTypes || [],
      finishTreatments: props.finishTreatments || [],
      stretchPercentage: props.stretchPercentage?.toString() || "",
      stretchDirection: props.stretchDirection || [],
      breathability: props.breathability?.toString() || "",
      moistureManagement: props.moistureManagement || "",
      enhancedMoistureManagement: props.enhancedMoistureManagement || "",
      wickingRate: props.wickingRate || "",
      dryingTime: props.dryingTime || "",
      performanceFeatures: props.performanceFeatures || [],
      airPermeability: props.airPermeability?.toString() || "",
      waterColumn: props.waterColumn?.toString() || "",
      yarnCountConstruction: props.yarnCountConstruction || "",
      colorfastness: props.colorfastness || "",
      tensileStrength: props.tensileStrength || "",
      tearStrength: props.tearStrength || "",
      abrasionResistance: props.abrasionResistance?.toString() || "",
      pillingGrade: props.pillingGrade?.toString() || "",
      shrinkageTolerancePercentage: props.shrinkageTolerancePercentage?.toString() || "",
      washTemperature: props.washTemperature || "",
      sustainabilityScore: fabric.sustainabilityScore?.toString() || "",
      certificationIds: props.certificationIds || [],
      certificationTags: props.certificationTags || [],
      endOfLifeOptions: props.endOfLifeOptions || [],
      recyclabilityNotes: props.recyclabilityNotes || "",
      useCases: props.useCases || [],
      washCareInstructions: props.washCareInstructions || {
        careSymbols: [],
        instructions: fabric.careInstructions || "",
        restrictions: [],
      },
      visualSwatchId: fabric.visualSwatchId || null,
    });

    if (fabric.visualSwatchId) {
      // Ideally we'd fetch the asset details here, but for now we'll rely on the picker or a simplified view
      // In a full implementation, you'd fetch /api/media/:id
    } else {
      setSelectedSwatchAsset(null);
    }

    setIsEditModalOpen(true);
  };

  const handleDelete = (fabric: Fabric) => {
    setFabricToDelete(fabric);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Fabric name is required",
        variant: "destructive",
      });
      return;
    }

    const cleanEmptyStrings = (value: unknown) =>
      value === "" || value === null ? undefined : value;

    const apiData = {
      ...formData,
      description: cleanEmptyStrings(formData.description),
      weight: cleanEmptyStrings(formData.weight),
      sustainabilityScore: cleanEmptyStrings(formData.sustainabilityScore),
      visualSwatchId: formData.visualSwatchId ? Number(formData.visualSwatchId) : undefined,
    };

    if (editingFabric) {
      updateMutation.mutate({ id: editingFabric.id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  return (
    <div className="mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Enhanced Fabric Management
          </h1>
          <p className="text-admin-muted">
            Comprehensive fabric management with structured properties
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          data-testid={getButtonTestId("create", "fabric")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Fabric
        </Button>
      </div>

      <FabricStats fabrics={fabrics} />

      <FabricFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {isLoading ? (
        <Card className="glass-premium">
          <CardContent className="p-12 text-center">Loading...</CardContent>
        </Card>
      ) : fabrics.length === 0 ? (
        <Card className="glass-premium">
          <CardContent className="p-12 text-center">
            <Shirt className="mx-auto mb-4 h-12 w-12 text-admin-muted" />
            <h3 className="text-xl font-semibold">No Fabrics Found</h3>
            <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
              Create First Fabric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredAndSortedFabrics.map((fabric) => (
            <FabricCard
              key={fabric.id}
              fabric={fabric}
              isExpanded={expandedCards.has(fabric.id)}
              onToggleExpand={() => toggleCardExpanded(fabric.id)}
              onEdit={() => handleEdit(fabric)}
              onDelete={() => handleDelete(fabric)}
              certificates={certificates}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl" contentType="form">
          <DialogHeader>
            <DialogTitle>{editingFabric ? "Edit Fabric" : "Create New Fabric"}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FabricForm
              formData={formData}
              setFormData={setFormData}
              fibers={fibers}
              certificates={certificates}
              sectionsOpen={sectionsOpen}
              toggleSectionOpen={(section) =>
                toggleSectionOpen(section as keyof typeof sectionsOpen)
              }
              setIsMediaPickerOpen={setIsMediaPickerOpen}
              setSelectedSwatchAsset={setSelectedSwatchAsset}
              selectedSwatchAsset={selectedSwatchAsset}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingFabric ? "Update Fabric" : "Create Fabric"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {fabricToDelete?.name}?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => fabricToDelete && deleteMutation.mutate(fabricToDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        mediaPickerTarget="fabric-swatch"
        onSelect={handleMediaSelect}
        title="Select Fabric Swatch"
      />
    </div>
  );
}
