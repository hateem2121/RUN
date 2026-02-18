import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { memo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormFieldValue } from "../shared/types";

interface BasicInfoSectionProps {
  formData: {
    name: string;
    sku: string;
    description: string;
    shortDescription: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
    isFeatured: boolean;
  };
  formErrors: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: (field: string, value: ProductFormFieldValue) => void;
  generateSlug: () => void;
}

export const BasicInfoSection = memo(function BasicInfoSection({
  formData,
  formErrors,
  isOpen,
  onToggle,
  onInputChange,
  generateSlug,
}: BasicInfoSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-background">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Basic Information</h3>
            <p className="text-muted-foreground text-sm">Product name, description, and details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Product Name */}
          <div>
            <Label htmlFor="name" className="font-medium text-foreground/80 text-sm">
              Product Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              className={`mt-1 ${formErrors.name ? "border-red-500" : ""}`}
              placeholder="Enter product name"
            />
            {formErrors.name && <p className="mt-1 text-red-600 text-sm">{formErrors.name}</p>}
          </div>

          {/* SKU */}
          <div>
            <Label htmlFor="sku" className="font-medium text-foreground/80 text-sm">
              SKU *
            </Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => onInputChange("sku", e.target.value)}
              className={`mt-1 ${formErrors.sku ? "border-red-500" : ""}`}
              placeholder="Enter SKU"
            />
            {formErrors.sku && <p className="mt-1 text-red-600 text-sm">{formErrors.sku}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="font-medium text-foreground/80 text-sm">
            Description *
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            className={`mt-1 ${formErrors.description ? "border-red-500" : ""}`}
            placeholder="Enter detailed product description"
            rows={4}
          />
          {formErrors.description && (
            <p className="mt-1 text-red-600 text-sm">{formErrors.description}</p>
          )}
          <p className="mt-1 text-muted-foreground text-sm">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Short Description */}
        <div>
          <Label htmlFor="shortDescription" className="font-medium text-foreground/80 text-sm">
            Short Description
          </Label>
          <Textarea
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => onInputChange("shortDescription", e.target.value)}
            className="mt-1"
            placeholder="Brief product summary for listings"
            rows={2}
          />
          <p className="mt-1 text-muted-foreground text-sm">
            {formData.shortDescription.length}/200 characters
          </p>
        </div>

        {/* Slug and Sort Order */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="slug" className="font-medium text-foreground/80 text-sm">
              URL Slug
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => onInputChange("slug", e.target.value)}
                placeholder="product-url-slug"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="rounded-md bg-muted px-3 py-2 text-foreground/80 text-sm transition-colors hover:bg-muted/20"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="sortOrder" className="font-medium text-foreground/80 text-sm">
              Sort Order
            </Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => onInputChange("sortOrder", parseInt(e.target.value, 10) || 0)}
              className="mt-1"
              placeholder="0"
            />
          </div>
        </div>

        {/* Status Toggles */}
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => onInputChange("isActive", e.target.checked)}
              className="rounded border-border/50 text-blue-600 focus:ring-ring"
            />
            <span className="font-medium text-foreground/80 text-sm">Active</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => onInputChange("isFeatured", e.target.checked)}
              className="rounded border-border/50 text-blue-600 focus:ring-ring"
            />
            <span className="font-medium text-foreground/80 text-sm">Featured</span>
          </label>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
