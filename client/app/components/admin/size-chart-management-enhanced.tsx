import type { InsertSizeChart, SizeChart } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Edit, Eye, Flag, Plus, RotateCcw, Ruler, X } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

const getRegionFlag = (region: string) => {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    EU: "🇪🇺",
    UK: "🇬🇧",
    CN: "🇨🇳",
    JP: "🇯🇵",
    INTL: "🌍",
  };
  return flags[region] || "🏁";
};

const validateMeasurements = (measurements: Record<string, unknown>) => {
  let incomplete = 0;
  let total = 0;

  Object.values(measurements).forEach((sizeData: unknown) => {
    if (sizeData && typeof sizeData === "object") {
      Object.values(sizeData as Record<string, unknown>).forEach((value) => {
        total++;
        if (!value || value === "") {
          incomplete++;
        }
      });
    }
  });

  const completeness = total > 0 ? Math.round(((total - incomplete) / total) * 100) : 0;
  return { incomplete, total, completeness };
};

interface SizeChartListProps {
  isLoading: boolean;
  sizeCharts: SizeChart[] | undefined;
  onPreview: (chart: SizeChart) => void;
  onEdit: (chart: SizeChart) => void;
  onDelete: (id: number) => void;
}

const SizeChartList = ({
  isLoading,
  sizeCharts,
  onPreview,
  onEdit,
  onDelete,
}: SizeChartListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-24 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (!sizeCharts || sizeCharts.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">
        <Ruler className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
        <p className="font-medium">No size charts created yet</p>
        <p className="text-sm">Create your first size chart to get started</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 space-y-4 overflow-y-auto">
      {sizeCharts.map((chart) => {
        const validation = validateMeasurements(chart.measurements || {});
        return (
          <div
            key={chart.id}
            className="group rounded-lg border border-neutral-200 p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="truncate font-medium text-neutral-900">{chart.name}</h4>
                  {!chart.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <span>{getRegionFlag(chart.region || "")}</span>
                    {chart.region}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {chart.type
                      ? chart.type.charAt(0).toUpperCase() + chart.type.slice(1)
                      : "No Type"}
                  </Badge>
                </div>

                {/* Measurement validation */}
                {validation.total > 0 && (
                  <div className="mb-2">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-neutral-600 text-xs">Completeness:</span>
                      {validation.incomplete > 0 && (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    <Progress value={validation.completeness} className="h-2" />
                    <p className="mt-1 text-neutral-500 text-xs">
                      {validation.total - validation.incomplete}/{validation.total} measurements
                      complete
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreview(chart)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(chart)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              </div>
              <DeleteConfirmationDialog
                onConfirm={() => onDelete(chart.id)}
                title="Delete Size Chart"
                description={`Are you sure you want to delete "${chart.name}"? This action cannot be undone and may affect products using this size chart.`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function SizeChartManagementEnhanced() {
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    type: "",
    description: "",
    measurements: {} as Record<string, any>,
    isActive: true,
  });

  const [measurementSize, setMeasurementSize] = useState("");
  const [measurementKey, setMeasurementKey] = useState("");
  const [measurementValue, setMeasurementValue] = useState("");
  const [editingChart, setEditingChart] = useState<SizeChart | null>(null);
  const [previewChart, setPreviewChart] = useState<SizeChart | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");

  const { toast } = useToast();

  const { data: sizeCharts, isPending: isLoading } = useQuery<SizeChart[]>({
    queryKey: ["/api/size-charts"],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      region: "",
      type: "",
      description: "",
      measurements: {},
      isActive: true,
    });
    setEditingChart(null);
  };

  const createSizeChartMutation = useMutation({
    mutationFn: async (data: InsertSizeChart) => {
      return await apiRequest("/api/size-charts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/size-charts"] });
      toast({
        title: "Success",
        description: "Size chart created successfully",
      });
      resetForm();
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create size chart",
        variant: "destructive",
      });
    },
  });

  const updateSizeChartMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSizeChart> }) => {
      return await apiRequest(`/api/size-charts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/size-charts"] });
      toast({
        title: "Success",
        description: "Size chart updated successfully",
      });
      setEditingChart(null);
      resetForm();
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update size chart",
        variant: "destructive",
      });
    },
  });

  const deleteSizeChartMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/size-charts/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/size-charts"] });
      toast({
        title: "Success",
        description: "Size chart deleted successfully",
      });
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete size chart",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChart) {
      updateSizeChartMutation.mutate({ id: editingChart.id, data: formData });
    } else {
      createSizeChartMutation.mutate(formData);
    }
  };

  const handleEdit = (chart: SizeChart) => {
    setEditingChart(chart);
    setFormData({
      name: chart.name,
      region: chart.region || "",
      type: chart.type || "",
      description: chart.description || "",
      measurements: chart.measurements || {},
      isActive: Boolean(chart.isActive),
    });
  };

  const handlePreview = (chart: SizeChart) => {
    setPreviewChart(chart);
    setIsPreviewDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteSizeChartMutation.mutate(id);
  };

  const addMeasurement = () => {
    if (!measurementSize || !measurementKey || !measurementValue) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [measurementSize]: {
          ...prev.measurements[measurementSize],
          [measurementKey]: measurementValue,
        },
      },
    }));

    setMeasurementKey("");
    setMeasurementValue("");
  };

  const removeMeasurement = (size: string, key: string) => {
    setFormData((prev) => {
      const newMeasurements = { ...prev.measurements };
      if (newMeasurements[size]) {
        delete newMeasurements[size][key];
        if (Object.keys(newMeasurements[size]).length === 0) {
          delete newMeasurements[size];
        }
      }
      return {
        ...prev,
        measurements: newMeasurements,
      };
    });
  };

  const loadTemplate = (chartType: string, region: string) => {
    // Normalize chart type to lowercase for template matching
    const normalizedType = chartType.toLowerCase().trim();
    const sizes = standardSizes[normalizedType as keyof typeof standardSizes];
    const measurements = commonMeasurements[normalizedType as keyof typeof commonMeasurements];

    // Check if template exists for this type
    if (!sizes || !measurements) {
      toast({
        title: "No Template Available",
        description: `No predefined template for "${chartType}". You can manually add measurements below.`,
        variant: "default",
      });
      return;
    }

    const newMeasurements: Record<string, any> = {};
    sizes.forEach((size) => {
      newMeasurements[size] = {};
      measurements.forEach((measurement) => {
        newMeasurements[size][measurement] = "";
      });
    });

    setFormData((prev) => ({
      ...prev,
      name: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} - ${region}`,
      measurements: newMeasurements,
    }));

    toast({
      title: "Template Loaded",
      description: `Template for ${chartType} has been loaded with standard sizes and measurements.`,
    });
  };

  const regions = [
    { value: "US", label: "United States" },
    { value: "EU", label: "European Union" },
    { value: "UK", label: "United Kingdom" },
    { value: "CN", label: "China" },
    { value: "JP", label: "Japan" },
    { value: "INTL", label: "International" },
  ];

  const standardSizes = {
    apparel: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    footwear: ["6", "7", "8", "9", "10", "11", "12"],
    accessories: ["S", "M", "L"],
    headwear: ["S", "M", "L", "XL"],
  };

  const commonMeasurements = {
    apparel: ["Chest", "Waist", "Hips", "Shoulder", "Sleeve", "Length"],
    footwear: ["Length", "Width", "EU Size", "UK Size"],
    accessories: ["Length", "Width", "Circumference"],
    headwear: ["Circumference", "Depth"],
  };

  // Helper function to check if a measurement type should display cm units
  const isCentimeterMeasurement = (measurementType: string): boolean => {
    const type = measurementType.toLowerCase();
    // List of measurement types that use centimeters
    const cmTypes = [
      "chest",
      "waist",
      "hips",
      "shoulder",
      "sleeve",
      "length",
      "width",
      "circumference",
      "depth",
      "height",
      "inseam",
      "rise",
      "thigh",
      "knee",
      "calf",
      "ankle",
      "neck",
      "arm",
      "leg",
      "torso",
      "back",
    ];
    // Don't add cm to size numbers (EU Size, UK Size, US Size, etc.)
    if (type.includes("size")) {
      return false;
    }
    // Check if it matches any cm measurement type
    return cmTypes.some((cmType) => type.includes(cmType));
  };

  const renderMeasurementTable = (measurements: Record<string, any>) => {
    if (!measurements || Object.keys(measurements).length === 0) {
      return <p className="py-4 text-center text-neutral-500">No measurements defined</p>;
    }

    const sizes = Object.keys(measurements);
    const firstSize = sizes[0];
    const measurementTypes =
      firstSize && measurements[firstSize] && typeof measurements[firstSize] === "object"
        ? Object.keys(measurements[firstSize])
        : [];

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Size</TableHead>
              {measurementTypes.map((type) => (
                <TableHead key={type} className="font-medium">
                  {type}
                  {isCentimeterMeasurement(type) ? " (cm)" : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sizes.map((size) => (
              <TableRow key={size}>
                <TableCell className="font-medium">{size}</TableCell>
                {measurementTypes.map((type) => (
                  <TableCell key={type}>
                    {measurements[size]?.[type] ? (
                      <>
                        {measurements[size][type]}
                        {isCentimeterMeasurement(type) && (
                          <span className="ml-1 text-neutral-500 text-xs">cm</span>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold font-neue-stance text-3xl text-neutral-900">
            Size Chart Management
          </h1>
          <p className="mt-2 text-neutral-600">
            Create and manage size charts for different regions and product categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="unit-toggle" className="font-medium text-sm">
              Units:
            </Label>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${unitSystem === "metric" ? "font-medium" : "text-neutral-500"}`}
              >
                Metric
              </span>
              <Switch
                id="unit-toggle"
                checked={unitSystem === "imperial"}
                onCheckedChange={(checked) => setUnitSystem(checked ? "imperial" : "metric")}
              />
              <span
                className={`text-sm ${unitSystem === "imperial" ? "font-medium" : "text-neutral-500"}`}
              >
                Imperial
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Size Chart Form */}
        <div className="xl:col-span-2">
          <Card className="border-2">
            <CardHeader className="border-b bg-linear-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2 font-neue-stance">
                <Ruler className="h-5 w-5 text-blue-600" />
                {editingChart ? "Edit Size Chart" : "Create New Size Chart"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Chart Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter size chart name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            <div className="flex items-center gap-2">
                              <span>{getRegionFlag(region.value)}</span>
                              <span>{region.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="type">Chart Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      placeholder="Enter chart type (e.g., Apparel, Footwear)"
                      maxLength={100}
                      required
                      data-testid="input-chart-type"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        formData.type &&
                        formData.region &&
                        loadTemplate(formData.type, formData.region)
                      }
                      disabled={!formData.type || !formData.region}
                      className="w-full"
                      data-testid="button-load-template"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Load Template
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter description for this size chart"
                    rows={3}
                  />
                </div>

                {/* Measurement Builder */}
                <div className="border-t pt-4">
                  <Label className="mb-4 block font-medium text-base">Measurements</Label>
                  <p className="mb-3 text-neutral-600 text-sm">
                    Enter measurements in centimeters (cm). For size numbers (e.g., EU Size, UK
                    Size), enter the numeric value only.
                  </p>
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                      <Label htmlFor="measurement-size" className="mb-1 text-neutral-600 text-xs">
                        Size
                      </Label>
                      <Input
                        id="measurement-size"
                        placeholder="e.g., M, L, XL"
                        value={measurementSize}
                        onChange={(e) => setMeasurementSize(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="measurement-key" className="mb-1 text-neutral-600 text-xs">
                        Measurement Type
                      </Label>
                      <Input
                        id="measurement-key"
                        placeholder="e.g., Chest, Waist"
                        value={measurementKey}
                        onChange={(e) => setMeasurementKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="measurement-value" className="mb-1 text-neutral-600 text-xs">
                        Value
                      </Label>
                      <Input
                        id="measurement-value"
                        placeholder="Enter value"
                        value={measurementValue}
                        onChange={(e) => setMeasurementValue(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={addMeasurement}
                        disabled={!measurementSize || !measurementKey || !measurementValue}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Current Measurements Display */}
                  {Object.keys(formData.measurements).length > 0 && (
                    <div className="space-y-3">
                      {Object.entries(formData.measurements).map(([size, measurements]) => (
                        <div key={size} className="rounded-lg bg-neutral-50 p-3">
                          <h4 className="mb-2 font-medium">{size}</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(measurements as Record<string, any>).map(
                              ([key, value]) => (
                                <Badge
                                  key={key}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {key}: {value}
                                  {isCentimeterMeasurement(key) ? " cm" : ""}
                                  <button
                                    type="button"
                                    title="Remove measurement"
                                    onClick={() => removeMeasurement(size, key)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: Boolean(checked),
                      }))
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex justify-end space-x-4 border-t pt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createSizeChartMutation.isPending || updateSizeChartMutation.isPending
                    }
                  >
                    {(() => {
                      if (createSizeChartMutation.isPending || updateSizeChartMutation.isPending) {
                        return editingChart ? "Updating..." : "Creating...";
                      }
                      return editingChart ? "Update Size Chart" : "Create Size Chart";
                    })()}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Size Charts List */}
        <div>
          <Card className="border-2">
            <CardHeader className="border-b bg-linear-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center gap-2 font-neue-stance">
                <Flag className="h-5 w-5 text-green-600" />
                Size Charts ({sizeCharts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <SizeChartList
                isLoading={isLoading}
                sizeCharts={sizeCharts}
                onPreview={handlePreview}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent contentType="default">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Size Chart Preview: {previewChart?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-viewport-60 overflow-y-auto pr-2">
            {previewChart && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>{getRegionFlag(previewChart.region || "")}</span>
                    {previewChart.region}
                  </Badge>
                  <Badge variant="outline">
                    {previewChart.type
                      ? previewChart.type.charAt(0).toUpperCase() + previewChart.type.slice(1)
                      : "Unknown"}
                  </Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-sm">View in:</Label>
                    <Switch
                      checked={unitSystem === "imperial"}
                      onCheckedChange={(checked) => setUnitSystem(checked ? "imperial" : "metric")}
                    />
                    <span className="font-medium text-sm">
                      {unitSystem === "metric" ? "Metric" : "Imperial"}
                    </span>
                  </div>
                </div>
                {previewChart.description && (
                  <p className="text-neutral-600">{previewChart.description}</p>
                )}
                <div className="rounded-lg border p-4">
                  {renderMeasurementTable(previewChart.measurements || {})}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
