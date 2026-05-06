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
  Trash2,
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
import { cn } from "@/lib/utils";
import { CallToActionTabContent } from "./CallToActionTabContent";
import { CertificationsTabContent } from "./CertificationsTabContent";
import { FabricPortfolioTabContent } from "./FabricPortfolioTabContent";
import { FeaturesTabContent } from "./FeaturesTabContent";
import { GoalsTabContent } from "./GoalsTabContent";
import { HeroTabContent } from "./HeroTabContent";
import { InitiativesTabContent } from "./InitiativesTabContent";
import { MetricsTabContent } from "./metrics-tab";
import { SectionHeadersTabContent } from "./SectionHeadersTabContent";

// Sortable item components standardized with Stitch aesthetics
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
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-admin-muted hover:text-emerald-400 transition-colors"
          aria-label="Drag to reorder metric"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <IconComponent className="size-5 text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white tracking-tight truncate">{metric.name}</h4>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-emerald-400 font-bold text-sm">
              {metric.value} {metric.unit}
            </span>
            <span className="text-xxs uppercase tracking-widest text-admin-muted font-bold">
              {metric.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(metric)}
            className="size-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(metric.id)}
            title="Delete Metric"
            description="Are you sure you want to delete this sustainability metric?"
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
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

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-admin-muted hover:text-emerald-400 transition-colors"
          aria-label="Drag to reorder initiative"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Leaf className="size-6 text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white tracking-tight truncate mb-1">{initiative.title}</h4>
          {initiative.description && (
            <p className="text-admin-muted text-sm leading-relaxed line-clamp-2">
              {initiative.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(initiative)}
            className="size-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(initiative.id)}
            title="Delete Initiative"
            description="Are you sure you want to delete this sustainability initiative?"
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
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
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-admin-muted hover:text-emerald-400 transition-colors"
          aria-label="Drag to reorder goal"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Target className="size-6 text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-bold text-white tracking-tight truncate">{goal.title}</h4>
            <span className="text-xxs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Target: {goal.targetYear || "TBD"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-admin-muted">
                <span className="text-white font-bold">{goal.currentValue}</span> /{" "}
                {goal.targetValue}{" "}
                <span className="text-xxs uppercase font-bold text-white/40 ml-1">{goal.unit}</span>
              </span>
              <span
                className={cn(
                  "font-bold uppercase tracking-widest text-xxs",
                  progressPercentage >= 100 ? "text-emerald-400" : "text-emerald-400/70",
                )}
              >
                {progressPercentage}% Complete
              </span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  progressPercentage >= 100
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
                )}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(goal)}
            className="size-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(goal.id)}
            title="Delete Goal"
            description="Are you sure you want to delete this sustainability goal?"
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
});

