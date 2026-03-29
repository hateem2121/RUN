import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Palette,
  Plus,
  Search,
  X,
} from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormFieldValue } from "../shared/types";

interface CustomizationSEOSectionProps {
  formData: {
    customizationOptions: string[];
    metaTitle: string;
    metaDescription: string;
  };
  formErrors: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: (field: string, value: ProductFormFieldValue) => void;
  generateMetaTitle: () => void;
  generateMetaDescription: () => void;
}

export const CustomizationSEOSection = memo(function CustomizationSEOSection({
  formData,
  formErrors,
  isOpen,
  onToggle,
  onInputChange,
  generateMetaTitle,
  generateMetaDescription,
}: CustomizationSEOSectionProps) {
  // Calculate completion status
  const recommendedFields = ["metaTitle", "metaDescription"];
  const completedFields = recommendedFields.filter((field) => {
    const value = formData[field as keyof typeof formData];
    return typeof value === "string" ? value.trim().length > 0 : !!value;
  });
  const completionRate = (completedFields.length / recommendedFields.length) * 100;

  const addCustomizationOption = () => {
    onInputChange("customizationOptions", [...(formData.customizationOptions || []), ""]);
  };

  const updateCustomizationOption = (index: number, value: string) => {
    const updated = [...(formData.customizationOptions || [])];
    updated[index] = value;
    onInputChange("customizationOptions", updated);
  };

  const removeCustomizationOption = (index: number) => {
    const updated = (formData.customizationOptions || []).filter((_, i) => i !== index);
    onInputChange("customizationOptions", updated);
  };

  const addPresetCustomizationOption = (option: string) => {
    if (!(formData.customizationOptions || []).includes(option)) {
      onInputChange("customizationOptions", [...(formData.customizationOptions || []), option]);
    }
  };

  const presetOptions = [
    "Custom logo placement",
    "Color customization",
    "Size modifications",
    "Material upgrades",
    "Personalized embroidery",
    "Custom patterns",
    "Bulk quantity discounts",
    "Private labeling",
    "Custom packaging",
    "Specialized fits",
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-indigo-600" />
          <div className="text-left">
            <h3 className="font-semibold text-white">Customization & SEO</h3>
            <p className="text-[#68869A] text-sm">
              {(formData.customizationOptions || []).length} customization options, SEO optimization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completionRate === 100 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : completionRate > 0 ? (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-white/20" />
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-[#68869A]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#68869A]" />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-6 px-4 pb-4">
        {/* Customization Options */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="font-medium text-white/80 text-sm">Customization Options</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCustomizationOption}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Option
            </Button>
          </div>

          {/* Preset Options */}
          <div className="mb-4">
            <h4 className="mb-2 font-medium text-[#68869A] text-sm">Quick Add Options</h4>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => addPresetCustomizationOption(option)}
                  disabled={(formData.customizationOptions || []).includes(option)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    (formData.customizationOptions || []).includes(option)
                      ? "border-white/10 bg-white/[0.05] text-[#68869A]/70"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:border-indigo-400 hover:bg-indigo-500/10"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Options */}
          <div className="space-y-2">
            {(formData.customizationOptions || []).map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateCustomizationOption(index, e.target.value)}
                  placeholder="Enter customization option"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomizationOption(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(formData.customizationOptions || []).length === 0 && (
              <div className="py-6 text-center text-[#68869A]">
                <Palette className="mx-auto mb-2 h-12 w-12 text-[#68869A]/70" />
                <p>No customization options added yet</p>
                <p className="text-sm">
                  Add options to showcase your B2B customization capabilities.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SEO Optimization */}
        <div className="border-t pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-white">SEO Optimization</h3>
          </div>

          {/* Meta Title */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="metaTitle" className="font-medium text-white/80 text-sm">
                Meta Title
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={generateMetaTitle}>
                Generate
              </Button>
            </div>
            <Input
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => onInputChange("metaTitle", e.target.value)}
              className={`${formErrors.metaTitle ? "border-red-500" : ""}`}
              placeholder="Enter SEO-optimized title"
              maxLength={60}
            />
            {formErrors.metaTitle && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.metaTitle}</p>
            )}
            <p className="mt-1 text-[#68869A] text-sm">
              {formData.metaTitle.length}/60 characters
              {formData.metaTitle.length > 60 && (
                <span className="ml-2 text-red-600">Too long for optimal SEO</span>
              )}
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="metaDescription" className="font-medium text-white/80 text-sm">
                Meta Description
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={generateMetaDescription}>
                Generate
              </Button>
            </div>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => onInputChange("metaDescription", e.target.value)}
              className={`${formErrors.metaDescription ? "border-red-500" : ""}`}
              placeholder="Enter SEO-optimized description"
              rows={3}
              maxLength={160}
            />
            {formErrors.metaDescription && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.metaDescription}</p>
            )}
            <p className="mt-1 text-[#68869A] text-sm">
              {formData.metaDescription.length}/160 characters
              {formData.metaDescription.length > 160 && (
                <span className="ml-2 text-red-600">Too long for optimal SEO</span>
              )}
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
