import { closestCenter, DndContext, type SensorDescriptor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { InsertSustainabilityMetric, SustainabilityMetric } from "@shared/index";
import type { UseMutationResult } from "@tanstack/react-query";
import { Eye, LayoutTemplate, Plus, Save, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { IconDisplay, IconPicker } from "./shared/IconPicker";

interface MetricFormData {
  category: string;
  metric: string;
  value: string;
  unit: string;
  description: string;
  icon: string;
  isActive: boolean;
  position: number;
}

interface ValidationState {
  isValid: boolean;
  message: string;
}

interface MetricValidation {
  category: ValidationState;
  metric: ValidationState;
  value: ValidationState;
  unit: ValidationState;
  description: ValidationState;
}

interface MetricsTabContentProps {
  metrics: SustainabilityMetric[] | undefined;
  paginatedMetrics: SustainabilityMetric[];
  metricsPage: number;
  metricsTotalPages: number;
  sensors: SensorDescriptor<object>[];
  createMetricMutation: UseMutationResult<unknown, unknown, InsertSustainabilityMetric>;
  updateMetricMutation: UseMutationResult<
    unknown,
    unknown,
    { id: number; data: InsertSustainabilityMetric }
  >;
  deleteMetricMutation: UseMutationResult<unknown, unknown, number>;
  SortableMetricItem: React.ComponentType<{
    metric: SustainabilityMetric;
    onEdit: (metric: SustainabilityMetric) => void;
    onDelete: (id: number) => void;
  }>;
  onMetricDragEnd: (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => void;
  onSetMetricsPage: (page: number) => void;
}

export function MetricsTabContent({
  metrics,
  paginatedMetrics,
  metricsPage,
  metricsTotalPages,
  sensors,
  createMetricMutation,
  updateMetricMutation,
  deleteMetricMutation,
  SortableMetricItem,
  onMetricDragEnd,
  onSetMetricsPage,
}: MetricsTabContentProps) {
  const [showMetricDialog, setShowMetricDialog] = useState(false);
  const [showMetricPreview, setShowMetricPreview] = useState(false);
  const [showMetricIconPicker, setShowMetricIconPicker] = useState(false);
  const [editingMetric, setEditingMetric] = useState<SustainabilityMetric | null>(null);

  const [metricForm, setMetricForm] = useState<MetricFormData>({
    category: "",
    metric: "",
    value: "",
    unit: "",
    description: "",
    icon: "Leaf",
    isActive: true,
    position: 1,
  });

  const [metricValidation, setMetricValidation] = useState<MetricValidation>({
    category: { isValid: true, message: "" },
    metric: { isValid: true, message: "" },
    value: { isValid: true, message: "" },
    unit: { isValid: true, message: "" },
    description: { isValid: true, message: "" },
  });

  const validateMetricForm = (field?: string): boolean => {
    const newValidation = { ...metricValidation };
    let isFormValid = true;

    if (!field || field === "category") {
      if (!metricForm.category.trim()) {
        newValidation.category = {
          isValid: false,
          message: "Category is required",
        };
        isFormValid = false;
      } else {
        newValidation.category = { isValid: true, message: "" };
      }
    }

    if (!field || field === "metric") {
      if (!metricForm.metric.trim()) {
        newValidation.metric = {
          isValid: false,
          message: "Metric name is required",
        };
        isFormValid = false;
      } else if (metricForm.metric.length < 3) {
        newValidation.metric = {
          isValid: false,
          message: "Metric name must be at least 3 characters",
        };
        isFormValid = false;
      } else {
        newValidation.metric = { isValid: true, message: "" };
      }
    }

    if (!field || field === "value") {
      if (!metricForm.value.trim()) {
        newValidation.value = { isValid: false, message: "Value is required" };
        isFormValid = false;
      } else if (Number.isNaN(Number(metricForm.value))) {
        newValidation.value = {
          isValid: false,
          message: "Value must be a number",
        };
        isFormValid = false;
      } else {
        newValidation.value = { isValid: true, message: "" };
      }
    }

    if (!field || field === "unit") {
      if (!metricForm.unit.trim()) {
        newValidation.unit = { isValid: false, message: "Unit is required" };
        isFormValid = false;
      } else {
        newValidation.unit = { isValid: true, message: "" };
      }
    }

    if (!field || field === "description") {
      if (!metricForm.description.trim()) {
        newValidation.description = {
          isValid: false,
          message: "Description is required",
        };
        isFormValid = false;
      } else if (metricForm.description.length < 10) {
        newValidation.description = {
          isValid: false,
          message: "Description must be at least 10 characters",
        };
        isFormValid = false;
      } else {
        newValidation.description = { isValid: true, message: "" };
      }
    }

    setMetricValidation(newValidation);
    return isFormValid;
  };

  const resetMetricForm = () => {
    setMetricForm({
      category: "",
      metric: "",
      value: "",
      unit: "",
      description: "",
      icon: "Leaf",
      isActive: true,
      position: 1,
    });
    setMetricValidation({
      category: { isValid: true, message: "" },
      metric: { isValid: true, message: "" },
      value: { isValid: true, message: "" },
      unit: { isValid: true, message: "" },
      description: { isValid: true, message: "" },
    });
  };

  const handleMetricSubmit = () => {
    const isValidForm = validateMetricForm();
    if (!isValidForm) {
      return;
    }

    const transformedData = {
      name: metricForm.metric,
      value: metricForm.value,
      category: metricForm.category,
      unit: metricForm.unit,
      description: metricForm.description,
      iconName: metricForm.icon,
      sortOrder: metricForm.position,
      isActive: metricForm.isActive,
    };

    if (editingMetric) {
      updateMetricMutation.mutate(
        { id: editingMetric.id, data: transformedData },
        {
          onSuccess: () => {
            setShowMetricDialog(false);
            setEditingMetric(null);
            resetMetricForm();
          },
        },
      );
    } else {
      createMetricMutation.mutate(transformedData, {
        onSuccess: () => {
          setShowMetricDialog(false);
          resetMetricForm();
        },
      });
    }
  };

  const openMetricDialog = (metric?: SustainabilityMetric) => {
    if (metric) {
      setEditingMetric(metric);
      setMetricForm({
        category: metric.category || "",
        metric: metric.name || "",
        value: metric.value || "",
        unit: metric.unit || "",
        description: metric.description || "",
        icon: metric.iconName || "Leaf",
        isActive: metric.isActive ?? true,
        position: metric.sortOrder || 1,
      });
    } else {
      setEditingMetric(null);
      resetMetricForm();
    }
    setShowMetricDialog(true);
  };

  return (
    <>
      <TabsContent value="metrics" className="outline-none">
        <GlassCard className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Real-Time Impact Metrics
              </h2>
              <p className="text-sm text-[#68869A]">
                Quantify operational efficiency and ecosystem health through data
              </p>
            </div>
            <Button
              onClick={() => openMetricDialog()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Initialise Metric
            </Button>
          </div>

          {metrics && metrics.length > 0 ? (
            <div className="space-y-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onMetricDragEnd}
              >
                <SortableContext
                  items={paginatedMetrics.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-3">
                    {paginatedMetrics.map((metric) => (
                      <SortableMetricItem
                        key={metric.id}
                        metric={metric}
                        onEdit={openMetricDialog}
                        onDelete={(id) => deleteMetricMutation.mutate(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {metricsTotalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent className="bg-white/5 border border-white/10 rounded-xl p-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => onSetMetricsPage(Math.max(1, metricsPage - 1))}
                          className={cn(
                            "rounded-lg text-[#68869A] hover:bg-white/10 hover:text-white",
                            metricsPage === 1 && "pointer-events-none opacity-30",
                          )}
                        />
                      </PaginationItem>
                      {[...Array(metricsTotalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => onSetMetricsPage(i + 1)}
                            isActive={metricsPage === i + 1}
                            className={cn(
                              "rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                              metricsPage === i + 1
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                : "text-[#68869A] hover:bg-white/10",
                            )}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            onSetMetricsPage(Math.min(metricsTotalPages, metricsPage + 1))
                          }
                          className={cn(
                            "rounded-lg text-[#68869A] hover:bg-white/10 hover:text-white",
                            metricsPage === metricsTotalPages && "pointer-events-none opacity-30",
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-[#68869A]/40" />
              </div>
              <h3 className="text-white font-bold mb-1">No Metrics Recorded</h3>
              <p className="text-[#68869A] text-sm max-w-[280px]">
                Operational data streams have not been initialised.
              </p>
            </div>
          )}
        </GlassCard>
      </TabsContent>

      {/* Metric Dialog */}
      <Dialog open={showMetricDialog} onOpenChange={setShowMetricDialog}>
        <DialogContent
          contentType="form"
          className="max-w-2xl bg-[#0A0A0A] border-white/10 p-0 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/10"
        >
          <DialogHeader className="p-8 pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {editingMetric ? "Refine Metric" : "New Ecosystem Metric"}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMetricDialog(false)}
                className="rounded-full hover:bg-white/5 text-[#68869A]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <DialogDescription className="text-[#68869A] ml-13">
              Configure operational parameters to track global environmental impact.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Impact Sector
                </Label>
                <Select
                  value={metricForm.category}
                  onValueChange={(value) => {
                    setMetricForm((prev) => ({ ...prev, category: value }));
                    validateMetricForm("category");
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50",
                      !metricValidation.category.isValid && "border-red-500/50 bg-red-500/5",
                    )}
                  >
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121212] border-white/10 text-white">
                    <SelectItem value="Energy">Energy Efficiency</SelectItem>
                    <SelectItem value="Water">Water Stewardship</SelectItem>
                    <SelectItem value="Waste">Waste Minimisation</SelectItem>
                    <SelectItem value="Carbon">Carbon Footprint</SelectItem>
                    <SelectItem value="Materials">Sustainable Materials</SelectItem>
                    <SelectItem value="Social">Social Compliance</SelectItem>
                  </SelectContent>
                </Select>
                {!metricValidation.category.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {metricValidation.category.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="metric"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Metric Definition
                </Label>
                <Input
                  id="metric"
                  value={metricForm.metric}
                  onChange={(e) => {
                    setMetricForm((prev) => ({
                      ...prev,
                      metric: e.target.value,
                    }));
                    validateMetricForm("metric");
                  }}
                  placeholder="e.g., Solar Power Utilisation"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !metricValidation.metric.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!metricValidation.metric.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {metricValidation.metric.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="value"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Current Magnitude
                </Label>
                <Input
                  id="value"
                  value={metricForm.value}
                  onChange={(e) => {
                    setMetricForm((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }));
                    validateMetricForm("value");
                  }}
                  placeholder="e.g., 85"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !metricValidation.value.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!metricValidation.value.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {metricValidation.value.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="unit"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Unit of Measure
                </Label>
                <Input
                  id="unit"
                  value={metricForm.unit}
                  onChange={(e) => {
                    setMetricForm((prev) => ({
                      ...prev,
                      unit: e.target.value,
                    }));
                    validateMetricForm("unit");
                  }}
                  placeholder="e.g., % of total output"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !metricValidation.unit.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!metricValidation.unit.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {metricValidation.unit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
              >
                Supporting Context
              </Label>
              <Textarea
                id="description"
                value={metricForm.description}
                onChange={(e) => {
                  setMetricForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  validateMetricForm("description");
                }}
                placeholder="Elaborate on the significance of this metric within the ecosystem..."
                rows={4}
                className={cn(
                  "bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none",
                  !metricValidation.description.isValid && "border-red-500/50 bg-red-500/5",
                )}
              />
              {!metricValidation.description.isValid && (
                <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                  {metricValidation.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                Visual Symbology
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <IconDisplay iconName={metricForm.icon} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight">
                    {metricForm.icon || "Leaf"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMetricIconPicker(true)}
                  className="h-16 px-6 rounded-xl border border-white/10 text-[#68869A] hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
                >
                  Configure Symbol
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor="metric-active"
                    className="text-sm font-bold text-white tracking-tight"
                  >
                    Active Protocol
                  </Label>
                  <p className="text-[10px] text-[#68869A] uppercase font-bold tracking-widest">
                    Visibility in Dashboard
                  </p>
                </div>
                <Switch
                  id="metric-active"
                  checked={metricForm.isActive}
                  onCheckedChange={(checked) =>
                    setMetricForm((prev) => ({ ...prev, isActive: checked }))
                  }
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="position"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Priority Index
                </Label>
                <Input
                  id="position"
                  type="number"
                  min="1"
                  value={metricForm.position || ""}
                  onChange={(e) =>
                    setMetricForm((prev) => ({
                      ...prev,
                      position: parseInt(e.target.value, 10) || 1,
                    }))
                  }
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                  placeholder="1"
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="p-8 pt-0 border-0 bg-transparent">
            <div className="flex w-full items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowMetricPreview(true)}
                className="h-12 px-6 rounded-xl text-[#68869A] hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
              >
                <Eye className="mr-2 h-4 w-4" />
                Live Preview
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowMetricDialog(false)}
                  className="h-12 px-6 rounded-xl text-[#68869A] hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMetricSubmit}
                  disabled={createMetricMutation.isPending || updateMetricMutation.isPending}
                  className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none border-0"
                >
                  {createMetricMutation.isPending || updateMetricMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2" />
                  ) : editingMetric ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingMetric ? "Sync Metric" : "Initialise Metric"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Preview Modal */}
      <Dialog open={showMetricPreview} onOpenChange={setShowMetricPreview}>
        <DialogContent
          contentType="form"
          className="max-w-md bg-[#0A0A0A] border-white/10 p-0 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/10"
        >
          <DialogHeader className="p-8 pb-4">
            <div className="items-center gap-2 mb-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 inline-flex w-fit mx-auto">
              <LayoutTemplate className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Mobile Viewport Simulation
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight text-center">
              Protocol Preview
            </DialogTitle>
          </DialogHeader>

          <div className="px-8 pb-8 flex justify-center">
            <div className="aspect-[9/16] w-full max-w-[280px] rounded-[32px] border-[8px] border-white/10 bg-black overflow-hidden relative shadow-2xl ring-1 ring-white/5 p-6 flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-black z-0" />

              <div className="relative z-10 space-y-8 flex flex-col items-center text-center">
                <div className="size-20 rounded-[28%] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <IconDisplay iconName={metricForm.icon} className="size-10" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {metricForm.category || "Environmental Impact"}
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-tight pt-2">
                      {metricForm.metric || "Sustainable Protocol"}
                    </h3>
                  </div>

                  <div className="flex items-baseline justify-center gap-1.5 pt-2">
                    <span className="text-5xl font-bold text-white tracking-tighter shadow-emerald-500/20">
                      {metricForm.value || "0"}
                    </span>
                    <span className="text-base font-bold text-white/40 uppercase tracking-widest">
                      {metricForm.unit || "N/A"}
                    </span>
                  </div>

                  <p className="text-[10px] text-white/50 leading-relaxed line-clamp-4 max-w-[200px]">
                    {metricForm.description ||
                      "Comprehensive operational data stream representing a critical ecosystem milestone."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 border-0">
            <Button
              onClick={() => setShowMetricPreview(false)}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/10"
            >
              Terminate Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Icon Picker */}
      <IconPicker
        isOpen={showMetricIconPicker}
        onClose={() => setShowMetricIconPicker(false)}
        onSelect={(iconName) => setMetricForm((prev) => ({ ...prev, icon: iconName }))}
        currentIcon={metricForm.icon}
        title="Select Metric Icon"
      />
    </>
  );
}
