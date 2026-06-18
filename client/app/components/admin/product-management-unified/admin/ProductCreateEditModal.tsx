import type { MediaAsset, Product } from "@shared/index";
import { lazy, Suspense, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { ProductFormFooter } from "./components/ProductFormFooter";
import { ProductFormHeader } from "./components/ProductFormHeader";
import { ProductFormProgress } from "./components/ProductFormProgress";
import { ProductFormProvider, useProductContext } from "./state/ProductFormContext";

// Lazy load section components for code splitting
const BasicInfoSection = lazy(() =>
  import("../sections/BasicInfoSection").then((m) => ({ default: m.BasicInfoSection })),
);
const CategoryFabricSection = lazy(() =>
  import("../sections/CategoryFabricSection").then((m) => ({ default: m.CategoryFabricSection })),
);
const MediaAssetsSection = lazy(() =>
  import("../sections/MediaAssetsSection").then((m) => ({ default: m.MediaAssetsSection })),
);
const SpecificationsSection = lazy(() =>
  import("../sections/SpecificationsSection").then((m) => ({ default: m.SpecificationsSection })),
);
const CertificationsSection = lazy(() =>
  import("../sections/CertificationsSection").then((m) => ({ default: m.CertificationsSection })),
);
const CustomizationSEOSection = lazy(() =>
  import("../sections/CustomizationSEOSection").then((m) => ({
    default: m.CustomizationSEOSection,
  })),
);

interface ProductCreateEditModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductCreateEditModal(props: ProductCreateEditModalProps) {
  return (
    <ProductFormProvider {...props}>
      <ProductFormShell isOpen={props.isOpen} />
    </ProductFormProvider>
  );
}

function ProductFormShell({ isOpen }: { isOpen: boolean }) {
  const {
    formData,
    formErrors,
    updateField,
    accordionHelper,
    handleSubmit,
    onClose,
    queries,
    validateField,
  } = useProductContext();

  const { accordionStates, toggleSection } = accordionHelper;
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerMode] = useState<"images" | "primary" | "videos" | "model">("images");

  const handleInputChange = (field: string, value: unknown) => {
    // @ts-expect-error - Dynamic field update
    updateField(field, value);
    validateField(field, value);
  };

  const handleMediaSelection = (value: number | number[]) => {
    const selectedIds = Array.isArray(value) ? value : [value];

    if (mediaPickerMode === "images") {
      updateField("imageIds", selectedIds);
    } else if (mediaPickerMode === "primary") {
      updateField("primaryImageId", (selectedIds.length > 0 ? selectedIds[0] : null) ?? null);
    } else if (mediaPickerMode === "videos") {
      updateField("videos", selectedIds);
    } else if (mediaPickerMode === "model") {
      updateField("modelFileId", (selectedIds.length > 0 ? selectedIds[0] : null) ?? null);
    }
    setIsMediaPickerOpen(false);
  };

  const getMediaAsset = (id: number) => {
    if (!Array.isArray(queries.mediaAssets)) return undefined;
    return queries.mediaAssets.find((m) => m && m.id === id);
  };

  // Normalize specifications to clean up legacy data with array index prefixes
  const normalizeSpecifications = (
    specs: string[] | Record<string, unknown> | undefined,
  ): string[] => {
    if (!specs) return [];
    let specsArray: string[];
    if (Array.isArray(specs)) {
      specsArray = specs;
    } else if (typeof specs === "object") {
      specsArray = Object.values(specs).map((v) => (typeof v === "string" ? v : String(v)));
    } else {
      return [];
    }
    return specsArray.map((spec) => {
      if (typeof spec !== "string") return String(spec);
      return spec.replace(/^\d+:\s*/, "");
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent contentType="form" aria-describedby="product-form-description">
        <ProductFormHeader />

        <DialogBody>
          <ProductFormProgress />

          <form
            action={() => handleSubmit({ preventDefault: () => {} } as unknown as React.FormEvent)}
            className="space-y-4"
          >
            <Suspense
              fallback={
                <div className="bg-white/[0.03] animate-pulse rounded-lg border border-white/5 p-4 text-admin-muted">
                  Loading...
                </div>
              }
            >
              <BasicInfoSection
                formData={{
                  name: formData.name,
                  sku: formData.sku,
                  description: formData.description,
                  shortDescription: formData.shortDescription,
                  slug: formData.slug,
                  sortOrder: formData.sortOrder,
                  isActive: formData.isActive,
                  isFeatured: formData.isFeatured,
                }}
                formErrors={formErrors}
                isOpen={!!accordionStates.basicInfo}
                onToggle={() => toggleSection("basicInfo")}
                onInputChange={handleInputChange}
                generateSlug={() => {
                  // Slug generation is handled internally by useProductForm
                }}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-white/[0.03] animate-pulse rounded-lg border border-white/5 p-4 text-admin-muted">
                  Loading...
                </div>
              }
            >
              <CategoryFabricSection
                formData={{
                  categoryId: formData.categoryId,
                  fabricId: formData.fabricId,
                  sizeChartId: formData.sizeChartId,
                  selectedFiberComposition: Array.isArray(formData.selectedFiberComposition)
                    ? formData.selectedFiberComposition.join(", ")
                    : "",
                }}
                formErrors={formErrors}
                isOpen={!!accordionStates.categoryFabric}
                onToggle={() => toggleSection("categoryFabric")}
                onInputChange={handleInputChange}
                categories={queries.categories || []}
                fabrics={queries.fabrics || []}
                sizeCharts={queries.sizeCharts || []}
                fibers={queries.fibers || []}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-white/[0.03] animate-pulse rounded-lg border border-white/5 p-4 text-admin-muted">
                  Loading...
                </div>
              }
            >
              <MediaAssetsSection
                formData={{
                  primaryImageId: formData.primaryImageId,
                  primaryVideoId: formData.primaryVideoId,
                  imageIds: formData.imageIds,
                  videos: formData.videos,
                  modelFileId: formData.modelFileId,
                }}
                formErrors={formErrors}
                isOpen={!!accordionStates.mediaAssets}
                onToggle={() => toggleSection("mediaAssets")}
                onInputChange={handleInputChange}
                getMediaAsset={getMediaAsset}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-white/[0.03] animate-pulse rounded-lg border border-white/5 p-4 text-admin-muted">
                  Loading...
                </div>
              }
            >
              <SpecificationsSection
                formData={{
                  technicalSpecs: formData.technicalSpecs || {},
                  specifications: normalizeSpecifications(formData.specifications),
                  careInstructions: formData.careInstructions,
                  tags: formData.tags,
                  minimumOrderQuantity: formData.minimumOrderQuantity,
                  leadTime: formData.leadTime,
                  customWeight: formData.customWeight,
                  customFit: formData.customFit,
                }}
                formErrors={formErrors}
                isOpen={!!accordionStates.specifications}
                onToggle={() => toggleSection("specifications")}
                onInputChange={handleInputChange}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-white/[0.03] animate-pulse rounded-lg border border-white/5 p-4 text-admin-muted">
                  Loading...
                </div>
              }
            >
              <CertificationsSection
                formData={{
                  certificateIds: formData.certificateIds,
                  accessoryIds: formData.accessoryIds,
                  relatedProductIds: formData.relatedProductIds,
                }}
                formErrors={formErrors}
                isOpen={!!accordionStates.certifications}
                onToggle={() => toggleSection("certifications")}
                onInputChange={handleInputChange}
                certificates={queries.certificates || []}
                accessories={queries.accessories || []}
                products={
                  Array.isArray(queries.allProducts)
                    ? queries.allProducts.filter((p: Product) => p.slug !== formData.slug) // Simple filter for current edit
                    : []
                }
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-white/[0.03] animate-pulse rounded-lg border border-white/5 p-4 text-admin-muted">
                  Loading...
                </div>
              }
            >
              <CustomizationSEOSection
                formData={{
                  customizationOptions: formData.customizationOptions || [],
                  metaTitle: formData.metaTitle,
                  metaDescription: formData.metaDescription,
                }}
                formErrors={formErrors}
                isOpen={!!accordionStates.customization}
                onToggle={() => toggleSection("customization")}
                onInputChange={handleInputChange}
                generateMetaTitle={() => {}} // Handled in Progress component now
                generateMetaDescription={() => {}} // Handled in Progress component now
              />
            </Suspense>

            <ProductFormFooter />
          </form>

          <StandardMediaSelectionDialog
            isOpen={isMediaPickerOpen}
            onClose={() => setIsMediaPickerOpen(false)}
            onSelect={(asset: MediaAsset | MediaAsset[]) => {
              const singleAsset = Array.isArray(asset) ? asset[0] : asset;
              if (singleAsset) {
                handleMediaSelection(singleAsset.id);
              }
            }}
            title={
              mediaPickerMode === "primary"
                ? "Select Primary Image"
                : mediaPickerMode === "images"
                  ? "Select Product Images"
                  : mediaPickerMode === "videos"
                    ? "Select Product Videos"
                    : mediaPickerMode === "model"
                      ? "Select 3D Model"
                      : "Select Media"
            }
            mediaPickerTarget={`product-${mediaPickerMode || "media"}`}
            selectionMode="single"
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
