import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  MediaAsset,
  SustainabilityGoal,
  SustainabilityInitiative,
  SustainabilityMetric,
  UnifiedSustainability,
} from "@shared/index";
import {
  Droplets,
  Edit,
  GripVertical,
  Leaf,
  Recycle,
  Save,
  Target,
  TreePine,
  TrendingUp,
  Undo2,
  Wind,
} from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminSustainabilityData } from "@/hooks/use-admin-sustainability-data";
import { useAdminSustainabilityMutations } from "@/hooks/use-admin-sustainability-mutations";
import { useToast } from "@/hooks/use-toast";
import { CallToActionTabContent } from "./CallToActionTabContent";
import { CertificationsTabContent } from "./CertificationsTabContent";
import { FabricPortfolioTabContent } from "./FabricPortfolioTabContent";
import { FeaturesTabContent } from "./FeaturesTabContent";
import { GoalsTabContent } from "./GoalsTabContent";
import { HeroTabContent } from "./HeroTabContent";
import { InitiativesTabContent } from "./InitiativesTabContent";
import { SectionHeadersTabContent } from "./SectionHeadersTabContent";
import { MetricsTabContent } from "./sustainability/metrics-tab";

// Sortable item components (Keeping these local as they are used by other tabs still using the old pattern if any, but MetricsTab now handles its own)
// Wait, MetricsTab uses SortableMetricItem which was moved inside it?
// No, the new MetricsTabContent has SortableMetricItem passed as prop?
// The new MetricsTabContent I wrote defined SortableMetricItem internally or expected it as prop?
// Checking my previous write_to_file...
// The new MetricsTabContent I wrote accepts SortableMetricItem as a prop.
// So I should keep the definition here.

const SortableMetricItem = memo(function SortableMetricItem({
  metric,
  onEdit,
  onDelete,
}: {
  metric: SustainabilityMetric;
  onEdit: (metric: SustainabilityMetric) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: metric.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent =
    {
      Leaf,
      Droplets,
      Wind,
      Recycle,
      TreePine,
      Target,
      TrendingUp,
    }[metric.iconName || "Leaf"] || Leaf;

  return (
    <div ref={setNodeRef} style={style} className="admin-sortable-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            {...attributes}
            {...listeners}
            className="text-muted-foreground/70 hover:text-muted-foreground cursor-move"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <IconComponent className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-foreground font-medium">{metric.name}</h4>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span className="font-semibold">
                  {metric.value} {metric.unit}
                </span>
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{metric.category}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(metric)}>
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(metric.id)}
            title="Delete Metric"
            description="Are you sure you want to delete this sustainability metric?"
          />
        </div>
      </div>
    </div>
  );
});

