import type { Product } from "@shared/index";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProductForm } from "../../hooks/useProductForm";
import { useProductMutations } from "../hooks/useProductMutations";
import { useProductQueries } from "../hooks/useProductQueries";
import { productValidationSchema } from "../schema/product-validation.schema";

interface ProductFormContextValue {
  // Form State & Methods
  formData: ReturnType<typeof useProductForm>["formData"];
  updateField: ReturnType<typeof useProductForm>["updateField"];
  updateMultipleFields: ReturnType<typeof useProductForm>["updateMultipleFields"];
  isSectionComplete: ReturnType<typeof useProductForm>["isSectionComplete"];
  accordionHelper: ReturnType<typeof useProductForm>["accordionHelper"];
  isGeneratingSlug: boolean;

  // Validation
  formErrors: Record<string, string>;
  validationSummary: {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
  };
  validateField: (field: string, value: unknown) => void;
  handleSubmit: (e: React.FormEvent) => void;

  // Workflow
  lastSaved: Date | null;
  isEditing: boolean;
  onClose: () => void;

  // Queries
  queries: ReturnType<typeof useProductQueries>;

  // Mutations
  isSubmitting: boolean;
}

const ProductFormContext = createContext<ProductFormContextValue | undefined>(undefined);

interface ProductFormProviderProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ProductFormProvider({
  product,
  isOpen,
  onClose,
  children,
}: ProductFormProviderProps) {
  const isEditing = !!product;
  const { toast } = useToast();

  // 1. Form State Management
  const {
    formData,
    updateField,
    updateMultipleFields,
    isSectionComplete,
    accordionHelper,
    isGeneratingSlug,
  } = useProductForm(product);

  const { accordionStates } = accordionHelper;

  // 2. Data Queries
  const queries = useProductQueries(isOpen, !!accordionStates.customization);

  // 3. Mutations
  const { createProductMutation, updateProductMutation, isSubmitting } = useProductMutations({
    onSuccess: onClose,
    productUrlPath: product?.urlPath || null,
  });

  // 4. Validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState({
    isValid: false,
    errorCount: 0,
    warningCount: 0,
  });

  const validateForm = useCallback((data: typeof formData) => {
    const result = productValidationSchema.safeParse(data);

    if (result.success) {
      setFormErrors({});
      setValidationSummary({ isValid: true, errorCount: 0, warningCount: 0 });
      return true;
    } else {
      const errors: Record<string, string> = {};
      let errorCount = 0;

      for (const issue of result.error.issues) {
        const path = issue.path[0]?.toString();
        if (path) {
          errors[path] = issue.message;
          errorCount++;
        }
      }

      setFormErrors(errors);
      setValidationSummary({ isValid: false, errorCount, warningCount: 0 });
      return false;
    }
  }, []);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateForm(formData);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [formData, validateForm]);

  const validateField = useCallback(
    (field: string, value: unknown) => {
      // Partial validation for single field
      const testData = { ...formData, [field]: value };
      const result = productValidationSchema.safeParse(testData);

      if (!result.success) {
        const fieldError = result.error.issues.find((i) => i.path[0]?.toString() === field);
        if (fieldError) {
          setFormErrors((prev) => ({ ...prev, [field]: fieldError.message }));
        } else {
          setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      } else {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [formData],
  );

  // 5. Auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (formData.name && !isSubmitting) {
      const timer = setTimeout(() => {
        setLastSaved(new Date());
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [formData, isSubmitting]);

  // 6. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !isSubmitting) {
        e.preventDefault();
        const isValid = validateForm(formData);
        if (isValid) {
          (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.click();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && isEditing) {
        e.preventDefault();
        updateMultipleFields({
          ...formData,
          name: `${formData.name} (Copy)`,
          sku: "",
          slug: "",
        });
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, isEditing, onClose, formData, updateMultipleFields, validateForm]);

  // 7. Submission Handler
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const isValid = validateForm(formData);
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fix the form errors before submitting",
          variant: "destructive",
        });
        return;
      }

      // Convert formData to InsertProduct format
      const productData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        slug: formData.slug,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,

        categoryId: formData.categoryId!,
        fabricId: formData.fabricId,
        sizeChartId: formData.sizeChartId,
        fiberComposition:
          formData.selectedFiberComposition && formData.selectedFiberComposition.length > 0
            ? { selected: formData.selectedFiberComposition }
            : undefined,

        primaryImageId: formData.primaryImageId,
        primaryVideoId: formData.primaryVideoId,
        imageIds: formData.imageIds.length > 0 ? formData.imageIds : undefined,
        videos:
          formData.videos.length > 0
            ? formData.videos
                .map((id) => {
                  const asset = queries.mediaAssets.find((m) => m.id === id);
                  return asset
                    ? {
                        url: asset.url,
                        thumbnail: asset.url,
                        type: "video",
                        title: asset.filename,
                      }
                    : null;
                })
                .filter((v): v is NonNullable<typeof v> => v !== null)
            : undefined,
        modelFileId: formData.modelFileId,

        specifications: formData.specifications.length > 0 ? formData.specifications : undefined,
        technicalSpecs:
          Object.keys(formData.technicalSpecs || {}).length > 0
            ? formData.technicalSpecs
            : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        careInstructions:
          formData.careInstructions.length > 0 ? formData.careInstructions : undefined,

        minimumOrderQuantity: formData.minimumOrderQuantity
          ? parseInt(formData.minimumOrderQuantity, 10)
          : undefined,
        leadTime: formData.leadTime || undefined,
        customWeight: formData.customWeight || undefined,
        customFit: formData.customFit || undefined,

        customizationOptions:
          formData.customizationOptions && formData.customizationOptions.length > 0
            ? formData.customizationOptions
            : undefined,

        certificateIds: formData.certificateIds.length > 0 ? formData.certificateIds : undefined,
        accessoryIds: formData.accessoryIds.length > 0 ? formData.accessoryIds : undefined,
        relatedProductIds:
          formData.relatedProductIds && formData.relatedProductIds.length > 0
            ? formData.relatedProductIds
            : undefined,

        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
      };

      if (isEditing && product?.id) {
        updateProductMutation.mutate({ id: product.id, data: productData });
      } else {
        createProductMutation.mutate(productData);
      }
    },
    [
      formData,
      isEditing,
      product,
      queries.mediaAssets,
      createProductMutation,
      updateProductMutation,
      validateForm,
      toast,
    ],
  );

  const value = useMemo(
    () => ({
      formData,
      updateField,
      updateMultipleFields,
      isSectionComplete,
      accordionHelper,
      isGeneratingSlug,
      formErrors,
      validationSummary,
      validateField,
      handleSubmit,
      lastSaved,
      isEditing,
      onClose,
      queries,
      isSubmitting,
    }),
    [
      formData,
      updateField,
      updateMultipleFields,
      isSectionComplete,
      accordionHelper,
      isGeneratingSlug,
      formErrors,
      validationSummary,
      validateField,
      handleSubmit,
      lastSaved,
      isEditing,
      onClose,
      queries,
      isSubmitting,
    ],
  );

  return <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>;
}

export function useProductContext() {
  const context = useContext(ProductFormContext);
  if (context === undefined) {
    throw new Error("useProductContext must be used within a ProductFormProvider");
  }
  return context;
}
