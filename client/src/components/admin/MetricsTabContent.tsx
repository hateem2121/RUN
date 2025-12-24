import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { SustainabilityMetric } from "@shared/schema";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EnhancedDialog,
  EnhancedDialogBody,
  EnhancedDialogContent,
  EnhancedDialogDescription,
  EnhancedDialogFooter,
  EnhancedDialogHeader,
  EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
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
  sensors: any;
  createMetricMutation: any;
  updateMetricMutation: any;
  deleteMetricMutation: any;
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
  const [editingMetric, setEditingMetric] =
    useState<SustainabilityMetric | null>(null);

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
      } else if (isNaN(Number(metricForm.value))) {
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
    if (!isValidForm) return;

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
      <TabsContent value="metrics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sustainability Metrics
              <Button onClick={() => openMetricDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Metric
              </Button>
            </CardTitle>
            <CardDescription>
              Manage sustainability metrics with drag-and-drop reordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics && metrics.length > 0 ? (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onMetricDragEnd}
                >
                  <SortableContext
                    items={paginatedMetrics.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedMetrics.map((metric) => (
                      <SortableMetricItem
                        key={metric.id}
                        metric={metric}
                        onEdit={openMetricDialog}
                        onDelete={(id) => deleteMetricMutation.mutate(id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {metricsTotalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              onSetMetricsPage(Math.max(1, metricsPage - 1))
                            }
                            className={
                              metricsPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {[...Array(metricsTotalPages)].map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => onSetMetricsPage(i + 1)}
                              isActive={metricsPage === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              onSetMetricsPage(
                                Math.min(metricsTotalPages, metricsPage + 1),
                              )
                            }
                            className={
                              metricsPage === metricsTotalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No metrics yet. Create your first sustainability metric.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Metric Dialog */}
      <EnhancedDialog
        open={showMetricDialog}
        onOpenChange={setShowMetricDialog}
      >
        <EnhancedDialogContent contentType="form">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>
              {editingMetric ? "Edit Metric" : "Add New Metric"}
            </EnhancedDialogTitle>
            <EnhancedDialogDescription>
              {editingMetric
                ? "Update the sustainability metric details"
                : "Create a new sustainability metric"}
            </EnhancedDialogDescription>
          </EnhancedDialogHeader>
          <EnhancedDialogBody>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={metricForm.category}
                  onValueChange={(value) => {
                    setMetricForm((prev) => ({ ...prev, category: value }));
                    validateMetricForm("category");
                  }}
                >
                  <SelectTrigger
                    className={
                      !metricValidation.category.isValid
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Water">Water</SelectItem>
                    <SelectItem value="Waste">Waste</SelectItem>
                    <SelectItem value="Carbon">Carbon</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                  </SelectContent>
                </Select>
                {!metricValidation.category.isValid && (
                  <p className="text-sm text-red-500 mt-1">
                    {metricValidation.category.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="metric">Metric Name</Label>
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
                  onBlur={() => validateMetricForm("metric")}
                  placeholder="e.g., Energy Consumption"
                  className={
                    !metricValidation.metric.isValid
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {!metricValidation.metric.isValid && (
                  <p className="text-sm text-red-500 mt-1">
                    {metricValidation.metric.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="value">Value</Label>
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
                    onBlur={() => validateMetricForm("value")}
                    placeholder="e.g., 25"
                    className={
                      !metricValidation.value.isValid
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {!metricValidation.value.isValid && (
                    <p className="text-sm text-red-500 mt-1">
                      {metricValidation.value.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
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
                    onBlur={() => validateMetricForm("unit")}
                    placeholder="e.g., kWh"
                    className={
                      !metricValidation.unit.isValid
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {!metricValidation.unit.isValid && (
                    <p className="text-sm text-red-500 mt-1">
                      {metricValidation.unit.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
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
                  onBlur={() => validateMetricForm("description")}
                  placeholder="Describe this metric..."
                  className={
                    !metricValidation.description.isValid
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {!metricValidation.description.isValid && (
                  <p className="text-sm text-red-500 mt-1">
                    {metricValidation.description.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Icon Selection</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <IconDisplay
                      iconName={metricForm.icon}
                      showBackground={true}
                    />
                    <span className="text-sm font-medium">
                      {metricForm.icon || "Leaf"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMetricIconPicker(true)}
                    className="px-4"
                  >
                    Choose Icon
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="metric-active"
                    checked={metricForm.isActive}
                    onCheckedChange={(checked) =>
                      setMetricForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label
                    htmlFor="metric-active"
                    className="text-sm font-medium"
                  >
                    Active
                  </Label>
                </div>
                <div>
                  <Label htmlFor="position">Display Position</Label>
                  <Input
                    id="position"
                    type="number"
                    min="1"
                    value={metricForm.position || ""}
                    onChange={(e) =>
                      setMetricForm((prev) => ({
                        ...prev,
                        position: parseInt(e.target.value) || 1,
                      }))
                    }
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </EnhancedDialogBody>
          <EnhancedDialogFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="secondary"
                onClick={() => setShowMetricPreview(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMetricDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMetricSubmit}
                  disabled={
                    createMetricMutation.isPending ||
                    updateMetricMutation.isPending
                  }
                >
                  {editingMetric ? "Update" : "Create"} Metric
                </Button>
              </div>
            </div>
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>

      {/* Metric Preview Modal */}
      <EnhancedDialog
        open={showMetricPreview}
        onOpenChange={setShowMetricPreview}
      >
        <EnhancedDialogContent contentType="form">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>Metric Preview</EnhancedDialogTitle>
            <EnhancedDialogDescription>
              This is how your metric will appear on the sustainability page
            </EnhancedDialogDescription>
          </EnhancedDialogHeader>
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <IconDisplay
                      iconName={metricForm.icon}
                      className="text-green-600"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {metricForm.category || "Category"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {metricForm.metric || "Metric Name"}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold text-green-600">
                      {metricForm.value || "0"}
                    </span>
                    <span className="text-lg text-gray-600">
                      {metricForm.unit || "unit"}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {metricForm.description ||
                      "Add a description to explain this metric and its impact on sustainability goals."}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <EnhancedDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMetricPreview(false)}
            >
              Close Preview
            </Button>
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>

      {/* Metric Icon Picker */}
      <IconPicker
        isOpen={showMetricIconPicker}
        onClose={() => setShowMetricIconPicker(false)}
        onSelect={(iconName) =>
          setMetricForm((prev) => ({ ...prev, icon: iconName }))
        }
        currentIcon={metricForm.icon}
        title="Select Metric Icon"
      />
    </>
  );
}
