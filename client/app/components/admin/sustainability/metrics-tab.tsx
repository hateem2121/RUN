import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { SustainabilityMetric } from "@shared/schema";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MetricCard } from "../../sustainability/cards/MetricCard";
import { IconDisplay, IconPicker } from "../shared/IconPicker";

// Zod schema for metric validation
const metricSchema = z.object({
  category: z.string().min(1, "Category is required"),
  metric: z.string().min(3, "Metric name must be at least 3 characters"),
  value: z
    .string()
    .min(1, "Value is required")
    .refine((val) => !Number.isNaN(Number(val)), "Value must be a number"),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().default("Leaf"),
  isActive: z.boolean().default(true),
  position: z.number().int().min(1).default(1),
});

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
  // biome-ignore lint/suspicious/noExplicitAny: dnd-kit sensors type is complex
  sensors: any;
  // biome-ignore lint/suspicious/noExplicitAny: React Query mutation types are complex
  createMetricMutation: any;
  // biome-ignore lint/suspicious/noExplicitAny: React Query mutation types are complex
  updateMetricMutation: any;
  // biome-ignore lint/suspicious/noExplicitAny: React Query mutation types are complex
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
  const [showMetricSheet, setShowMetricSheet] = useState(false);
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

  // biome-ignore lint/suspicious/noExplicitAny: Generic value validation
  const validateMetricForm = (field?: string, value?: any): boolean => {
    try {
      if (field) {
        // Partial validation for single field
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic schema picking
        const pickSchema = metricSchema.pick({ [field]: true } as any);
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic form access
        const valueToValidate = value !== undefined ? value : (metricForm as any)[field];
        pickSchema.parse({ [field]: valueToValidate });

        setMetricValidation((prev) => ({
          ...prev,
          [field]: { isValid: true, message: "" },
        }));
        return true;
      } else {
        // Full validation
        metricSchema.parse(metricForm);
        setMetricValidation({
          category: { isValid: true, message: "" },
          metric: { isValid: true, message: "" },
          value: { isValid: true, message: "" },
          unit: { isValid: true, message: "" },
          description: { isValid: true, message: "" },
        });
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newValidation = { ...metricValidation };
        let isFormValid = true;

        (error as z.ZodError).issues.forEach((err: z.ZodIssue) => {
          const path = err.path[0] as keyof MetricValidation;
          if (path && (!field || field === path)) {
            newValidation[path] = {
              isValid: false,
              message: err.message,
            };
            if (!field) {
              isFormValid = false;
            }
          }
        });

        if (field) {
          // If we are validating a specific field and it wasn't in the errors, mark it valid
          const hasError = (error as z.ZodError).issues.some(
            (e: z.ZodIssue) => e.path[0] === field,
          );
          if (!hasError) {
            newValidation[field as keyof MetricValidation] = {
              isValid: true,
              message: "",
            };
            return true;
          }
          setMetricValidation(newValidation);
          return false;
        }

        setMetricValidation(newValidation);
        return isFormValid;
      }
      return false;
    }
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
            setShowMetricSheet(false);
            setEditingMetric(null);
            resetMetricForm();
          },
        },
      );
    } else {
      createMetricMutation.mutate(transformedData, {
        onSuccess: () => {
          setShowMetricSheet(false);
          resetMetricForm();
        },
      });
    }
  };

  const openMetricSheet = (metric?: SustainabilityMetric) => {
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
    setShowMetricSheet(true);
  };

  return (
    <TabsContent value="metrics" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sustainability Metrics
            <Button onClick={() => openMetricSheet()}>
              <Plus className="mr-2 h-4 w-4" />
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
                      onEdit={openMetricSheet}
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
                          onClick={() => onSetMetricsPage(Math.max(1, metricsPage - 1))}
                          className={
                            metricsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
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
                            onSetMetricsPage(Math.min(metricsTotalPages, metricsPage + 1))
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
            <div className="py-8 text-center text-muted-foreground">
              No metrics yet. Create your first sustainability metric.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metric Sheet (Side Panel) */}
      <Sheet open={showMetricSheet} onOpenChange={setShowMetricSheet}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingMetric ? "Edit Metric" : "Add New Metric"}</SheetTitle>
            <SheetDescription>
              {editingMetric
                ? "Update the sustainability metric details"
                : "Create a new sustainability metric"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={metricForm.category}
                onValueChange={(value) => {
                  setMetricForm((prev) => ({ ...prev, category: value }));
                  validateMetricForm("category", value);
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
                <p className="mt-1 text-red-500 text-sm">{metricValidation.category.message}</p>
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
                  validateMetricForm("metric", e.target.value);
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
                <p className="mt-1 text-red-500 text-sm">{metricValidation.metric.message}</p>
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
                    validateMetricForm("value", e.target.value);
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
                  <p className="mt-1 text-red-500 text-sm">{metricValidation.value.message}</p>
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
                    validateMetricForm("unit", e.target.value);
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
                  <p className="mt-1 text-red-500 text-sm">{metricValidation.unit.message}</p>
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
                  validateMetricForm("description", e.target.value);
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
                <p className="mt-1 text-red-500 text-sm">{metricValidation.description.message}</p>
              )}
            </div>
            <div>
              <Label>Icon Selection</Label>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
                  <IconDisplay iconName={metricForm.icon} showBackground={true} />
                  <span className="font-medium text-sm">{metricForm.icon || "Leaf"}</span>
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
                <Label htmlFor="metric-active" className="font-medium text-sm">
                  Active
                </Label>
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
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
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="mt-8 flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleMetricSubmit}
              disabled={createMetricMutation.isPending || updateMetricMutation.isPending}
              className="w-full"
            >
              {editingMetric ? "Update" : "Create"} Metric
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowMetricPreview(true)}
              className="flex w-full items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Card
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Metric Preview Dialog (Keeping Dialog for Preview as it's just a view) */}
      {/* Or should I make it a nested sheet? A dialogue is fine for a quick preview overlay on top of sheet. */}
      {/* However, standard shadcn sheet overlay might conflicts. Let's stick to Dialog for Preview, 
          but ensure z-index works, or just render it. */}
      {showMetricPreview && (
        <div className="center-flex fixed inset-0 z-toast bg-black/50 p-4">
          <div className="fade-in zoom-in-95 relative w-full max-w-md animate-in bg-transparent duration-200">
            <div className="absolute -top-12 right-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMetricPreview(false)}
                className="h-8 w-8 rounded-full bg-white/10 p-0 text-white backdrop-blur-xs hover:bg-white/20"
              >
                ✕
              </Button>
            </div>
            <div className="pointer-events-none">
              <MetricCard
                metric={{
                  id: 0, // Mock ID for preview
                  name: metricForm.metric || "Metric Name",
                  value: metricForm.value || "0",
                  unit: metricForm.unit || "unit",
                  category: metricForm.category || "Category",
                  description: metricForm.description || "Description",
                  iconName: metricForm.icon || "Leaf",
                  sortOrder: metricForm.position || 0,
                  isActive: metricForm.isActive,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }}
                index={0}
              />
            </div>
          </div>
        </div>
      )}

      {/* Metric Icon Picker */}
      <IconPicker
        isOpen={showMetricIconPicker}
        onClose={() => setShowMetricIconPicker(false)}
        onSelect={(iconName) => setMetricForm((prev) => ({ ...prev, icon: iconName }))}
        currentIcon={metricForm.icon}
        title="Select Metric Icon"
      />
    </TabsContent>
  );
}
