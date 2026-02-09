import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { memo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFormFieldValue } from "../shared/types";

interface SpecificationsSectionProps {
  formData: {
    technicalSpecs: Record<string, string>;
    specifications: string[];
    careInstructions: string[];
    tags: string[];
    minimumOrderQuantity: string;
    leadTime: string;
    customWeight: string;
    customFit: string;
  };
  formErrors: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: (field: string, value: ProductFormFieldValue) => void;
}

const SpecificationsSection = memo(function SpecificationsSection({
  formData,
  formErrors,
  isOpen,
  onToggle,
  onInputChange,
}: SpecificationsSectionProps) {
  // Refs for Technical Specifications input fields
  const techSpecKeyRef = useRef<HTMLInputElement>(null);
  const techSpecValueRef = useRef<HTMLInputElement>(null);

  // Calculate completion status
  const recommendedFields = [
    "specifications",
    "minimumOrderQuantity",
    "leadTime",
    "customWeight",
    "customFit",
  ];
  const completedFields = recommendedFields.filter((field) => {
    const value = formData[field as keyof typeof formData];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return typeof value === "string" ? value.trim().length > 0 : !!value;
  });
  const completionRate = (completedFields.length / recommendedFields.length) * 100;

  // Helper to ensure specifications is always an array of strings
  const getSpecificationsArray = (): string[] => {
    if (Array.isArray(formData.specifications)) {
      // Ensure each element is a string
      return formData.specifications.map((spec) => {
        if (typeof spec === "string") {
          return spec;
        }
        if (spec === null || spec === undefined) {
          return "";
        }
        // Convert any non-string to string (defensive)
        return String(spec);
      });
    }
    // Convert object to array if needed (backward compatibility)
    if (formData.specifications && typeof formData.specifications === "object") {
      const values = Object.values(formData.specifications as Record<string, unknown>);
      return values.map((v) => (typeof v === "string" ? v : String(v)));
    }
    return [];
  };

  const addSpecification = () => {
    const current = getSpecificationsArray();
    const updated = [...current, ""];
    onInputChange("specifications", updated);
  };

  const updateSpecification = (index: number, value: string) => {
    const updated = [...getSpecificationsArray()];
    updated[index] = value;
    onInputChange("specifications", updated);
  };

  const removeSpecification = (index: number) => {
    const updated = getSpecificationsArray().filter((_, i) => i !== index);
    onInputChange("specifications", updated);
  };

  const addCareInstruction = () => {
    onInputChange("careInstructions", [...(formData.careInstructions || []), ""]);
  };

  const updateCareInstruction = (index: number, value: string) => {
    const updated = [...(formData.careInstructions || [])];
    updated[index] = value;
    onInputChange("careInstructions", updated);
  };

  const removeCareInstruction = (index: number) => {
    const updated = (formData.careInstructions || []).filter((_, i) => i !== index);
    onInputChange("careInstructions", updated);
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !(formData.tags || []).includes(tag.trim())) {
      onInputChange("tags", [...(formData.tags || []), tag.trim()]);
    }
  };

  const removeTag = (index: number) => {
    const updated = (formData.tags || []).filter((_, i) => i !== index);
    onInputChange("tags", updated);
  };

  const addTechnicalSpec = (key: string, value: string) => {
    if (key.trim() && value.trim()) {
      onInputChange("technicalSpecs", {
        ...(formData.technicalSpecs || {}),
        [key.trim()]: value.trim(),
      });
    }
  };

  const removeTechnicalSpec = (key: string) => {
    const updated = { ...(formData.technicalSpecs || {}) };
    delete updated[key];
    onInputChange("technicalSpecs", updated);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-background">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Technical Specifications</h3>
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

      <CollapsibleContent className="mt-4 space-y-6 px-4 pb-4">
        {/* Custom Weight & Fit - Priority Section */}
        <div>
          <Label className="mb-3 block font-medium text-foreground/80 text-sm">
            Weight & Fit Specifications
          </Label>
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 md:grid-cols-2">
            <div>
              <Label htmlFor="customWeight" className="font-medium text-foreground/80 text-sm">
                Custom Weight
              </Label>
              <Input
                id="customWeight"
                value={formData.customWeight}
                onChange={(e) => onInputChange("customWeight", e.target.value)}
                className={`mt-1 ${formErrors.customWeight ? "border-red-500" : ""}`}
                placeholder="e.g., 120g/m², 180 GSM"
              />
              {formErrors.customWeight && (
                <p className="mt-1 text-red-600 text-sm">{formErrors.customWeight}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customFit" className="font-medium text-foreground/80 text-sm">
                Custom Fit
              </Label>
              <Input
                id="customFit"
                value={formData.customFit}
                onChange={(e) => onInputChange("customFit", e.target.value)}
                className={`mt-1 ${formErrors.customFit ? "border-red-500" : ""}`}
                placeholder="e.g., Athletic Slim, Relaxed Fit"
              />
              {formErrors.customFit && (
                <p className="mt-1 text-red-600 text-sm">{formErrors.customFit}</p>
              )}
            </div>
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            These values will be displayed prominently in the product specifications section
          </p>
        </div>

        {/* B2B Details */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label
              htmlFor="minimumOrderQuantity"
              className="font-medium text-foreground/80 text-sm"
            >
              Minimum Order Quantity
            </Label>
            <Input
              id="minimumOrderQuantity"
              value={formData.minimumOrderQuantity}
              onChange={(e) => onInputChange("minimumOrderQuantity", e.target.value)}
              className={`mt-1 ${formErrors.minimumOrderQuantity ? "border-red-500" : ""}`}
              placeholder="e.g., 100 pieces"
            />
            {formErrors.minimumOrderQuantity && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.minimumOrderQuantity}</p>
            )}
          </div>

          <div>
            <Label htmlFor="leadTime" className="font-medium text-foreground/80 text-sm">
              Lead Time
            </Label>
            <Input
              id="leadTime"
              value={formData.leadTime}
              onChange={(e) => onInputChange("leadTime", e.target.value)}
              className={`mt-1 ${formErrors.leadTime ? "border-red-500" : ""}`}
              placeholder="e.g., 2-3 weeks"
            />
            {formErrors.leadTime && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.leadTime}</p>
            )}
          </div>
        </div>

        {/* Product Specifications */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="font-medium text-foreground/80 text-sm">Product Specifications</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
              <Plus className="mr-2 h-4 w-4" />
              Add Specification
            </Button>
          </div>
          <div className="space-y-2">
            {getSpecificationsArray().map((spec, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={typeof spec === "string" ? spec : ""}
                  onChange={(e) => updateSpecification(index, e.target.value)}
                  placeholder="Enter specification"
                  className="flex-1"
                  data-testid={`input-specification-${index}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSpecification(index)}
                  data-testid={`button-remove-specification-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {getSpecificationsArray().length === 0 && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No specifications added yet
              </div>
            )}
          </div>
        </div>

        {/* Technical Specifications */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="font-medium text-foreground/80 text-sm">
              Technical Specifications
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (techSpecKeyRef.current && techSpecValueRef.current) {
                  const key = techSpecKeyRef.current.value.trim();
                  const value = techSpecValueRef.current.value.trim();
                  if (key && value) {
                    addTechnicalSpec(key, value);
                    techSpecKeyRef.current.value = "";
                    techSpecValueRef.current.value = "";
                    techSpecKeyRef.current.focus();
                  }
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Specification
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(formData.technicalSpecs || {}).map(([key, value]) => (
              <div key={key} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input value={key} readOnly className="bg-background" />
                <div className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(e) => addTechnicalSpec(key, e.target.value)}
                    placeholder="Value"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTechnicalSpec(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Input
                ref={techSpecKeyRef}
                placeholder="Specification name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (techSpecKeyRef.current && techSpecValueRef.current) {
                      const key = techSpecKeyRef.current.value.trim();
                      const value = techSpecValueRef.current.value.trim();
                      if (key && value) {
                        addTechnicalSpec(key, value);
                        techSpecKeyRef.current.value = "";
                        techSpecValueRef.current.value = "";
                        techSpecKeyRef.current.focus();
                      }
                    }
                  }
                }}
              />
              <Input
                ref={techSpecValueRef}
                placeholder="Value"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (techSpecKeyRef.current && techSpecValueRef.current) {
                      const key = techSpecKeyRef.current.value.trim();
                      const value = techSpecValueRef.current.value.trim();
                      if (key && value) {
                        addTechnicalSpec(key, value);
                        techSpecKeyRef.current.value = "";
                        techSpecValueRef.current.value = "";
                        techSpecKeyRef.current.focus();
                      }
                    }
                  }
                }}
              />
            </div>
            {Object.keys(formData.technicalSpecs || {}).length === 0 && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No technical specifications added yet. Enter name and value above, then press Enter
                or click Add.
              </div>
            )}
          </div>
        </div>

        {/* Care Instructions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="font-medium text-foreground/80 text-sm">Care Instructions</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCareInstruction}>
              <Plus className="mr-2 h-4 w-4" />
              Add Instruction
            </Button>
          </div>
          <div className="space-y-2">
            {(formData.careInstructions || []).map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={instruction}
                  onChange={(e) => updateCareInstruction(index, e.target.value)}
                  placeholder="Enter care instruction"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCareInstruction(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(formData.careInstructions || []).length === 0 && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No care instructions added yet
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label className="mb-3 block font-medium text-foreground/80 text-sm">Product Tags</Label>
          <div className="mb-3 flex flex-wrap gap-2">
            {(formData.tags || []).map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => removeTag(index)}
                />
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Add tags (press Enter)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
          />
          <p className="mt-1 text-muted-foreground text-sm">
            Press Enter to add tags. Use tags for categorization and search optimization.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

// Default export for lazy loading compatibility
export default SpecificationsSection;
