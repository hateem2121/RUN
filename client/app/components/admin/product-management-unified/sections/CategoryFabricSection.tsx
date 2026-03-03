import type { Category, Fabric, Fiber, SizeChart } from "@shared/index";
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Tag } from "lucide-react";
import { memo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FabricComposition,
  FabricWithCompositions,
  FiberCompositionItem,
  ProductFormFieldValue,
} from "../shared/types";

interface CategoryFabricSectionProps {
  formData: {
    categoryId: number | null;
    fabricId: number | null;
    sizeChartId: number | null;
    selectedFiberComposition: string | null;
  };
  formErrors: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: (field: string, value: ProductFormFieldValue) => void;
  categories: Category[];
  fabrics: Fabric[];
  sizeCharts: SizeChart[];
  fibers?: Fiber[];
}

export const CategoryFabricSection = memo(function CategoryFabricSection({
  formData,
  formErrors,
  isOpen,
  onToggle,
  onInputChange,
  categories,
  fabrics,
  sizeCharts,
  fibers = [],
}: CategoryFabricSectionProps) {
  // Calculate completion status
  const recommendedFields = ["categoryId", "fabricId"];
  const completedFields = recommendedFields.filter((field) => {
    const value = formData[field as keyof typeof formData];
    return value !== null && value !== undefined;
  });
  const completionRate = (completedFields.length / recommendedFields.length) * 100;

  // Get selected fabric for fiber composition display
  const selectedFabric = formData.fabricId
    ? (fabrics.find((f) => f.id === formData.fabricId) as FabricWithCompositions | undefined)
    : null;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-background">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-purple-600" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Category & Fabric</h3>
            <p className="text-muted-foreground text-sm">
              {completedFields.length} of {recommendedFields.length} recommended fields completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completionRate === 100 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : completionRate > 0 ? (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-border/50" />
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Category Selection */}
          <div>
            <Label htmlFor="categoryId" className="font-medium text-foreground/80 text-sm">
              Category
            </Label>
            <Select
              value={formData.categoryId?.toString() || ""}
              onValueChange={(value) =>
                onInputChange("categoryId", value ? parseInt(value, 10) : null)
              }
            >
              <SelectTrigger className={`mt-1 ${formErrors.categoryId ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto z-modal-nested">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.categoryId && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.categoryId}</p>
            )}
          </div>

          {/* Fabric Selection */}
          <div>
            <Label htmlFor="fabricId" className="font-medium text-foreground/80 text-sm">
              Fabric
            </Label>
            <Select
              value={formData.fabricId?.toString() || ""}
              onValueChange={(value) =>
                onInputChange("fabricId", value ? parseInt(value, 10) : null)
              }
            >
              <SelectTrigger className={`mt-1 ${formErrors.fabricId ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select fabric" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto z-modal-nested">
                {fabrics.map((fabric) => (
                  <SelectItem key={fabric.id} value={fabric.id.toString()}>
                    {fabric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.fabricId && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.fabricId}</p>
            )}
          </div>
        </div>

        {/* Size Chart Selection */}
        <div>
          <Label htmlFor="sizeChartId" className="font-medium text-foreground/80 text-sm">
            Size Chart
          </Label>
          <Select
            value={formData.sizeChartId?.toString() || ""}
            onValueChange={(value) =>
              onInputChange("sizeChartId", value ? parseInt(value, 10) : null)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select size chart (optional)" />
            </SelectTrigger>
            <SelectContent className="z-modal-critical">
              {sizeCharts.length === 0 ? (
                <SelectItem value="no-charts" disabled>
                  No size charts available
                </SelectItem>
              ) : (
                sizeCharts.map((sizeChart) => (
                  <SelectItem key={sizeChart.id} value={sizeChart.id.toString()}>
                    {sizeChart.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {sizeCharts.length === 0 && (
            <p className="mt-1 text-muted-foreground text-xs">
              Add size charts via the Size Charts module to assign them to products
            </p>
          )}
        </div>

        {/* Fiber Composition Display */}
        {selectedFabric?.compositions && selectedFabric.compositions.length > 0 && (
          <div className="rounded-lg bg-background p-4">
            <h4 className="mb-3 font-medium text-foreground">Available Fiber Compositions</h4>
            <div className="space-y-2">
              {selectedFabric.compositions.map((composition: FabricComposition, index: number) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-white"
                >
                  <input
                    type="radio"
                    name="fiberComposition"
                    value={composition.name}
                    checked={formData.selectedFiberComposition === composition.name}
                    onChange={() => onInputChange("selectedFiberComposition", composition.name)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{composition.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {composition.fibers
                        ?.map((fiber: FiberCompositionItem) => {
                          const fiberData = fibers.find((f) => f.id === fiber.fiberId);
                          const fiberName = fiberData?.name || `Fiber ${fiber.fiberId}`;
                          return `${fiber.percentage}% ${fiberName}`;
                        })
                        .join(", ")}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Selected Composition Details */}
            {formData.selectedFiberComposition &&
              (() => {
                const selectedComp = selectedFabric.compositions?.find(
                  (c: FabricComposition) => c.name === formData.selectedFiberComposition,
                );
                return selectedComp ? (
                  <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <div className="mb-1 font-medium text-purple-900 text-sm">
                      Selected: {formData.selectedFiberComposition}
                    </div>
                    <div className="text-purple-700 text-sm">
                      Properties: Standard performance characteristics
                    </div>
                  </div>
                ) : null;
              })()}

            {!formData.selectedFiberComposition &&
              (() => {
                const hasCompositions =
                  selectedFabric.compositions && selectedFabric.compositions.length > 0;
                return hasCompositions ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-amber-800 text-sm">
                      💡 Select a fiber composition to optimize product specifications and
                      performance characteristics.
                    </div>
                  </div>
                ) : null;
              })()}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});
