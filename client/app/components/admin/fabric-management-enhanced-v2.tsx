import type { Certificate, Fabric, Fiber, MediaAsset } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  Globe,
  Grid3X3,
  Image,
  Layers,
  List,
  Palette,
  Plus,
  Recycle,
  Search,
  Shield,
  Shirt,
  Star,
  Table,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
// Removed problematic hook imports - using inline implementations
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { apiRequest } from "@/lib/queryClient";

interface EnhancedFormData {
  // === PRODUCT ESSENCE - B2B Core Fields ===
  // Basic Information
  name: string;
  description: string;
  weight: string;
  isActive: boolean;

  // B2B Filtering Fields
  sport: string;
  marketSegment: string;
  seasonality: string;

  // Fiber Composition (references /admin/fibers)
  compositions: Array<{
    name: string;
    isDefault: boolean;
    fibers: Array<{ fiberId: number | null; percentage: string }>;
  }>;

  // Classification
  fabricType: string;
  weave: string;
  finish: string;
  keyApplications: string[];
  weaveTypes: string[];
  finishTreatments: string[];

  // === PERFORMANCE & DURABILITY ===
  // Performance Metrics
  stretchPercentage: string;
  stretchDirection: string[];
  breathability: string;
  moistureManagement: string;
  enhancedMoistureManagement: string;
  wickingRate: string;
  dryingTime: string;
  performanceFeatures: string[];
  airPermeability: string;
  waterColumn: string;

  // Durability & Quality
  yarnCountConstruction: string;
  colorfastness: string; // NEW
  tensileStrength: string; // NEW
  tearStrength: string; // NEW
  abrasionResistance: string;
  pillingGrade: string;
  shrinkageTolerancePercentage: string;
  washTemperature: string;

  // === SUSTAINABILITY ===
  sustainabilityScore: string;
  certificationIds: number[];
  certificationTags: number[];
  endOfLifeOptions: string[];
  recyclabilityNotes: string;
  useCases: string[];

  // === CARE & MAINTENANCE ===
  washCareInstructions: {
    careSymbols: string[];
    instructions: string;
    restrictions: string[];
  };
  visualSwatchId: number | null;
}

const initialFormData: EnhancedFormData = {
  // PRODUCT ESSENCE
  name: "",
  description: "",
  weight: "",
  isActive: true,
  sport: "",
  marketSegment: "",
  seasonality: "",
  compositions: [
    {
      name: "Standard",
      isDefault: true,
      fibers: [],
    },
  ],
  fabricType: "",
  weave: "",
  finish: "",
  keyApplications: [],
  weaveTypes: [],
  finishTreatments: [],

  // PERFORMANCE & DURABILITY
  stretchPercentage: "",
  stretchDirection: [],
  breathability: "",
  moistureManagement: "",
  enhancedMoistureManagement: "",
  wickingRate: "",
  dryingTime: "",
  performanceFeatures: [],
  airPermeability: "",
  waterColumn: "",
  yarnCountConstruction: "",
  colorfastness: "",
  tensileStrength: "",
  tearStrength: "",
  abrasionResistance: "",
  pillingGrade: "",
  shrinkageTolerancePercentage: "",
  washTemperature: "",

  // SUSTAINABILITY
  sustainabilityScore: "",
  certificationIds: [],
  certificationTags: [],
  endOfLifeOptions: [],
  recyclabilityNotes: "",
  useCases: [],

  // CARE & MAINTENANCE
  washCareInstructions: {
    careSymbols: [],
    instructions: "",
    restrictions: [],
  },
  visualSwatchId: null,
};

// Helper functions for generating test IDs
const getButtonTestId = (action: string, target: string) => `button-${action}-${target}`;

const getInputTestId = (fieldName: string) => `input-fabric-${fieldName}`;

const getSelectTestId = (fieldName: string) => `select-fabric-${fieldName}`;

const getRepeatedTestId = (type: string, name: string, index: number) => `${type}-${name}-${index}`;