export function UnifiedSustainabilityManagement() {
  const { toast } = useToast();

  const getTabFromUrl = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("tab") || "hero";
  }, []);

  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", value);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getTabFromUrl]);

  const [localForm, setLocalForm] = useState<Partial<UnifiedSustainability>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const resetForm = useCallback(() => {
    if (unifiedData) {
      setLocalForm(unifiedData);
      setHasUnsavedChanges(false);
    }
  }, [unifiedData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const mutations = useAdminSustainabilityMutations();
  const updateMutation = mutations.updateConfig;

  const handleLocalUpdate = (updates: Partial<UnifiedSustainability>) => {
    setLocalForm((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const cleanedData: Partial<UnifiedSustainability> = {};

    if (localForm.title !== undefined) cleanedData.title = localForm.title;
    if (localForm.content !== undefined) cleanedData.content = localForm.content;
    if (localForm.isActive !== undefined) cleanedData.isActive = localForm.isActive;
    if (localForm.headline !== undefined) cleanedData.headline = localForm.headline;
    if (localForm.subheadline !== undefined) cleanedData.subheadline = localForm.subheadline;
    if (localForm.backgroundImageId !== undefined)
      cleanedData.backgroundImageId = localForm.backgroundImageId;
    if (localForm.ctaText !== undefined) cleanedData.ctaText = localForm.ctaText;
    if (localForm.ctaLink !== undefined) cleanedData.ctaLink = localForm.ctaLink;
    if (localForm.featuresTitle !== undefined) cleanedData.featuresTitle = localForm.featuresTitle;
    if (localForm.featuresDescription !== undefined)
      cleanedData.featuresDescription = localForm.featuresDescription;
    if (localForm.fabricPortfolioTitle !== undefined)
      cleanedData.fabricPortfolioTitle = localForm.fabricPortfolioTitle;
    if (localForm.fabricPortfolioDescription !== undefined)
      cleanedData.fabricPortfolioDescription = localForm.fabricPortfolioDescription;
    if (localForm.callToActionTitle !== undefined)
      cleanedData.callToActionTitle = localForm.callToActionTitle;
    if (localForm.callToActionDescription !== undefined)
      cleanedData.callToActionDescription = localForm.callToActionDescription;
    if (localForm.callToActionButtonText !== undefined)
      cleanedData.callToActionButtonText = localForm.callToActionButtonText;
    if (localForm.callToActionButtonLink !== undefined)
      cleanedData.callToActionButtonLink = localForm.callToActionButtonLink;
    if (localForm.metricsTitle !== undefined) cleanedData.metricsTitle = localForm.metricsTitle;
    if (localForm.metricsDescription !== undefined)
      cleanedData.metricsDescription = localForm.metricsDescription;
    if (localForm.certificationsTitle !== undefined)
      cleanedData.certificationsTitle = localForm.certificationsTitle;
    if (localForm.certificationsDescription !== undefined)
      cleanedData.certificationsDescription = localForm.certificationsDescription;
    if (localForm.certificationsFooterNote !== undefined)
      cleanedData.certificationsFooterNote = localForm.certificationsFooterNote;
    if (localForm.initiativesTitle !== undefined)
      cleanedData.initiativesTitle = localForm.initiativesTitle;
    if (localForm.initiativesDescription !== undefined)
      cleanedData.initiativesDescription = localForm.initiativesDescription;
    if (localForm.goalsTitle !== undefined) cleanedData.goalsTitle = localForm.goalsTitle;
    if (localForm.goalsDescription !== undefined)
      cleanedData.goalsDescription = localForm.goalsDescription;
    if (localForm.certificationIds !== undefined) {
      cleanedData.certificationIds = localForm.certificationIds;
    }

    const dataFields: Record<string, unknown> = {};
    if (localForm.data?.highlightedFeatures !== undefined)
      dataFields.highlightedFeatures = localForm.data.highlightedFeatures;
    if (localForm.data?.statistics !== undefined && localForm.data.statistics !== null)
      dataFields.statistics = localForm.data.statistics;
    if (
      localForm.data?.impactMetrics &&
      typeof localForm.data.impactMetrics === "object" &&
      localForm.data.impactMetrics !== null
    )
      dataFields.impactMetrics = localForm.data.impactMetrics;
    if (localForm.data?.initiatives !== undefined && localForm.data.initiatives !== null)
      dataFields.initiatives = localForm.data.initiatives;
    if (localForm.data?.goals !== undefined && localForm.data.goals !== null)
      dataFields.goals = localForm.data.goals;
    if (localForm.data?.selectedFabricIds !== undefined)
      dataFields.selectedFabricIds = localForm.data.selectedFabricIds;

    if (Object.keys(dataFields).length > 0) cleanedData.data = dataFields;

    updateMutation.mutate(cleanedData, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast({
          title: "Configuration saved",
          description: "Sustainability settings have been successfully updated.",
        });
      },
    });
  };

  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const media = Array.isArray(assets) ? assets[0] : assets;
    if (media) {
      handleLocalUpdate({
        backgroundImageId: media.id,
      });
      setIsMediaPickerOpen(false);
    }
  };

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
      const oldIndex = initiatives.findIndex((item) => item.id === active.id);
      const newIndex = initiatives.findIndex((item) => item.id === over.id);
      const reorderedInitiatives = arrayMove(initiatives, oldIndex, newIndex);
      const updates = reorderedInitiatives.map((initiative, index) => ({
        id: initiative.id,
        position: index,
      }));
      reorderInitiativesMutation.mutate(updates);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="flex space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500"></div>
        </div>
        <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
          Initialising Ecosystem Data...
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      <div className="z-10 sticky top-0 -mx-6 mb-6 flex items-center justify-between border-b border-white/5 bg-black/60 px-6 py-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Eco-System Configuration
            </h1>
            <p className="text-sm text-admin-muted">
              Sovereign oversight of global sustainability protocols and metrics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="mr-2 text-xxs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
              Unsaved Ecosystem Changes
            </span>
          )}
          <Button
            variant="ghost"
            onClick={resetForm}
            disabled={!hasUnsavedChanges || updateMutation.isPending}
            className="text-admin-muted hover:bg-white/5 text-xxs font-bold uppercase tracking-widest h-11"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || updateMutation.isPending}
            className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none border-0"
          >
            {updateMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {updateMutation.isPending ? "Syncing..." : "Sync Ecosystem"}
          </Button>
        </div>
      </div>

      {unifiedData ? (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-8 flex w-full flex-wrap h-auto gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
            {[
              { id: "hero", label: "Hero" },
              { id: "features", label: "Features" },
              { id: "metrics", label: "Impact Metrics" },
              { id: "initiatives", label: "Initiatives" },
              { id: "certifications", label: "Compliance" },
              { id: "goals", label: "Mission Goals" },
              { id: "fabric-portfolio", label: "Portfolio" },
              { id: "cta", label: "Call to Action" },
              { id: "headers", label: "Headers" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 py-3 text-xxs uppercase font-bold tracking-widest data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all rounded-xl"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <HeroTabContent
            localForm={localForm}
            hasUnsavedChanges={hasUnsavedChanges}
            isPending={updateMutation.isPending}
            onLocalUpdate={handleLocalUpdate}
            onSave={handleSave}
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

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        mediaPickerTarget="featured-image"
      />
    </div>
  );
}