const SortableInitiativeItem = memo(function SortableInitiativeItem({
  initiative,
  onEdit,
  onDelete,
}: {
  initiative: SustainabilityInitiative;
  onEdit: (initiative: SustainabilityInitiative) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: initiative.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent =
    {
      Leaf,
      Droplets,
      Wind,
      Recycle,
      TreePine,
      Target,
      TrendingUp,
    }.Leaf || Leaf;

  return (
    <div ref={setNodeRef} style={style} className="admin-sortable-card">
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="text-muted-foreground/70 hover:text-muted-foreground mt-1 cursor-move"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <IconComponent className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-foreground font-medium">{initiative.title}</h4>
                {initiative.description && (
                  <p className="text-muted-foreground mt-2 text-sm">{initiative.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(initiative)}>
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(initiative.id)}
            title="Delete Initiative"
            description="Are you sure you want to delete this sustainability initiative?"
          />
        </div>
      </div>
    </div>
  );
});

const SortableGoalItem = memo(function SortableGoalItem({
  goal,
  onEdit,
  onDelete,
}: {
  goal: SustainabilityGoal;
  onEdit: (goal: SustainabilityGoal) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progressPercentage =
    goal.targetValue && goal.currentValue
      ? Math.round((Number(goal.currentValue) / Number(goal.targetValue)) * 100)
      : 0;

  return (
    <div ref={setNodeRef} style={style} className="admin-sortable-card">
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="text-muted-foreground/70 hover:text-muted-foreground mt-1 cursor-move"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-foreground font-medium">{goal.title}</h4>
                <div className="mt-2 flex items-center gap-4">
                  <div className="text-muted-foreground text-sm">
                    <span className="font-semibold">{goal.currentValue}</span> /{" "}
                    <span>{goal.targetValue}</span> {goal.unit}
                  </div>
                  <div className="bg-muted rounded-full px-2 py-0.5 text-xs">
                    Target: {goal.targetYear || "TBD"}
                  </div>
                  <div
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      progressPercentage >= 100
                        ? "bg-green-100 text-green-700"
                        : progressPercentage >= 75
                          ? "bg-blue-100 text-blue-700"
                          : progressPercentage >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {progressPercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(goal)}>
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(goal.id)}
            title="Delete Goal"
            description="Are you sure you want to delete this sustainability goal?"
          />
        </div>
      </div>
    </div>
  );
});

export function UnifiedSustainabilityManagement() {
  // No default export needed for UnifiedSustainabilityManagement as it is already a named export.

  const { toast } = useToast();

  // URL Param logic for active tab
  const getTabFromUrl = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("tab") || "hero";
  }, []);

  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Sync state with URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", value);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);
  };

  // Listen to popstate (back/forward) to sync tab
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getTabFromUrl]);

  // Local form state to prevent auto-saving on every keystroke
  const [localForm, setLocalForm] = useState<Partial<UnifiedSustainability>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Note: Individual tab components manage their own dialog/form/editing states internally

  // Initiative validation state
  // Use data and pagination hook
  const {
    isLoading,
    unifiedData,
    metrics,
    initiatives,
    goals,
    availableCertificates,
    paginatedMetrics,
    paginatedInitiatives,
    paginatedGoals,
    metricsTotalPages,
    initiativesTotalPages,
    goalsTotalPages,
    pagination,
  } = useAdminSustainabilityData();

  const {
    metricsPage,
    setMetricsPage,
    initiativesPage,
    setInitiativesPage,
    goalsPage,
    setGoalsPage,
  } = pagination;

  // Note: Validation logic now handled within individual tab components
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Sync server data to local form state
  const resetForm = useCallback(() => {
    if (unifiedData) {
      const mappedData: Partial<UnifiedSustainability> = {
        ...unifiedData,
        data: {
          ...unifiedData.data,
          headline: unifiedData.headline,
          subheadline: unifiedData.subheadline,
          backgroundMediaId: unifiedData.backgroundImageId,
          ctaText: unifiedData.ctaText,
          ctaLink: unifiedData.ctaLink,
          certificationIds: unifiedData.certificationIds,
        },
      };
      setLocalForm(mappedData);
      setHasUnsavedChanges(false);
    }
  }, [unifiedData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  // Use mutations hook
  const mutations = useAdminSustainabilityMutations();
  const updateMutation = mutations.updateConfig;

  const handleLocalUpdate = (updates: Partial<UnifiedSustainability>) => {
    setLocalForm((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // Map localForm fields to database schema
    const cleanedData: Partial<UnifiedSustainability> = {};

    // Core fields (database columns)
    if (localForm.title !== undefined) {
      cleanedData.title = localForm.title;
    }
    if (localForm.content !== undefined) {
      cleanedData.content = localForm.content;
    }
    if (localForm.isActive !== undefined) {
      cleanedData.isActive = localForm.isActive;
    }

    // Hero section fields (database columns at top-level, not in data JSONB)
    // These are stored in localForm.data['']* by UI but need to go to top-level columns
    if (localForm.data?.headline !== undefined) {
      cleanedData.headline = localForm.data.headline;
    }
    if (localForm.data?.subheadline !== undefined) {
      cleanedData.subheadline = localForm.data.subheadline;
    }
    if (localForm.data?.backgroundMediaId !== undefined) {
      cleanedData.backgroundImageId = localForm.data.backgroundMediaId;
    }
    if (localForm.data?.ctaText !== undefined) {
      cleanedData.ctaText = localForm.data.ctaText;
    }
    if (localForm.data?.ctaLink !== undefined) {
      cleanedData.ctaLink = localForm.data.ctaLink;
    }

    // Features Section
    if (localForm.featuresTitle !== undefined) {
      cleanedData.featuresTitle = localForm.featuresTitle;
    }
    if (localForm.featuresDescription !== undefined) {
      cleanedData.featuresDescription = localForm.featuresDescription;
    }

    // Fabric Portfolio Section
    if (localForm.fabricPortfolioTitle !== undefined) {
      cleanedData.fabricPortfolioTitle = localForm.fabricPortfolioTitle;
    }
    if (localForm.fabricPortfolioDescription !== undefined) {
      cleanedData.fabricPortfolioDescription = localForm.fabricPortfolioDescription;
    }

    // Call To Action Section
    if (localForm.callToActionTitle !== undefined) {
      cleanedData.callToActionTitle = localForm.callToActionTitle;
    }
    if (localForm.callToActionDescription !== undefined) {
      cleanedData.callToActionDescription = localForm.callToActionDescription;
    }
    if (localForm.callToActionButtonText !== undefined) {
      cleanedData.callToActionButtonText = localForm.callToActionButtonText;
    }
    if (localForm.callToActionButtonLink !== undefined) {
      cleanedData.callToActionButtonLink = localForm.callToActionButtonLink;
    }

    // Section Headers
    if (localForm.metricsTitle !== undefined) {
      cleanedData.metricsTitle = localForm.metricsTitle;
    }
    if (localForm.metricsDescription !== undefined) {
      cleanedData.metricsDescription = localForm.metricsDescription;
    }
    if (localForm.certificationsTitle !== undefined) {
      cleanedData.certificationsTitle = localForm.certificationsTitle;
    }
    if (localForm.certificationsDescription !== undefined) {
      cleanedData.certificationsDescription = localForm.certificationsDescription;
    }
    if (localForm.certificationsFooterNote !== undefined) {
      cleanedData.certificationsFooterNote = localForm.certificationsFooterNote;
    }
    if (localForm.initiativesTitle !== undefined) {
      cleanedData.initiativesTitle = localForm.initiativesTitle;
    }
    if (localForm.initiativesDescription !== undefined) {
      cleanedData.initiativesDescription = localForm.initiativesDescription;
    }
    if (localForm.goalsTitle !== undefined) {
      cleanedData.goalsTitle = localForm.goalsTitle;
    }
    if (localForm.goalsDescription !== undefined) {
      cleanedData.goalsDescription = localForm.goalsDescription;
    }

    // Certification IDs (database column, JSONB array)
    if (localForm.data?.certificationIds !== undefined) {
      cleanedData.certificationIds = localForm.data.certificationIds;
    }

    // JSONB data field - legacy/extra fields
    const dataFields: Record<string, any> = {};
    if (localForm.data?.highlightedFeatures !== undefined) {
      dataFields.highlightedFeatures = localForm.data.highlightedFeatures;
    }
    if (localForm.data?.statistics !== undefined && localForm.data.statistics !== null) {
      dataFields.statistics = localForm.data.statistics;
    }
    if (
      localForm.data?.impactMetrics &&
      typeof localForm.data.impactMetrics === "object" &&
      localForm.data.impactMetrics !== null
    ) {
      dataFields.impactMetrics = localForm.data.impactMetrics;
    }
    if (localForm.data?.initiatives !== undefined && localForm.data.initiatives !== null) {
      dataFields.initiatives = localForm.data.initiatives;
    }
    if (localForm.data?.goals !== undefined && localForm.data.goals !== null) {
      dataFields.goals = localForm.data.goals;
    }
    if (localForm.data?.selectedFabricIds !== undefined) {
      dataFields.selectedFabricIds = localForm.data.selectedFabricIds;
    }

    if (Object.keys(dataFields).length > 0) {
      cleanedData.data = dataFields;
    }

    // REMOVED: metrics JSONB column update (use sustainability_metrics table instead)

    updateMutation.mutate(cleanedData, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast({
          title: "Configuration saved",
          description: "Sustainability settings have been successfully updated.",
        });
      },
      onError: () => {
        toast({
          title: "Error saving configuration",
          description: "Failed to save sustainability settings. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    // Handle both single asset and array (dialog uses single mode but type supports both)
    const media = Array.isArray(assets) ? assets[0] : assets;
    if (media) {
      handleLocalUpdate({
        data: { ...localForm.data, backgroundMediaId: media.id },
      });
      setIsMediaPickerOpen(false);
    }
  };

  // Get all mutations from the hook
  const createMetricMutation = mutations.createMetric;
  const updateMetricMutation = mutations.updateMetric;
  const deleteMetricMutation = mutations.deleteMetric;
  const reorderMetricsMutation = mutations.reorderMetrics;
  const createInitiativeMutation = mutations.createInitiative;
  const updateInitiativeMutation = mutations.updateInitiative;
  const deleteInitiativeMutation = mutations.deleteInitiative;
  const reorderInitiativesMutation = mutations.reorderInitiatives;
  const createGoalMutation = mutations.createGoal;
  const updateGoalMutation = mutations.updateGoal;
  const deleteGoalMutation = mutations.deleteGoal;

  // Drag and drop handlers
  const handleMetricDragEnd = (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    const { active, over } = event;
    if (over && active.id !== over.id && metrics) {
      const oldIndex = metrics.findIndex((item) => item.id === active.id);
      const newIndex = metrics.findIndex((item) => item.id === over.id);
      const reorderedMetrics = arrayMove(metrics, oldIndex, newIndex);
      const updates = reorderedMetrics.map((metric, index) => ({
        id: metric.id,
        position: index,
      }));
      reorderMetricsMutation.mutate(updates);
    }
  };

  const handleInitiativeDragEnd = (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    const { active, over } = event;
    if (over && active.id !== over.id && initiatives) {
      // Use full initiatives array (not paginated) for correct global positions
      const oldIndex = initiatives.findIndex((item) => item.id === active.id);
      const newIndex = initiatives.findIndex((item) => item.id === over.id);
      const reorderedInitiatives = arrayMove(initiatives, oldIndex, newIndex);
      // Map all initiatives with their new zero-based positions
      const updates = reorderedInitiatives.map((initiative, index) => ({
        id: initiative.id,
        position: index,
      }));
      reorderInitiativesMutation.mutate(updates);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="border-border mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-blue-600" />
          <p className="text-muted-foreground">Loading sustainability data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Global Sticky Header */}
      <div className="z-elevated shadow-sm-xs sticky top-0 -mx-6 mb-4 flex items-center justify-between border-b bg-white/80 px-6 pt-4 pb-4 backdrop-blur-xs">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Leaf className="h-6 w-6 text-green-600" />
            Unified Sustainability Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage all sustainability content from a single, unified interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="mr-2 animate-pulse text-sm font-medium text-yellow-600">
              Unsaved changes
            </span>
          )}
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={!hasUnsavedChanges || updateMutation.isPending}
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || updateMutation.isPending}
            className="min-w-sidebar gap-2 bg-green-600 hover:bg-green-700"
          >
            {updateMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {unifiedData ? (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 flex w-full flex-wrap h-auto gap-2">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="fabric-portfolio">Fabric Portfolio</TabsTrigger>
            <TabsTrigger value="cta">Call to Action</TabsTrigger>
            <TabsTrigger value="headers">Section Headers</TabsTrigger>
          </TabsList>

          <HeroTabContent
            localForm={localForm}
            hasUnsavedChanges={hasUnsavedChanges}
            isPending={updateMutation.isPending}
            onLocalUpdate={handleLocalUpdate}
            onSave={handleSave} // Kept for logic internal to tab if any, but button removed in top header
            onOpenMediaPicker={() => setIsMediaPickerOpen(true)}
          />

          <FeaturesTabContent
            localForm={localForm}
            hasUnsavedChanges={hasUnsavedChanges}
            isPending={updateMutation.isPending}
            onLocalUpdate={handleLocalUpdate}
            onSave={handleSave}
          />

          <CertificationsTabContent
            localForm={localForm}
            hasUnsavedChanges={hasUnsavedChanges}
            isPending={updateMutation.isPending}
            availableCertificates={availableCertificates}
            onLocalUpdate={handleLocalUpdate}
            onSave={handleSave}
          />

          <MetricsTabContent
            metrics={metrics}
            paginatedMetrics={paginatedMetrics}
            metricsPage={metricsPage}
            metricsTotalPages={metricsTotalPages}
            sensors={sensors}
            createMetricMutation={createMetricMutation}
            updateMetricMutation={updateMetricMutation}
            deleteMetricMutation={deleteMetricMutation}
            SortableMetricItem={SortableMetricItem}
            onMetricDragEnd={handleMetricDragEnd}
            onSetMetricsPage={setMetricsPage}
          />

          <InitiativesTabContent
            initiatives={initiatives}
            paginatedInitiatives={paginatedInitiatives}
            initiativesPage={initiativesPage}
            initiativesTotalPages={initiativesTotalPages}
            sensors={sensors}
            createInitiativeMutation={createInitiativeMutation}
            updateInitiativeMutation={updateInitiativeMutation}
            deleteInitiativeMutation={deleteInitiativeMutation}
            SortableInitiativeItem={SortableInitiativeItem}
            onInitiativeDragEnd={handleInitiativeDragEnd}
            onSetInitiativesPage={setInitiativesPage}
          />

          <GoalsTabContent
            goals={goals}
            paginatedGoals={paginatedGoals}
            goalsPage={goalsPage}
            goalsTotalPages={goalsTotalPages}
            sensors={sensors}
            createGoalMutation={createGoalMutation}
            updateGoalMutation={updateGoalMutation}
            deleteGoalMutation={deleteGoalMutation}
            SortableGoalItem={SortableGoalItem}
            onSetGoalsPage={setGoalsPage}
          />

          <FabricPortfolioTabContent
            localForm={localForm}
            hasUnsavedChanges={hasUnsavedChanges}
            isPending={updateMutation.isPending}
            onLocalUpdate={handleLocalUpdate}
            onSave={handleSave}
          />

          <CallToActionTabContent
            localForm={localForm}
            hasUnsavedChanges={hasUnsavedChanges}
            isPending={updateMutation.isPending}
            onLocalUpdate={handleLocalUpdate}
            onSave={handleSave}
          />

          <SectionHeadersTabContent
            localForm={localForm}
            hasUnsavedChanges={hasUnsavedChanges}
            isPending={updateMutation.isPending}
            onLocalUpdate={handleLocalUpdate}
            onSave={handleSave}
          />
        </Tabs>
      ) : null}

      {/* Media Picker Dialog */}
      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Background Media"
        mediaPickerTarget="sustainability-hero-background"
        selectionMode="single"
      />
    </div>
  );
}
