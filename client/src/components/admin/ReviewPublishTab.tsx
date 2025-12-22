import type { Accessory, Category, Certificate, Fabric, Product, SizeChart } from '@shared/schema';
import {
  AlertCircle,
  AlertTriangle,
  Box,
  CheckCircle,
  ExternalLink,
  ImageIcon,
  Info, 
  Package,
  Video
} from 'lucide-react';
import type React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ValidationItem {
  level: 'error' | 'warning' | 'success';
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
  isEditing
}) => {
  // Validation logic
  const validationItems: ValidationItem[] = [
    // Required field validations
    {
      level: formData.name ? 'success' : 'error',
      message: formData.name ? 'Product name provided' : 'Product name is required'
    },
    {
      level: formData.sku ? 'success' : 'error',
      message: formData.sku ? 'SKU provided' : 'SKU is required'
    },
    {
      level: formData.shortDescription ? 'success' : 'error',
      message: formData.shortDescription ? 'Short description provided' : 'Short description is required'
    },
    // Optional field validations
    {
      level: formData.description ? 'success' : 'warning',
      message: formData.description ? 'Detailed description provided' : 'Consider adding a detailed description'
    },
    {
      level: formData.categoryId ? 'success' : 'warning',
      message: formData.categoryId ? 'Category assigned' : 'Consider assigning a category'
    },
    // Media validations
    {
      level: (formData.imageIds && formData.imageIds.length > 0) ? 'success' : 'warning',
      message: (formData.imageIds && formData.imageIds.length > 0) ? 'Images added' : 'Consider adding product images'
    },
    {
      level: formData.modelFileId ? 'success' : 'warning',
      message: formData.modelFileId ? '3D model added' : 'Consider adding a 3D model for better visualization'
    },
  ];

  const errorCount = validationItems.filter(item => item.level === 'error').length;
  const warningCount = validationItems.filter(item => item.level === 'warning').length;
  const canPublish = errorCount === 0;

  // Helper functions
  const getCategoryName = (id: number | null): string => {
    if (!id) return '';
    const category = categories.find((c) => c.id === id);
    return category ? category.name : 'Unknown';
  };

  const getFabricName = (id: number | null): string => {
    if (!id) return '';
    const fabric = fabrics.find((f) => f.id === id);
    return fabric ? fabric.name : 'Unknown';
  };

  const getSizeChartName = (id: number | null): string => {
    if (!id) return '';
    const chart = sizeCharts.find((s) => s.id === id);
    return chart ? `${chart.name}${chart.category ? ` (${chart.category})` : ''}` : 'Unknown';
  };

  const getValidationIcon = (level: ValidationItem['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Enhanced Header - Phase 3 Polish */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Review & Publish</h2>
            <p className="text-gray-600 mt-1">Final validation and publication controls</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              Final Step
            </Badge>
            {canPublish && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready to Publish
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Validation Summary - Phase 3 Polish */}
      <Card className={cn(
        "border-2 shadow-sm-xs transition-all duration-200",
        canPublish ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {canPublish ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {validationItems.filter(item => item.level === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>

          <div className="space-y-2">
            {validationItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 p-2 rounded text-sm",
                  item.level === 'error' && "bg-red-100 text-red-800",
                  item.level === 'warning' && "bg-yellow-100 text-yellow-800",
                  item.level === 'success' && "bg-green-100 text-green-800"
                )}
              >
                {getValidationIcon(item.level)}
                <span>{item.message}</span>
              </div>
            ))}
          </div>

          {!canPublish && (
            <Alert className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Please resolve all errors before publishing the product.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Product Summary - Phase 3 Polish */}
      <Card className="shadow-sm-xs border-gray-200">
        <CardHeader className="bg-gradient-to-r from-white to-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Product Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {formData.name || 'Not set'}</div>
                <div><span className="font-medium">SKU:</span> {formData.sku || 'Not set'}</div>
                <div><span className="font-medium">Slug:</span> {formData.slug || 'Auto-generated'}</div>
                <div><span className="font-medium">Short Description:</span> {formData.shortDescription || 'Not provided'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Classification</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Category:</span> {getCategoryName(formData.categoryId ?? null) || 'Not assigned'}</div>
                <div><span className="font-medium">Fabric:</span> {getFabricName(formData.fabricId ?? null) || 'Not assigned'}</div>
                <div><span className="font-medium">Size Chart:</span> {getSizeChartName(formData.sizeChartId ?? null) || 'Not assigned'}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {formData.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {formData.description}
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Status</h4>
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
      <Card className="shadow-sm-xs border-gray-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="w-5 h-5" />
            Media Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border-2 border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow-sm">
              <ImageIcon className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formData.imageIds?.length || 0}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-2">Images</div>
              {formData.primaryImageId ? (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  ⭐ Primary: {formData.primaryImageId}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500">
                  No primary set
                </Badge>
              )}
            </div>

            <div className="text-center p-6 border-2 border-purple-200 bg-purple-50 rounded-lg hover:shadow-md transition-shadow-sm">
              <Video className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formData.videos?.length || 0}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-2">Videos</div>
              {formData.primaryVideoId ? (
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  ⭐ Primary: {formData.primaryVideoId}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500">
                  No primary set
                </Badge>
              )}
            </div>

            <div className="text-center p-6 border-2 border-orange-200 bg-orange-50 rounded-lg hover:shadow-md transition-shadow-sm">
              <Box className="w-10 h-10 text-orange-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formData.modelFileId ? 1 : 0}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-2">3D Models</div>
              {formData.modelFileId ? (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  Model: {formData.modelFileId}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {formData.minimumOrderQuantity && (
                <div>
                  <span className="font-medium">Minimum Order:</span> {formData.minimumOrderQuantity}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specifications */}
        {((formData as any).features?.length || Object.keys(formData.specifications || {}).length) ? (
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(formData as any).features?.length ? (
                <div>
                  <h5 className="font-medium text-sm mb-2">Features</h5>
                  <div className="space-y-1">
                    {(formData as any).features.map((feature: string, index: number) => (
                      <div key={index} className="text-sm text-gray-700">• {feature}</div>
                    ))}
                  </div>
                </div>
              ) : null}

              {Object.keys(formData.specifications || {}).length ? (
                <div>
                  <h5 className="font-medium text-sm mb-2">Technical Specs</h5>
                  <div className="space-y-1">
                    {Object.entries(formData.specifications || {}).map(([key, value]: [string, unknown]) => (
                      <div key={key} className="text-sm text-gray-700">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
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
                  <h5 className="font-medium text-sm mb-1">Meta Title</h5>
                  <p className="text-sm text-gray-700">{formData.metaTitle}</p>
                </div>
              )}
              {formData.metaDescription && (
                <div>
                  <h5 className="font-medium text-sm mb-1">Meta Description</h5>
                  <p className="text-sm text-gray-700">{formData.metaDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Publication Actions - Phase 3 Polish */}
      <Card className="shadow-sm-xs border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200">
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-900">
            <ExternalLink className="w-5 h-5" />
            Publication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Enhanced Publication Actions */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                    {isEditing ? 'Update Product' : 'Publish Product'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {isEditing
                      ? 'Save your changes to update the existing product in the catalog'
                      : canPublish
                        ? 'All validations passed. Ready to publish this product to the live catalog'
                        : 'Please resolve validation errors above before publishing'
                    }
                  </p>
                  {canPublish && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Product ready for publication</span>
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="flex items-center gap-1 text-sm text-amber-600 mt-2">
                      <Info className="w-4 h-4" />
                      <span>{warningCount} warning{warningCount > 1 ? 's' : ''} - optional improvements</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={onSubmit}
                  disabled={!canPublish || isLoading}
                  size="lg"
                  className={cn(
                    "min-w-44 h-12 text-base font-semibold transition-all duration-200 shadow-lg",
                    canPublish
                      ? "bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-xl"
                      : "bg-gray-400 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEditing ? 'Updating...' : 'Publishing...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      <span>{isEditing ? 'Update Product' : 'Publish Product'}</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Final Checklist - Phase 3 Polish */}
              {canPublish && (
                <div className="mt-6 pt-4 border-t border-emerald-200">
                  <p className="text-xs text-gray-600 mb-3 font-medium">Pre-Publication Checklist:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline" className="bg-green-100 text-green-800 justify-center">
                      ✓ Required fields completed
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 justify-center">
                      ✓ Media assets selected
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 justify-center">
                      ✓ Validation passed
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 justify-center">
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