export default function FabricManagementEnhancedV2() {
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

  // Helper function to convert string values to numbers for comparison
  const parseNumericValue = useCallback((value: string | number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      // Handle empty strings
      if (value.trim() === "") {
        return null;
      }
      // Try to extract the first number from the string (handles ranges like "180-220")
      const match = value.match(/(\d+(?:\.\d+)?)/);
      return match?.[1] ? parseFloat(match[1]) : null;
    }
    return null;
  }, []);

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

  useQuery({
    queryKey: MediaQueryKeys.list,
    queryFn: async () => {
      const response = await fetch("/api/media");
      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }
      return response.json();
    },
  });

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
      if (filters.status !== "all") {
        if (filters.status === "active" && !fabric.isActive) {
          return false;
        }
        if (filters.status === "inactive" && fabric.isActive) {
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

      // Sustainability filter
      if (filters.sustainability !== "all") {
        const score = parseNumericValue(fabric.sustainabilityScore || "");
        if (filters.sustainability === "highSustainability" && (!score || score < 4)) {
          return false;
        }
        if (filters.sustainability === "mediumSustainability" && score !== 3) {
          return false;
        }
        if (filters.sustainability === "lowSustainability" && (!score || score > 2)) {
          return false;
        }
        if (filters.sustainability === "unrated" && score) {
          return false;
        }
      }

      // Certification filter
      if (filters.certification !== "all") {
        const hasCerts = fabric.certifications && fabric.certifications.length > 0;
        if (filters.certification === "certified" && !hasCerts) {
          return false;
        }
        if (filters.certification === "uncertified" && hasCerts) {
          return false;
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
        case "performance":
          aValue = a.properties ? Object.keys(a.properties).length : 0;
          bValue = b.properties ? Object.keys(b.properties).length : 0;
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
  }, [fabrics, searchTerm, filters, sortBy, sortDirection, parseNumericValue]);

  // Analytics calculations
  useMemo(() => {
    const totalFabrics = fabrics.length;
    const activeFabrics = fabrics.filter((f) => f.isActive).length;
    const sustainableFabrics = fabrics.filter((f) => {
      const score = parseNumericValue(f.sustainabilityScore || "");
      return score && score >= 4;
    }).length;
    const certifiedFabrics = fabrics.filter(
      (f) => f.certifications && f.certifications.length > 0,
    ).length;

    const weightDistribution = {
      light: fabrics.filter((f) => {
        const weight = parseNumericValue(f.weight || "");
        return weight && weight < 150;
      }).length,
      medium: fabrics.filter((f) => {
        const weight = parseNumericValue(f.weight || "");
        return weight && weight >= 150 && weight <= 300;
      }).length,
      heavy: fabrics.filter((f) => {
        const weight = parseNumericValue(f.weight || "");
        return weight && weight > 300;
      }).length,
    };

    const avgSustainabilityScore = (() => {
      const validScores = fabrics
        .map((f) => parseNumericValue(f.sustainabilityScore || ""))
        .filter((s) => s !== null) as number[];
      return validScores.length > 0
        ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
        : 0;
    })();

    const topProperties = fabrics
      .filter((f) => f.properties)
      .flatMap((f) => Object.keys(f.properties || {}))
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic property accumulator
      .reduce(
        (acc: Record<string, number>, prop) => {
          acc[prop] = (acc[prop] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      totalFabrics,
      activeFabrics,
      sustainableFabrics,
      certifiedFabrics,
      weightDistribution,
      avgSustainabilityScore,
      topProperties: Object.entries(topProperties)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5),
    };
  }, [fabrics, parseNumericValue]);

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
      const response = await apiRequest(`/api/fabrics/${id}`, {
        method: "DELETE",
      });
      if (response === null || response === undefined) {
        return { success: true };
      }
      return response;
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

  // State for selected visual swatch asset
  const [selectedSwatchAsset, setSelectedSwatchAsset] = useState<MediaAsset | null>(null);

  // Media picker handlers
  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const selectedAsset = Array.isArray(assets) ? assets[0] : assets;
    if (!selectedAsset) {
      return;
    }

    if (selectedAsset?.id) {
      setFormData((prev) => ({
        ...prev,
        visualSwatchId: selectedAsset.id,
      }));
      setSelectedSwatchAsset(selectedAsset);

      toast({
        title: "Visual Swatch Selected",
        description: `Selected: ${selectedAsset.filename || selectedAsset.originalName || "Media asset"}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Selection Error",
        description: "Invalid media asset selected. Please try selecting again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to fetch media asset by ID
  const fetchMediaAssetById = async (id: number): Promise<MediaAsset | null> => {
    try {
      // Fetch all media assets to find the one with the matching ID
      const response = await fetch(`/api/media?page=1&limit=100`);
      const data = await response.json();
      const allAssets = data.data || [];
      return allAssets.find((asset: MediaAsset) => asset.id === id) || null;
    } catch (_error) {
      return null;
    }
  };

  const handleEdit = async (fabric: Fabric) => {
    setEditingFabric(fabric);

    // Convert fabric data to form format
    // Read from properties object where technical specifications are stored
    const props = fabric.properties || {};

    const convertedData: EnhancedFormData = {
      // PRODUCT ESSENCE - Basic Information
      name: fabric.name || "",
      description: fabric.description || "",
      weight: fabric.weight?.toString() || "",
      isActive: fabric.isActive ?? true,

      // PRODUCT ESSENCE - B2B Filtering Fields
      sport: fabric.sport || "",
      marketSegment: fabric.marketSegment || "",
      seasonality: fabric.seasonality || "",

      // PRODUCT ESSENCE - Fiber Compositions (read from properties)
      compositions: props.compositions || [
        {
          name: "Standard",
          isDefault: true,
          fibers: [],
        },
      ],

      // PRODUCT ESSENCE - Classification
      fabricType: fabric.fabricType || "",
      weave: fabric.weave || "",
      finish: props.finish || fabric.finishTreatment || "",
      keyApplications: fabric.keyApplications || [],
      weaveTypes: fabric.weaveTypes || [],
      finishTreatments: props.finishTreatments || [],

      // PERFORMANCE & DURABILITY - Performance Metrics
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

      // PERFORMANCE & DURABILITY - Durability & Quality
      yarnCountConstruction: props.yarnCountConstruction || "",
      colorfastness: props.colorfastness || "",
      tensileStrength: props.tensileStrength || "",
      tearStrength: props.tearStrength || "",
      abrasionResistance: props.abrasionResistance?.toString() || "",
      pillingGrade: props.pillingGrade?.toString() || "",
      shrinkageTolerancePercentage: props.shrinkageTolerancePercentage?.toString() || "",
      washTemperature: props.washTemperature || "",

      // SUSTAINABILITY
      sustainabilityScore: fabric.sustainabilityScore?.toString() || "",
      certificationIds: props.certificationIds || [],
      certificationTags: props.certificationTags || [],
      endOfLifeOptions: props.endOfLifeOptions || [],
      recyclabilityNotes: props.recyclabilityNotes || "",
      useCases: props.useCases || [],

      // CARE & MAINTENANCE
      washCareInstructions: props.washCareInstructions || {
        careSymbols: [],
        instructions: fabric.careInstructions || "",
        restrictions: [],
      },
      visualSwatchId: fabric.visualSwatchId || null,
    };

    setFormData(convertedData);

    // Load the selected media asset if it exists
    if (fabric.visualSwatchId) {
      const mediaAsset = await fetchMediaAssetById(fabric.visualSwatchId);
      if (mediaAsset) {
        setSelectedSwatchAsset(mediaAsset);
      }
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

    // Validate compositions - ensure all fibers have valid fiberIds
    for (let i = 0; i < formData.compositions.length; i++) {
      const composition = formData.compositions[i];
      if (!composition) {
        continue;
      }

      for (let j = 0; j < composition.fibers.length; j++) {
        const fiber = composition.fibers[j];
        if (!fiber) {
          continue;
        }

        if (!fiber.fiberId) {
          toast({
            title: "Validation Error",
            description: `Please select a fiber from the dropdown for composition "${composition.name}" instead of typing it manually`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Helper function to convert empty strings to undefined for optional fields
    const cleanEmptyStrings = (value: unknown) => {
      if (value === "" || value === null) {
        return undefined;
      }
      return value;
    };

    // Convert form data to API format (clean empty strings for enums and optional fields)
    const apiData = {
      // PRODUCT ESSENCE - Basic Information
      name: formData.name,
      description: cleanEmptyStrings(formData.description),
      weight: cleanEmptyStrings(formData.weight),
      isActive: formData.isActive,

      // PRODUCT ESSENCE - B2B Filtering Fields
      sport: cleanEmptyStrings(formData.sport),
      marketSegment: cleanEmptyStrings(formData.marketSegment),
      seasonality: cleanEmptyStrings(formData.seasonality),

      // PRODUCT ESSENCE - Fiber Composition
      compositions: formData.compositions,

      // PRODUCT ESSENCE - Classification
      fabricType: cleanEmptyStrings(formData.fabricType),
      weave: cleanEmptyStrings(formData.weave),
      finish: cleanEmptyStrings(formData.finish),
      keyApplications:
        formData.keyApplications?.filter((item) => item !== "").length > 0
          ? formData.keyApplications?.filter((item) => item !== "")
          : undefined,
      weaveTypes:
        formData.weaveTypes?.filter((item) => item !== "").length > 0
          ? formData.weaveTypes?.filter((item) => item !== "")
          : undefined,
      finishTreatments:
        formData.finishTreatments?.filter((item) => item !== "").length > 0
          ? formData.finishTreatments?.filter((item) => item !== "")
          : undefined,

      // PERFORMANCE & DURABILITY - Performance Metrics
      stretchPercentage: cleanEmptyStrings(formData.stretchPercentage),
      stretchDirection:
        formData.stretchDirection?.filter((item) => item !== "").length > 0
          ? formData.stretchDirection?.filter((item) => item !== "")
          : undefined,
      breathability: cleanEmptyStrings(formData.breathability),
      moistureManagement: cleanEmptyStrings(formData.moistureManagement),
      enhancedMoistureManagement: cleanEmptyStrings(formData.enhancedMoistureManagement),
      wickingRate: cleanEmptyStrings(formData.wickingRate),
      dryingTime: cleanEmptyStrings(formData.dryingTime),
      performanceFeatures:
        formData.performanceFeatures?.filter((item) => item !== "").length > 0
          ? formData.performanceFeatures?.filter((item) => item !== "")
          : undefined,
      airPermeability: cleanEmptyStrings(formData.airPermeability),
      waterColumn: cleanEmptyStrings(formData.waterColumn),

      // PERFORMANCE & DURABILITY - Durability & Quality
      yarnCountConstruction: cleanEmptyStrings(formData.yarnCountConstruction),
      colorfastness: cleanEmptyStrings(formData.colorfastness),
      tensileStrength: cleanEmptyStrings(formData.tensileStrength),
      tearStrength: cleanEmptyStrings(formData.tearStrength),
      abrasionResistance: cleanEmptyStrings(formData.abrasionResistance),
      pillingGrade: cleanEmptyStrings(formData.pillingGrade),
      shrinkageTolerancePercentage: cleanEmptyStrings(formData.shrinkageTolerancePercentage),
      washTemperature: cleanEmptyStrings(formData.washTemperature),

      // SUSTAINABILITY
      sustainabilityScore: cleanEmptyStrings(formData.sustainabilityScore),
      certificationIds:
        formData.certificationIds?.filter((id) => id !== null && id !== undefined).length > 0
          ? formData.certificationIds?.filter((id) => id !== null && id !== undefined)
          : undefined,
      certificationTags:
        formData.certificationTags?.filter((id) => id !== null && id !== undefined).length > 0
          ? formData.certificationTags?.filter((id) => id !== null && id !== undefined)
          : undefined,
      endOfLifeOptions:
        formData.endOfLifeOptions?.filter((item) => item !== "").length > 0
          ? formData.endOfLifeOptions?.filter((item) => item !== "")
          : undefined,
      recyclabilityNotes: cleanEmptyStrings(formData.recyclabilityNotes),
      useCases:
        formData.useCases?.filter((item) => item !== "").length > 0
          ? formData.useCases?.filter((item) => item !== "")
          : undefined,

      // CARE & MAINTENANCE
      washCareInstructions:
        formData.washCareInstructions &&
        (formData.washCareInstructions.careSymbols?.length > 0 ||
          formData.washCareInstructions.instructions ||
          formData.washCareInstructions.restrictions?.length > 0)
          ? {
              careSymbols:
                formData.washCareInstructions.careSymbols?.filter((item) => item !== "") || [],
              instructions: cleanEmptyStrings(formData.washCareInstructions.instructions),
              restrictions:
                formData.washCareInstructions.restrictions?.filter((item) => item !== "") || [],
            }
          : undefined,
      visualSwatchId:
        formData.visualSwatchId && typeof formData.visualSwatchId === "number"
          ? formData.visualSwatchId
          : formData.visualSwatchId && typeof formData.visualSwatchId === "string"
            ? parseInt(formData.visualSwatchId, 10)
            : undefined,
    };

    if (editingFabric) {
      updateMutation.mutate({ id: editingFabric.id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  return (
    <div className="mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Fabric Management</h1>
          <p className="text-muted-foreground">
            Comprehensive fabric management with structured properties and enterprise features
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-muted-foreground text-sm">Total Fabrics</p>
                <p className="text-2xl font-bold">{fabrics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-muted-foreground text-sm">Active Fabrics</p>
                <p className="text-2xl font-bold">{fabrics.filter((f) => f.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-muted-foreground text-sm">Certified</p>
                <p className="text-2xl font-bold">
                  {fabrics.filter((f) => f.certifications && f.certifications.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-muted-foreground text-sm">Sustainable</p>
                <p className="text-2xl font-bold">
                  {
                    fabrics.filter((f) => {
                      const score = parseNumericValue(f.sustainabilityScore || "");
                      return score && score >= 4;
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  data-testid={getInputTestId("search")}
                  placeholder="Search fabrics by name, type, or properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "detailed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("detailed")}
                >
                  <Table className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Fabric Display */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-muted-foreground">Loading fabrics...</p>
            </div>
          </CardContent>
        </Card>
      ) : fabrics.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="py-12 text-center">
              <Shirt className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-xl font-semibold">No Fabrics Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first fabric with comprehensive properties
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                data-testid={getButtonTestId("create", "first-fabric")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Fabric
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredAndSortedFabrics.map((fabric) => {
            const isExpanded = expandedCards.has(fabric.id);

            return (
              <Card key={fabric.id} className="transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  {/* Always visible summary */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold">{fabric.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={fabric.isActive ? "default" : "secondary"}>
                          {fabric.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {(() => {
                          const score = parseNumericValue(fabric.sustainabilityScore || "");
                          return score && score >= 4;
                        })() && (
                          <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                            <Globe className="mr-1 h-3 w-3" />
                            Sustainable
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Always visible action buttons */}
                      <Button
                        data-testid={`button-edit-fabric-${fabric.id}`}
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(fabric)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        data-testid={`button-delete-fabric-${fabric.id}`}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(fabric)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                      <Button
                        data-testid={`button-details-fabric-${fabric.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCardExpanded(fabric.id)}
                        className="shrink-0"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Basic info always visible */}
                  <p className="text-muted-foreground mb-4">{fabric.description}</p>

                  {/* Expandable detailed view */}
                  <Collapsible open={isExpanded} onOpenChange={() => toggleCardExpanded(fabric.id)}>
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 gap-6 border-t pt-4 lg:grid-cols-3">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <h3 className="text-xl font-semibold">{fabric.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={fabric.isActive ? "default" : "secondary"}>
                                  {fabric.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {(() => {
                                  const score = parseNumericValue(fabric.sustainabilityScore || "");
                                  return score && score >= 4;
                                })() && (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-600 text-emerald-600"
                                  >
                                    <Globe className="mr-1 h-3 w-3" />
                                    Sustainable
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-muted-foreground">{fabric.description}</p>
                          </div>

                          {/* Classification */}
                          {fabric.fabricType && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Classification</h4>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{fabric.fabricType}</Badge>
                                {fabric.properties?.keyApplications?.map(
                                  (app: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {app}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {/* Certifications */}
                          {fabric.certifications && fabric.certifications.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Certifications</h4>
                              <div className="flex flex-wrap gap-2">
                                {fabric.certifications?.map((certName: string, idx: number) => {
                                  const cert = certificates.find((c) => c.name === certName);
                                  return cert ? (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="border-blue-600 text-blue-600"
                                    >
                                      <Award className="mr-1 h-3 w-3" />
                                      {cert.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Performance & Technical */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Performance & Technical</h4>

                          {/* Weight & Construction */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {fabric.weight && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Weight:</span>
                                <Badge
                                  variant={(() => {
                                    const weight = parseNumericValue(fabric.weight);
                                    if (!weight) {
                                      return "default";
                                    }
                                    return weight < 150
                                      ? "secondary"
                                      : weight < 300
                                        ? "default"
                                        : "destructive";
                                  })()}
                                >
                                  <Zap className="mr-1 h-3 w-3" />
                                  {fabric.weight} GSM
                                </Badge>
                              </div>
                            )}
                            {fabric.properties?.yarnCountConstruction && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Construction:</span>
                                <span className="text-xs font-medium">
                                  {fabric.properties?.yarnCountConstruction}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Performance Features */}
                          {fabric.properties?.performanceFeatures &&
                            fabric.properties.performanceFeatures.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-muted-foreground text-sm">
                                  Performance Features:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {fabric.properties.performanceFeatures.map(
                                    (feature: string, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="border-green-600 text-xs text-green-600"
                                      >
                                        <Activity className="mr-1 h-3 w-3" />
                                        {feature}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Technical Metrics */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {fabric.properties?.stretchPercentage && (
                              <div className="rounded bg-blue-50 p-2">
                                <div className="text-muted-foreground">Stretch</div>
                                <div className="font-semibold">
                                  {fabric.properties.stretchPercentage}%
                                </div>
                              </div>
                            )}
                            {fabric.properties?.airPermeability && (
                              <div className="rounded bg-green-50 p-2">
                                <div className="text-muted-foreground">Air Perm.</div>
                                <div className="font-semibold">
                                  {fabric.properties.airPermeability} mm/s
                                </div>
                              </div>
                            )}
                            {fabric.properties?.waterColumn && (
                              <div className="rounded bg-purple-50 p-2">
                                <div className="text-muted-foreground">Waterproof</div>
                                <div className="font-semibold">
                                  {fabric.properties.waterColumn} mm
                                </div>
                              </div>
                            )}
                            {fabric.sustainabilityScore && (
                              <div className="rounded bg-emerald-50 p-2">
                                <div className="text-muted-foreground">Sustainability</div>
                                <div className="font-semibold">
                                  {"★".repeat(parseNumericValue(fabric.sustainabilityScore) || 0)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                          <div className="space-y-2 border-t pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(fabric)}
                              className="w-full justify-start"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Fabric
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(fabric)}
                              className="text-destructive hover:text-destructive w-full justify-start"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal with Structured Sections */}
      <Dialog
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingFabric(null);
            resetForm();
          }
        }}
      >
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>{editingFabric ? "Edit Fabric" : "Create New Fabric"}</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Fabric Name *</Label>
                      <Input
                        id="name"
                        data-testid={getInputTestId("name")}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter fabric name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (GSM)</Label>
                      <div className="space-y-2">
                        <Input
                          id="weight"
                          data-testid={getInputTestId("weight")}
                          type="text"
                          value={formData.weight || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              weight: e.target.value,
                            }))
                          }
                          placeholder="e.g., 200 or 180-220"
                        />
                        <div className="text-muted-foreground text-xs">
                          Enter single value (e.g., 200) or range (e.g., 180-220)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* B2B Filtering Fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sport">Sport / Activity</Label>
                      <Input
                        id="sport"
                        data-testid={getInputTestId("sport")}
                        value={formData.sport}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sport: e.target.value,
                          }))
                        }
                        placeholder="e.g., Running, Cycling"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marketSegment">Market Segment</Label>
                      <Input
                        id="marketSegment"
                        data-testid={getInputTestId("market-segment")}
                        value={formData.marketSegment}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            marketSegment: e.target.value,
                          }))
                        }
                        placeholder="e.g., Premium, Performance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seasonality">Seasonality</Label>
                      <Input
                        id="seasonality"
                        data-testid={getInputTestId("seasonality")}
                        value={formData.seasonality}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            seasonality: e.target.value,
                          }))
                        }
                        placeholder="e.g., All-Season, Summer"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid={getInputTestId("description")}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter fabric description"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      data-testid="checkbox-fabric-active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Fiber Composition Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Fiber Composition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.compositions.map((composition, compositionIndex) => (
                    <div
                      key={compositionIndex}
                      className={`rounded-lg border p-4 ${composition.isDefault ? "border-blue-200 bg-blue-50" : "bg-background"}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Input
                            data-testid={getRepeatedTestId(
                              "input",
                              "composition-name",
                              compositionIndex,
                            )}
                            value={composition.name}
                            onChange={(e) => {
                              const newCompositions = [...formData.compositions];
                              if (newCompositions[compositionIndex]) {
                                newCompositions[compositionIndex].name = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  compositions: newCompositions,
                                }));
                              }
                            }}
                            placeholder="Composition name"
                            className="w-40"
                          />
                          {composition.isDefault && (
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            data-testid={getRepeatedTestId(
                              "checkbox",
                              "composition-default",
                              compositionIndex,
                            )}
                            checked={composition.isDefault}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newCompositions = formData.compositions.map((comp, idx) => ({
                                  ...comp,
                                  isDefault: idx === compositionIndex,
                                }));
                                setFormData((prev) => ({
                                  ...prev,
                                  compositions: newCompositions,
                                }));
                              }
                            }}
                          />
                          <Label className="text-sm">Default</Label>
                          {formData.compositions.length > 1 && (
                            <Button
                              data-testid={getRepeatedTestId(
                                "button",
                                "remove-composition",
                                compositionIndex,
                              )}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newCompositions = formData.compositions.filter(
                                  (_, idx) => idx !== compositionIndex,
                                );
                                // Ensure there's still a default
                                if (
                                  composition.isDefault &&
                                  newCompositions.length > 0 &&
                                  newCompositions[0]
                                ) {
                                  newCompositions[0].isDefault = true;
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  compositions: newCompositions,
                                }));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Fiber Selection */}
                      <div className="space-y-2">
                        {composition.fibers.map((fiber, fiberIndex) => {
                          return (
                            <div key={fiberIndex} className="flex items-center gap-2">
                              <div className="relative">
                                <Select
                                  value={fiber.fiberId ? fiber.fiberId.toString() : ""}
                                  onValueChange={(value) => {
                                    const newCompositions = [...formData.compositions];
                                    if (newCompositions[compositionIndex]?.fibers[fiberIndex]) {
                                      newCompositions[compositionIndex].fibers[fiberIndex].fiberId =
                                        value ? parseInt(value, 10) : null;
                                      setFormData((prev) => ({
                                        ...prev,
                                        compositions: newCompositions,
                                      }));
                                    }
                                  }}
                                >
                                  <SelectTrigger
                                    data-testid={getRepeatedTestId(
                                      "select",
                                      `fiber-${compositionIndex}`,
                                      fiberIndex,
                                    )}
                                    className="h-12 flex-1 px-4 text-sm"
                                    onClick={() => {}}
                                  >
                                    <SelectValue placeholder="Select fiber" />
                                  </SelectTrigger>
                                  <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                                    {fibers && fibers.length > 0 ? (
                                      fibers.map((fiber) => (
                                        <SelectItem
                                          key={fiber.id}
                                          value={fiber.id.toString()}
                                          className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                        >
                                          {fiber.name}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem
                                        value="no-fibers"
                                        disabled
                                        className="text-muted-foreground/70 h-12 px-4 text-sm"
                                      >
                                        No fibers available
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Input
                                data-testid={getRepeatedTestId(
                                  "input",
                                  `fiber-percentage-${compositionIndex}`,
                                  fiberIndex,
                                )}
                                type="text"
                                value={fiber.percentage}
                                onChange={(e) => {
                                  const newCompositions = [...formData.compositions];
                                  if (newCompositions[compositionIndex]?.fibers[fiberIndex]) {
                                    newCompositions[compositionIndex].fibers[
                                      fiberIndex
                                    ].percentage = e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      compositions: newCompositions,
                                    }));
                                  }
                                }}
                                placeholder="e.g., 60 or 60-70 or Majority blend"
                                className="w-32"
                              />
                              <span className="text-muted-foreground text-sm">%</span>
                              <Button
                                data-testid={getRepeatedTestId(
                                  "button",
                                  `remove-fiber-${compositionIndex}`,
                                  fiberIndex,
                                )}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newCompositions = [...formData.compositions];
                                  if (newCompositions[compositionIndex]?.fibers) {
                                    newCompositions[compositionIndex].fibers = newCompositions[
                                      compositionIndex
                                    ].fibers.filter((_, idx) => idx !== fiberIndex);
                                    setFormData((prev) => ({
                                      ...prev,
                                      compositions: newCompositions,
                                    }));
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}

                        {/* Add Fiber Button */}
                        <Button
                          data-testid={getRepeatedTestId("button", "add-fiber", compositionIndex)}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCompositions = [...formData.compositions];
                            if (newCompositions[compositionIndex]?.fibers) {
                              newCompositions[compositionIndex].fibers.push({
                                fiberId: null,
                                percentage: "",
                              });
                              setFormData((prev) => ({
                                ...prev,
                                compositions: newCompositions,
                              }));
                            }
                          }}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Fiber
                        </Button>

                        {/* Total Percentage */}
                        <div className="flex justify-end">
                          <span className="text-sm font-medium">
                            Total: {(() => {
                              const total = composition.fibers.reduce((sum, fiber) => {
                                const percentage = parseFloat(fiber.percentage);
                                return Number.isNaN(percentage) ? sum : sum + percentage;
                              }, 0);
                              const hasNonNumeric = composition.fibers.some((fiber) =>
                                Number.isNaN(parseFloat(fiber.percentage)),
                              );
                              return hasNonNumeric ? "Mixed" : `${total}%`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Composition Button */}
                  <Button
                    data-testid={getButtonTestId("add", "composition")}
                    variant="outline"
                    onClick={() => {
                      const newComposition = {
                        name: `Composition ${formData.compositions.length + 1}`,
                        isDefault: false,
                        fibers: [],
                      };
                      setFormData((prev) => ({
                        ...prev,
                        compositions: [...prev.compositions, newComposition],
                      }));
                    }}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Alternative Composition
                  </Button>
                </CardContent>
              </Card>

              {/* 1. Fabric Classification Section */}
              <Collapsible
                open={sectionsOpen.classification}
                onOpenChange={() => toggleSectionOpen("classification")}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-muted/50 cursor-pointer">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shirt className="h-5 w-5 text-blue-500" />
                          Fabric Classification
                        </div>
                        {sectionsOpen.classification ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="fabricType">Fabric Type</Label>
                        <div className="space-y-2">
                          <Select
                            value={formData.fabricType}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                fabricType: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-12 px-4 text-sm">
                              <SelectValue placeholder="Select fabric type" />
                            </SelectTrigger>
                            <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                              <SelectItem
                                value="Knit"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Knit
                              </SelectItem>
                              <SelectItem
                                value="Woven"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Woven
                              </SelectItem>
                              <SelectItem
                                value="Non-woven"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Non-woven
                              </SelectItem>
                              <SelectItem
                                value="Composite"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Composite
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-muted-foreground mb-1 text-xs">
                            Or enter custom fabric type:
                          </div>
                          <Input
                            placeholder="Enter custom fabric type"
                            value={formData.fabricType}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                fabricType: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Key Applications</Label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {formData.keyApplications.map((app, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {app}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      keyApplications: prev.keyApplications.filter(
                                        (_, i) => i !== index,
                                      ),
                                    }));
                                  }}
                                />
                              </Badge>
                            ))}
                          </div>
                          <Select
                            onValueChange={(value) => {
                              if (!formData.keyApplications.includes(value)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  keyApplications: [...prev.keyApplications, value],
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-12 px-4 text-sm">
                              <SelectValue placeholder="Add key applications" />
                            </SelectTrigger>
                            <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                              <SelectItem
                                value="Activewear"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Activewear
                              </SelectItem>
                              <SelectItem
                                value="Outerwear"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Outerwear
                              </SelectItem>
                              <SelectItem
                                value="Base Layer"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Base Layer
                              </SelectItem>
                              <SelectItem
                                value="Swimwear"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Swimwear
                              </SelectItem>
                              <SelectItem
                                value="Athleisure"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Athleisure
                              </SelectItem>
                              <SelectItem
                                value="Performance"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Performance
                              </SelectItem>
                              <SelectItem
                                value="Casual"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Casual
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-muted-foreground text-xs">
                            Or enter custom application:
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter custom application"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const value = e.currentTarget.value.trim();
                                  if (value && !formData.keyApplications.includes(value)) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      keyApplications: [...prev.keyApplications, value],
                                    }));
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                const value = input.value.trim();
                                if (value && !formData.keyApplications.includes(value)) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    keyApplications: [...prev.keyApplications, value],
                                  }));
                                  input.value = "";
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* 2. Performance Metrics Section */}
              <Collapsible
                open={sectionsOpen.performance}
                onOpenChange={() => toggleSectionOpen("performance")}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-muted/50 cursor-pointer">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-green-500" />
                          Performance Metrics
                        </div>
                        {sectionsOpen.performance ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="stretchPercentage">Stretch Percentage (%)</Label>
                          <div className="space-y-2">
                            <Input
                              id="stretchPercentage"
                              data-testid={getInputTestId("stretch-percentage")}
                              type="text"
                              value={formData.stretchPercentage}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  stretchPercentage: e.target.value,
                                }))
                              }
                              placeholder="e.g., 150 or 140-160"
                            />
                            <div className="text-muted-foreground text-xs">
                              Enter single value (e.g., 150) or range (e.g., 140-160)
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="airPermeability">Air Permeability (mm/s)</Label>
                          <div className="space-y-2">
                            <Input
                              id="airPermeability"
                              data-testid={getInputTestId("air-permeability")}
                              type="text"
                              value={formData.airPermeability}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  airPermeability: e.target.value,
                                }))
                              }
                              placeholder="e.g., 50 or 45-55"
                            />
                            <div className="text-muted-foreground text-xs">
                              Enter single value (e.g., 50) or range (e.g., 45-55)
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="waterColumn">Water Column (mm)</Label>
                        <div className="space-y-2">
                          <Input
                            id="waterColumn"
                            data-testid={getInputTestId("water-column")}
                            type="text"
                            value={formData.waterColumn}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                waterColumn: e.target.value,
                              }))
                            }
                            placeholder="e.g., 10000 or 9500-10500"
                          />
                          <div className="text-muted-foreground text-xs">
                            Enter single value (e.g., 10000) or range (e.g., 9500-10500)
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Moisture Management */}
                      <div className="space-y-3">
                        <Label>Enhanced Moisture Management</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="moistureRating">Enhanced Moisture Management</Label>
                            <div className="space-y-2">
                              <Select
                                value={formData.enhancedMoistureManagement}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    enhancedMoistureManagement: value,
                                  }))
                                }
                              >
                                <SelectTrigger
                                  className="h-12 px-4 text-sm"
                                  data-testid={getSelectTestId("moisture-management")}
                                >
                                  <SelectValue placeholder="Select rating" />
                                </SelectTrigger>
                                <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                                  <SelectItem
                                    value="Poor"
                                    className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                  >
                                    Poor
                                  </SelectItem>
                                  <SelectItem
                                    value="Fair"
                                    className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                  >
                                    Fair
                                  </SelectItem>
                                  <SelectItem
                                    value="Good"
                                    className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                  >
                                    Good
                                  </SelectItem>
                                  <SelectItem
                                    value="Excellent"
                                    className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                  >
                                    Excellent
                                  </SelectItem>
                                  <SelectItem
                                    value="Outstanding"
                                    className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                  >
                                    Outstanding
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                data-testid={getInputTestId("moisture-management-custom")}
                                placeholder="Custom rating or range (e.g. 'Good-Excellent')"
                                value={formData.enhancedMoistureManagement}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    enhancedMoistureManagement: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="wickingRate">Wicking Rate (mm/hr)</Label>
                            <div className="space-y-2">
                              <Input
                                id="wickingRate"
                                data-testid={getInputTestId("wicking-rate")}
                                type="text"
                                value={formData.wickingRate}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    wickingRate: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 25 or 20-30"
                              />
                              <div className="text-muted-foreground text-xs">
                                Enter single value (e.g., 25) or range (e.g., 20-30)
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="dryingTime">Drying Time (min)</Label>
                            <div className="space-y-2">
                              <Input
                                id="dryingTime"
                                data-testid={getInputTestId("drying-time")}
                                type="text"
                                value={formData.dryingTime}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    dryingTime: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 60 or 55-65"
                              />
                              <div className="text-muted-foreground text-xs">
                                Enter single value (e.g., 60) or range (e.g., 55-65)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Features */}
                      <div>
                        <Label>Performance Features</Label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {formData.performanceFeatures.map((feature, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {feature}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      performanceFeatures: prev.performanceFeatures.filter(
                                        (_, i) => i !== index,
                                      ),
                                    }));
                                  }}
                                />
                              </Badge>
                            ))}
                          </div>
                          <Select
                            onValueChange={(value) => {
                              if (!formData.performanceFeatures.includes(value)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  performanceFeatures: [...prev.performanceFeatures, value],
                                }));
                              }
                            }}
                          >
                            <SelectTrigger
                              className="h-12 px-4 text-sm"
                              data-testid={getSelectTestId("performance-features")}
                            >
                              <SelectValue placeholder="Add performance features" />
                            </SelectTrigger>
                            <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                              <SelectItem
                                value="Antimicrobial"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Antimicrobial
                              </SelectItem>
                              <SelectItem
                                value="UV Protection"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                UV Protection
                              </SelectItem>
                              <SelectItem
                                value="Quick-dry"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Quick-dry
                              </SelectItem>
                              <SelectItem
                                value="Moisture Wicking"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Moisture Wicking
                              </SelectItem>
                              <SelectItem
                                value="Breathable"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Breathable
                              </SelectItem>
                              <SelectItem
                                value="Temperature Regulation"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Temperature Regulation
                              </SelectItem>
                              <SelectItem
                                value="Odor Control"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Odor Control
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-muted-foreground text-xs">
                            Or enter custom performance feature:
                          </div>
                          <div className="flex gap-2">
                            <Input
                              data-testid={getInputTestId("performance-feature-custom")}
                              placeholder="Enter custom performance feature"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const value = e.currentTarget.value.trim();
                                  if (value && !formData.performanceFeatures.includes(value)) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      performanceFeatures: [...prev.performanceFeatures, value],
                                    }));
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                const value = input.value.trim();
                                if (value && !formData.performanceFeatures.includes(value)) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    performanceFeatures: [...prev.performanceFeatures, value],
                                  }));
                                  input.value = "";
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* 3. Durability & Quality Section */}
              <Collapsible
                open={sectionsOpen.durability}
                onOpenChange={() => toggleSectionOpen("durability")}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-muted/50 cursor-pointer">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-orange-500" />
                          Durability & Quality
                        </div>
                        {sectionsOpen.durability ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="yarnCountConstruction">Yarn Count / Construction</Label>
                        <Input
                          id="yarnCountConstruction"
                          value={formData.yarnCountConstruction}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              yarnCountConstruction: e.target.value,
                            }))
                          }
                          placeholder="e.g., 150D x 150D / Plain weave"
                        />
                      </div>

                      {/* NEW: Key Durability Metrics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="colorfastness">Colorfastness</Label>
                          <Input
                            id="colorfastness"
                            value={formData.colorfastness}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                colorfastness: e.target.value,
                              }))
                            }
                            placeholder="e.g., Grade 4-5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tensileStrength">Tensile Strength</Label>
                          <Input
                            id="tensileStrength"
                            value={formData.tensileStrength}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                tensileStrength: e.target.value,
                              }))
                            }
                            placeholder="e.g., 200N or 180-220N"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tearStrength">Tear Strength</Label>
                          <Input
                            id="tearStrength"
                            value={formData.tearStrength}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                tearStrength: e.target.value,
                              }))
                            }
                            placeholder="e.g., 50N or 45-55N"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="abrasionResistance">
                            Abrasion Resistance (Grade 1-5)
                          </Label>
                          <div className="space-y-2">
                            <Select
                              value={formData.abrasionResistance}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  abrasionResistance: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Poor</SelectItem>
                                <SelectItem value="2">2 - Fair</SelectItem>
                                <SelectItem value="3">3 - Good</SelectItem>
                                <SelectItem value="4">4 - Very Good</SelectItem>
                                <SelectItem value="5">5 - Excellent</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Custom grade"
                              value={formData.abrasionResistance}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  abrasionResistance: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="pillingGrade">Pilling Grade (ISO 1-5)</Label>
                          <div className="space-y-2">
                            <Select
                              value={formData.pillingGrade}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  pillingGrade: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Severe Pilling</SelectItem>
                                <SelectItem value="2">2 - Noticeable Pilling</SelectItem>
                                <SelectItem value="3">3 - Moderate Pilling</SelectItem>
                                <SelectItem value="4">4 - Slight Pilling</SelectItem>
                                <SelectItem value="5">5 - No Pilling</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Custom grade"
                              value={formData.pillingGrade}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  pillingGrade: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shrinkage Tolerance */}
                      <div className="space-y-3">
                        <Label>Shrinkage Tolerance</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="shrinkagePercentage">Percentage (%)</Label>
                            <div className="space-y-2">
                              <Input
                                id="shrinkagePercentage"
                                type="text"
                                value={formData.shrinkageTolerancePercentage}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    shrinkageTolerancePercentage: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 3 or 2-4"
                              />
                              <div className="text-muted-foreground text-xs">
                                Enter single value (e.g., 3) or range (e.g., 2-4)
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="washTemperature">Wash Temperature (°C)</Label>
                            <div className="space-y-2">
                              <Input
                                id="washTemperature"
                                type="text"
                                value={formData.washTemperature}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    washTemperature: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 40 or 30-50"
                              />
                              <div className="text-muted-foreground text-xs">
                                Enter single value (e.g., 40) or range (e.g., 30-50)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* 4. Sustainability & Lifecycle Section */}
              <Collapsible
                open={sectionsOpen.sustainability}
                onOpenChange={() => toggleSectionOpen("sustainability")}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-muted/50 cursor-pointer">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-emerald-500" />
                          Sustainability & Lifecycle
                        </div>
                        {sectionsOpen.sustainability ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="sustainabilityScore">
                          Sustainability Score (1-5 stars)
                        </Label>
                        <div className="space-y-2">
                          <Select
                            value={formData.sustainabilityScore}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                sustainabilityScore: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-12 px-4 text-sm">
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                              <SelectItem
                                value="1"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                ⭐ 1 - Low Impact
                              </SelectItem>
                              <SelectItem
                                value="2"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                ⭐⭐ 2 - Fair Impact
                              </SelectItem>
                              <SelectItem
                                value="3"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                ⭐⭐⭐ 3 - Good Impact
                              </SelectItem>
                              <SelectItem
                                value="4"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                ⭐⭐⭐⭐ 4 - Very Good Impact
                              </SelectItem>
                              <SelectItem
                                value="5"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                ⭐⭐⭐⭐⭐ 5 - Excellent Impact
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Custom sustainability score"
                            value={formData.sustainabilityScore}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                sustainabilityScore: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      {/* Certification Tags */}
                      <div>
                        <Label>Certification Tags</Label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {formData.certificationTags.map((certId, index) => {
                              const cert = certificates.find((c) => c.id === certId);
                              return cert ? (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  <Award className="h-3 w-3" />
                                  {cert.name}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        certificationTags: prev.certificationTags.filter(
                                          (_, i) => i !== index,
                                        ),
                                      }));
                                    }}
                                  />
                                </Badge>
                              ) : null;
                            })}
                          </div>
                          <Select
                            onValueChange={(value) => {
                              const certId = parseInt(value, 10);
                              if (!formData.certificationTags.includes(certId)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  certificationTags: [...prev.certificationTags, certId],
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-12 px-4 text-sm">
                              <SelectValue placeholder="Add certifications" />
                            </SelectTrigger>
                            <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                              {certificates
                                .filter((cert) => !formData.certificationTags.includes(cert.id))
                                .map((cert) => (
                                  <SelectItem
                                    key={cert.id}
                                    value={cert.id.toString()}
                                    className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                  >
                                    {cert.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* End of Life Options */}
                      <div>
                        <Label>End-of-Life Options</Label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {formData.endOfLifeOptions.map((option, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                <Recycle className="h-3 w-3" />
                                {option}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      endOfLifeOptions: prev.endOfLifeOptions.filter(
                                        (_, i) => i !== index,
                                      ),
                                    }));
                                  }}
                                />
                              </Badge>
                            ))}
                          </div>
                          <Select
                            onValueChange={(value) => {
                              if (!formData.endOfLifeOptions.includes(value)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  endOfLifeOptions: [...prev.endOfLifeOptions, value],
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-12 px-4 text-sm">
                              <SelectValue placeholder="Add end-of-life options" />
                            </SelectTrigger>
                            <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                              <SelectItem
                                value="Recyclable"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Recyclable
                              </SelectItem>
                              <SelectItem
                                value="Biodegradable"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Biodegradable
                              </SelectItem>
                              <SelectItem
                                value="Compostable"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Compostable
                              </SelectItem>
                              <SelectItem
                                value="Reusable"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Reusable
                              </SelectItem>
                              <SelectItem
                                value="Upcyclable"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Upcyclable
                              </SelectItem>
                              <SelectItem
                                value="Energy Recovery"
                                className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                              >
                                Energy Recovery
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-muted-foreground text-xs">
                            Or enter custom end-of-life option:
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter custom end-of-life option"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const value = e.currentTarget.value.trim();
                                  if (value && !formData.endOfLifeOptions.includes(value)) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      endOfLifeOptions: [...prev.endOfLifeOptions, value],
                                    }));
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                const value = input.value.trim();
                                if (value && !formData.endOfLifeOptions.includes(value)) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    endOfLifeOptions: [...prev.endOfLifeOptions, value],
                                  }));
                                  input.value = "";
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* 5. Care & Visual Section */}
              <Collapsible open={sectionsOpen.care} onOpenChange={() => toggleSectionOpen("care")}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-muted/50 cursor-pointer">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Palette className="h-5 w-5 text-purple-500" />
                          Care & Visual
                        </div>
                        {sectionsOpen.care ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Care Instructions */}
                      <div className="space-y-3">
                        <Label>Wash & Care Instructions</Label>

                        {/* Combined Care Instructions */}
                        <div>
                          <Label className="text-sm">Care Instructions & Restrictions</Label>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {formData.washCareInstructions.careSymbols.map(
                                (instruction, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {instruction}
                                    <X
                                      className="h-3 w-3 cursor-pointer"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          washCareInstructions: {
                                            ...prev.washCareInstructions,
                                            careSymbols:
                                              prev.washCareInstructions.careSymbols.filter(
                                                (_, i) => i !== index,
                                              ),
                                          },
                                        }));
                                      }}
                                    />
                                  </Badge>
                                ),
                              )}
                            </div>
                            <Select
                              onValueChange={(value) => {
                                if (!formData.washCareInstructions.careSymbols.includes(value)) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    washCareInstructions: {
                                      ...prev.washCareInstructions,
                                      careSymbols: [
                                        ...prev.washCareInstructions.careSymbols,
                                        value,
                                      ],
                                    },
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="h-12 px-4 text-sm">
                                <SelectValue placeholder="Add care instructions" />
                              </SelectTrigger>
                              <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                                <SelectItem
                                  value="30°C Machine Wash"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  30°C Machine Wash
                                </SelectItem>
                                <SelectItem
                                  value="40°C Machine Wash"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  40°C Machine Wash
                                </SelectItem>
                                <SelectItem
                                  value="Hand Wash Only"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Hand Wash Only
                                </SelectItem>
                                <SelectItem
                                  value="Tumble Dry Low"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Tumble Dry Low
                                </SelectItem>
                                <SelectItem
                                  value="Iron Low Heat"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Iron Low Heat
                                </SelectItem>
                                <SelectItem
                                  value="Dry Clean Only"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Dry Clean Only
                                </SelectItem>
                                <SelectItem
                                  value="Do Not Bleach"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Do Not Bleach
                                </SelectItem>
                                <SelectItem
                                  value="Do Not Tumble Dry"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Do Not Tumble Dry
                                </SelectItem>
                                <SelectItem
                                  value="Do Not Iron"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Do Not Iron
                                </SelectItem>
                                <SelectItem
                                  value="Do Not Dry Clean"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Do Not Dry Clean
                                </SelectItem>
                                <SelectItem
                                  value="No Fabric Softener"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  No Fabric Softener
                                </SelectItem>
                                <SelectItem
                                  value="No Direct Heat"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  No Direct Heat
                                </SelectItem>
                                <SelectItem
                                  value="Wash Separately"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Wash Separately
                                </SelectItem>
                                <SelectItem
                                  value="Inside Out Only"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Inside Out Only
                                </SelectItem>
                                <SelectItem
                                  value="No Soaking"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  No Soaking
                                </SelectItem>
                                <SelectItem
                                  value="Air Dry Only"
                                  className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                                >
                                  Air Dry Only
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="text-muted-foreground text-xs">
                              Or enter custom care instruction:
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter custom care instruction"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const value = e.currentTarget.value.trim();
                                    if (
                                      value &&
                                      !formData.washCareInstructions.careSymbols.includes(value)
                                    ) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        washCareInstructions: {
                                          ...prev.washCareInstructions,
                                          careSymbols: [
                                            ...prev.washCareInstructions.careSymbols,
                                            value,
                                          ],
                                        },
                                      }));
                                      e.currentTarget.value = "";
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  const input = e.currentTarget
                                    .previousElementSibling as HTMLInputElement;
                                  const value = input.value.trim();
                                  if (
                                    value &&
                                    !formData.washCareInstructions.careSymbols.includes(value)
                                  ) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      washCareInstructions: {
                                        ...prev.washCareInstructions,
                                        careSymbols: [
                                          ...prev.washCareInstructions.careSymbols,
                                          value,
                                        ],
                                      },
                                    }));
                                    input.value = "";
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Instructions */}
                        <div>
                          <Label htmlFor="careInstructions">Detailed Instructions</Label>
                          <Textarea
                            id="careInstructions"
                            value={formData.washCareInstructions.instructions}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                washCareInstructions: {
                                  ...prev.washCareInstructions,
                                  instructions: e.target.value,
                                },
                              }))
                            }
                            placeholder="Enter detailed care instructions..."
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Visual Swatch */}
                      <div>
                        <Label htmlFor="visualSwatch">Visual Swatch</Label>
                        <div className="space-y-2">
                          {formData.visualSwatchId && selectedSwatchAsset && (
                            <div className="flex items-center gap-2 rounded border p-2">
                              <img
                                src={selectedSwatchAsset.url || ""}
                                alt="Visual swatch preview"
                                className="h-16 w-16 rounded border object-contain"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">Visual Swatch Selected</div>
                                <div className="text-muted-foreground truncate text-xs">
                                  {selectedSwatchAsset.originalName || selectedSwatchAsset.filename}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    visualSwatchId: null,
                                  }));
                                  setSelectedSwatchAsset(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsMediaPickerOpen(true)}
                              className="flex-1"
                            >
                              <Image className="mr-2 h-4 w-4" />
                              {formData.visualSwatchId
                                ? "Change Visual Swatch"
                                : "Select Visual Swatch"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              data-testid={getButtonTestId("cancel", "fabric-dialog")}
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setEditingFabric(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              data-testid={getButtonTestId("save", "fabric")}
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingFabric
                  ? "Update Fabric"
                  : "Create Fabric"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>Delete Fabric</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-neutral-600">
              Are you sure you want to delete "{fabricToDelete?.name}"? This action cannot be
              undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid={getButtonTestId("cancel", "delete-dialog")}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid={getButtonTestId("confirm", "delete")}
              onClick={() => fabricToDelete && deleteMutation.mutate(fabricToDelete.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Visual Swatch"
        mediaPickerTarget="fabric-management"
        selectionMode="single"
      />
    </div>
  );
}
