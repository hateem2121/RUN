import type { Accessory, Category, Certificate, Fabric, Product, SizeChart } from "@shared/index";
import {
  AlertCircle,
  AlertTriangle,
  Box,
  CheckCircle,
  ExternalLink,
  ImageIcon,
  Info,
  Package,
  Video,
} from "lucide-react";
import type React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ValidationItem {
  level: "error" | "warning" | "success";
  message: string;
}

interface ReviewPublishTabProps {
  formData: Partial<Product>;
  categories: Category[];
  fabrics: Fabric[];
  certificates: Certificate[];
  accessories: Accessory[];
  sizeCharts: SizeChart[];
  onSubmit: () => void;
  isLoading: boolean;
  isEditing: boolean;
}

export const ReviewPublishTab: React.FC<ReviewPublishTabProps> = ({
  formData,
  categories,
  fabrics,
  // certificates,
  // accessories,
  sizeCharts,
  onSubmit,
  isLoading,
  isEditing,
}) => {
  // Validation logic
  const validationItems: ValidationItem[] = [
    // Required field validations
    {
      level: formData.name ? "success" : "error",
      message: formData.name ? "Product name provided" : "Product name is required",
    },
    {
      level: formData.sku ? "success" : "error",
      message: formData.sku ? "SKU provided" : "SKU is required",
    },
    {
      level: formData.shortDescription ? "success" : "error",
      message: formData.shortDescription
        ? "Short description provided"
        : "Short description is required",
    },
    // Optional field validations
    {
      level: formData.description ? "success" : "warning",
      message: formData.description
        ? "Detailed description provided"
        : "Consider adding a detailed description",
    },
    {
      level: formData.categoryId ? "success" : "warning",
      message: formData.categoryId ? "Category assigned" : "Consider assigning a category",
    },
    // Media validations
    {
      level: formData.imageIds && formData.imageIds.length > 0 ? "success" : "warning",
      message:
        formData.imageIds && formData.imageIds.length > 0
          ? "Images added"
          : "Consider adding product images",
    },
    {
      level: formData.modelFileId ? "success" : "warning",
      message: formData.modelFileId
        ? "3D model added"
        : "Consider adding a 3D model for better visualization",
    },
  ];

  const errorCount = validationItems.filter((item) => item.level === "error").length;
  const warningCount = validationItems.filter((item) => item.level === "warning").length;
  const canPublish = errorCount === 0;

  // Helper functions
  const getCategoryName = (id: number | null): string => {
    if (!id) {
      return "";
    }
    const category = categories.find((c) => c.id === id);
    return category ? category.name : "Unknown";
  };

  const getFabricName = (id: number | null): string => {
    if (!id) {
      return "";
    }
    const fabric = fabrics.find((f) => f.id === id);
    return fabric ? fabric.name : "Unknown";
  };

  const getSizeChartName = (id: number | null): string => {
    if (!id) {
      return "";
    }
    const chart = sizeCharts.find((s) => s.id === id);
    return chart ? `${chart.name}${chart.category ? ` (${chart.category})` : ""}` : "Unknown";
  };

  const getValidationIcon = (level: ValidationItem["level"]) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Enhanced Header - Phase 3 Polish */}
      <div className="rounded-xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-green-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-2xl text-foreground">Review & Publish</h2>
            <p className="mt-1 text-muted-foreground">Final validation and publication controls</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              Final Step
            </Badge>
            {canPublish && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Ready to Publish
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Validation Summary - Phase 3 Polish */}
      <Card
        className={cn(
          "border-2 shadow-sm-xs transition-all duration-200",
          canPublish ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {canPublish ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="font-bold text-2xl text-red-600">{errorCount}</div>
              <div className="text-muted-foreground text-sm">Errors</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-yellow-600">{warningCount}</div>
              <div className="text-muted-foreground text-sm">Warnings</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-green-600">
                {validationItems.filter((item) => item.level === "success").length}
              </div>
              <div className="text-muted-foreground text-sm">Completed</div>
            </div>
          </div>

          <div className="space-y-2">
            {validationItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 rounded p-2 text-sm",
                  item.level === "error" && "bg-red-100 text-red-800",
                  item.level === "warning" && "bg-yellow-100 text-yellow-800",
                  item.level === "success" && "bg-green-100 text-green-800",
                )}
              >
                {getValidationIcon(item.level)}
                <span>{item.message}</span>
              </div>
            ))}
          </div>

          {!canPublish && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please resolve all errors before publishing the product.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Product Summary - Phase 3 Polish */}
      <Card className="border-border shadow-sm-xs">
        <CardHeader className="border-b bg-linear-to-r from-white to-background">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Product Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-medium text-foreground">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {formData.name || "Not set"}
                </div>
                <div>
                  <span className="font-medium">SKU:</span> {formData.sku || "Not set"}
                </div>
                <div>
                  <span className="font-medium">Slug:</span> {formData.slug || "Auto-generated"}
                </div>
                <div>
                  <span className="font-medium">Short Description:</span>{" "}
                  {formData.shortDescription || "Not provided"}
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium text-foreground">Classification</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {getCategoryName(formData.categoryId ?? null) || "Not assigned"}
                </div>
                <div>
                  <span className="font-medium">Fabric:</span>{" "}
                  {getFabricName(formData.fabricId ?? null) || "Not assigned"}
                </div>
                <div>
                  <span className="font-medium">Size Chart:</span>{" "}
                  {getSizeChartName(formData.sizeChartId ?? null) || "Not assigned"}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {formData.description && (
            <div>
              <h4 className="mb-2 font-medium text-foreground">Description</h4>
              <p className="rounded bg-background p-3 text-foreground/80 text-sm">
                {formData.description}
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <h4 className="mb-3 font-medium text-foreground">Status</h4>
            <div className="flex gap-4">
              <Badge variant={formData.isActive ? "default" : "secondary"}>
                {formData.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={formData.isFeatured ? "default" : "secondary"}>
                {formData.isFeatured ? "Featured" : "Not Featured"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Media Summary - Phase 3 Polish */}
      <Card className="border-border shadow-sm-xs">
        <CardHeader className="border-b bg-linear-to-r from-slate-50 to-background">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5" />
            Media Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center transition-shadow-sm hover:shadow-md">
              <ImageIcon className="mx-auto mb-3 h-10 w-10 text-blue-500" />
              <div className="mb-1 font-bold text-3xl text-foreground">
                {formData.imageIds?.length || 0}
              </div>
              <div className="mb-2 font-medium text-foreground/80 text-sm">Images</div>
              {formData.primaryImageId ? (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  ⭐ Primary: {formData.primaryImageId}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  No primary set
                </Badge>
              )}
            </div>

            <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center transition-shadow-sm hover:shadow-md">
              <Video className="mx-auto mb-3 h-10 w-10 text-purple-500" />
              <div className="mb-1 font-bold text-3xl text-foreground">
                {formData.videos?.length || 0}
              </div>
              <div className="mb-2 font-medium text-foreground/80 text-sm">Videos</div>
              {formData.primaryVideoId ? (
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  ⭐ Primary: {formData.primaryVideoId}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  No primary set
                </Badge>
              )}
            </div>

            <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-6 text-center transition-shadow-sm hover:shadow-md">
              <Box className="mx-auto mb-3 h-10 w-10 text-orange-500" />
              <div className="mb-1 font-bold text-3xl text-foreground">
                {formData.modelFileId ? 1 : 0}
              </div>
              <div className="mb-2 font-medium text-foreground/80 text-sm">3D Models</div>
              {formData.modelFileId ? (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  Model: {formData.modelFileId}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  No model added
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      {(formData.minimumOrderQuantity || formData.leadTime) && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {formData.minimumOrderQuantity && (
                <div>
                  <span className="font-medium">Minimum Order:</span>{" "}
                  {formData.minimumOrderQuantity}
                </div>
              )}
              {formData.leadTime && (
                <div>
                  <span className="font-medium">Lead Time:</span> {formData.leadTime}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Specifications */}
        {(formData as { features?: string[] }).features?.length ||
        Object.keys(formData.specifications || {}).length ? (
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(formData as { features?: string[] }).features?.length ? (
                <div>
                  <h5 className="mb-2 font-medium text-sm">Features</h5>
                  <div className="space-y-1">
                    {(formData as { features?: string[] }).features?.map(
                      (feature: string, index: number) => (
                        <div key={index} className="text-foreground/80 text-sm">
                          • {feature}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {Object.keys(formData.specifications || {}).length ? (
                <div>
                  <h5 className="mb-2 font-medium text-sm">Technical Specs</h5>
                  <div className="space-y-1">
                    {Object.entries(formData.specifications || {}).map(
                      ([key, value]: [string, unknown]) => (
                        <div key={key} className="text-foreground/80 text-sm">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* SEO Information */}
        {(formData.metaTitle || formData.metaDescription) && (
          <Card>
            <CardHeader>
              <CardTitle>SEO Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.metaTitle && (
                <div>
                  <h5 className="mb-1 font-medium text-sm">Meta Title</h5>
                  <p className="text-foreground/80 text-sm">{formData.metaTitle}</p>
                </div>
              )}
              {formData.metaDescription && (
                <div>
                  <h5 className="mb-1 font-medium text-sm">Meta Description</h5>
                  <p className="text-foreground/80 text-sm">{formData.metaDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Publication Actions - Phase 3 Polish */}
      <Card className="border-emerald-200 shadow-sm-xs">
        <CardHeader className="border-emerald-200 border-b bg-linear-to-r from-emerald-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-emerald-900 text-lg">
            <ExternalLink className="h-5 w-5" />
            Publication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Enhanced Publication Actions */}
            <div className="rounded-xl border-2 border-emerald-200 bg-linear-to-r from-emerald-50 to-green-50 p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-foreground text-lg">
                    {isEditing ? "Update Product" : "Publish Product"}
                  </h4>
                  <p className="mb-3 text-muted-foreground text-sm">
                    {isEditing
                      ? "Save your changes to update the existing product in the catalog"
                      : canPublish
                        ? "All validations passed. Ready to publish this product to the live catalog"
                        : "Please resolve validation errors above before publishing"}
                  </p>
                  {canPublish && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Product ready for publication</span>
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-amber-600 text-sm">
                      <Info className="h-4 w-4" />
                      <span>
                        {warningCount} warning{warningCount > 1 ? "s" : ""} - optional improvements
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={onSubmit}
                  disabled={!canPublish || isLoading}
                  size="lg"
                  className={cn(
                    "h-12 min-w-44 font-semibold text-base shadow-lg transition-all duration-200",
                    canPublish
                      ? "bg-green-600 hover:scale-105 hover:bg-green-700 hover:shadow-xl"
                      : "cursor-not-allowed bg-muted/40",
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{isEditing ? "Updating..." : "Publishing..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      <span>{isEditing ? "Update Product" : "Publish Product"}</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Final Checklist - Phase 3 Polish */}
              {canPublish && (
                <div className="mt-6 border-emerald-200 border-t pt-4">
                  <p className="mb-3 font-medium text-muted-foreground text-xs">
                    Pre-Publication Checklist:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline" className="justify-center bg-green-100 text-green-800">
                      ✓ Required fields completed
                    </Badge>
                    <Badge variant="outline" className="justify-center bg-green-100 text-green-800">
                      ✓ Media assets selected
                    </Badge>
                    <Badge variant="outline" className="justify-center bg-green-100 text-green-800">
                      ✓ Validation passed
                    </Badge>
                    <Badge variant="outline" className="justify-center bg-green-100 text-green-800">
                      ✓ Ready for catalog
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
