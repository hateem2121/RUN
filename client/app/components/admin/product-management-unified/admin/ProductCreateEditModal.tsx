import { ADMIN_MEDIA_QUERIES, buildMediaApiParams } from "@shared/api-constants";
import type {
  Accessory,
  Category,
  Certificate,
  Fabric,
  Fiber,
  MediaAsset,
  Product,
  SizeChart,
} from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { createMediaQueryKey } from "@/lib/media-query-keys";

// Type definitions for API responses
type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type MediaApiResponse =
  | { success: true; data: { data: MediaAsset[] } }
  | { success: true; data: MediaAsset[] }
  | MediaAsset[];

type SectionProgress = {
  name: string;
  fields: string[];
  completed: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
};

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Package,
  Search,
  Settings,
  Star,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Phase 5.1: Lazy load section components for code splitting - Fixed for default exports
const BasicInfoSection = lazy(() => import("../sections/BasicInfoSection"));
const CategoryFabricSection = lazy(() => import("../sections/CategoryFabricSection"));
const MediaAssetsSection = lazy(() => import("../sections/MediaAssetsSection"));
const SpecificationsSection = lazy(() => import("../sections/SpecificationsSection"));
const CertificationsSection = lazy(() => import("../sections/CertificationsSection"));
const CustomizationSection = lazy(() => import("../sections/CustomizationSection"));

import type { InsertProduct } from "@shared/schema";
// Import mutations and queries
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAccordionPersistence, useProductForm } from "../shared/hooks";
// Import StandardMediaSelectionDialog and shared hooks
import { logger } from "../shared/logger";
import type { ProductFormFieldValue } from "../shared/types";

interface ProductCreateEditModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductCreateEditModal({ product, isOpen, onClose }: ProductCreateEditModalProps) {
  const isEditing = !!product;

  // Phase 2: Use optimized form management with useReducer
  const { formData, updateField, updateMultipleFields } = useProductForm(product);

  // Phase 3: Persistent accordion states
  const { accordionStates, toggleSection } = useAccordionPersistence(
    "product-form-accordion-states",
  );

  // Phase 2: Form synchronization is now handled by useProductForm hook

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerMode] = useState<"images" | "primary" | "videos" | "model">("images");

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Phase 2: Real-time Sync - Save Functionality - Define early to avoid temporal dead zone
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Inline helper to eliminate duplicate cache invalidation logic
  // Note: Kept inline per requirements - future refactor could extract to shared utility
  const invalidateProductCaches = (
    productData: { urlPath?: string | null; slug?: string | null },
    originalUrlPath?: string | null,
  ) => {
    // Invalidate all product-related queries for complete synchronization
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/products/initial-data"],
    });

    // Invalidate product-complete caches for individual product pages
    if (productData.urlPath) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", productData.urlPath],
      });
    }
    if (productData.slug) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", productData.slug],
      });
    }

    // For updates, also invalidate the original path if it changed
    if (originalUrlPath && originalUrlPath !== productData.urlPath) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", originalUrlPath],
      });
    }

    // Invalidate hierarchical product queries
    queryClient.invalidateQueries({ queryKey: ["/api/products/by-path"] });
    queryClient.invalidateQueries({ queryKey: ["/api/product-complete"] });
  };

  const createProductMutation = useMutation({
    mutationFn: (data: InsertProduct) =>
      apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<Product>,
    onSuccess: (newProduct: Product) => {
      try {
        logger.debug("Product created successfully", {
          productId: newProduct.id,
          name: newProduct.name,
        });

        invalidateProductCaches(newProduct);

        toast({
          title: "Success",
          description: "Product created successfully",
        });

        onClose();
      } catch (_err) {}
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertProduct> }) =>
      apiRequest(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<Product>,
    onSuccess: (updatedProduct: Product) => {
      try {
        logger.debug("Product updated successfully", {
          productId: updatedProduct.id,
          name: updatedProduct.name,
        });

        invalidateProductCaches(updatedProduct, product?.urlPath);

        toast({
          title: "Success",
          description: "Product updated successfully",
        });

        onClose();
      } catch (_err) {}
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Define isLoading before all useEffect hooks that use it
  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  // Phase 1: Enhanced data fetching with optimized caching
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: fibers = [] } = useQuery<Fiber[]>({
    queryKey: ["/api/fibers"],
    staleTime: 10 * 60 * 1000, // 10 minutes - fibers rarely change
    gcTime: 15 * 60 * 1000,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: accessories = [] } = useQuery<Accessory[]>({
    queryKey: ["/api/accessories"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: sizeCharts = [] } = useQuery<SizeChart[]>({
    queryKey: ["/api/size-charts"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: productsResponse } = useQuery<{
    data: Product[];
    pagination?: PaginationMeta;
  }>({
    queryKey: ["/api/products"],
    staleTime: 1 * 60 * 1000, // 1 minute for products
    gcTime: 5 * 60 * 1000,
    enabled: !!(isOpen && accordionStates.customization), // Only fetch when customization section is open
  });
  // Ensure allProducts is always an array, even during loading states
  const allProducts = Array.isArray((productsResponse as { data?: unknown })?.data)
    ? (productsResponse as { data: Product[] }).data
    : [];

  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: createMediaQueryKey.list({ limit: 100 }), // Fetch assets for product form
    queryFn: async () => {
      const response = await fetch(
        `/api/media?${buildMediaApiParams(ADMIN_MEDIA_QUERIES.MAX_ASSETS)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch media assets");
      }
      return response.json();
    },
    select: (data: MediaApiResponse): MediaAsset[] => {
      // Handle consolidated media API response structure: { success: true, data: { data: [...] } }
      if (typeof data === "object" && "success" in data && data.success) {
        if ("data" in data.data && Array.isArray(data.data.data)) {
          return data.data.data;
        } else if (Array.isArray(data.data)) {
          return data.data;
        }
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - media doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: isOpen,
  });

  // Utility functions
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Phase 3: Advanced Form Validation Functions
  const validateField = useCallback(
    (field: string, value: unknown): string => {
      switch (field) {
        case "name":
          if (typeof value !== "string" || !value || value.trim().length < 3) {
            return "Product name must be at least 3 characters long";
          }
          if (value.length > 100) {
            return "Product name cannot exceed 100 characters";
          }
          break;

        case "sku":
          if (typeof value !== "string" || !value || value.trim().length === 0) {
            return "SKU is required for inventory management";
          }
          if (!/^[A-Z0-9-_]+$/i.test(value)) {
            return "SKU can only contain letters, numbers, hyphens, and underscores";
          }
          break;

        case "description":
          if (typeof value !== "string" || !value || value.trim().length < 20) {
            return "Product description must be at least 20 characters for better customer understanding";
          }
          break;

        case "categoryId":
          if (!value) {
            return "Product category is required for proper organization";
          }
          break;

        case "fabricId":
          if (!value) {
            return "Fabric selection is required for technical specifications";
          }
          break;

        case "selectedFiberComposition":
          if (formData.fabricId && !value) {
            return "Fiber composition must be selected when fabric is chosen";
          }
          break;

        case "primaryImageId":
          if (!value) {
            return "Primary image is required for product visibility";
          }
          break;

        case "minimumOrderQuantity":
          if (value && (Number.isNaN(Number(value)) || Number(value) < 1)) {
            return "Minimum order quantity must be a positive number";
          }
          break;

        case "leadTime":
          if (
            typeof value === "string" &&
            value &&
            value.trim().length > 0 &&
            value.trim().length < 3
          ) {
            return 'Lead time description should be more detailed (e.g., "2-3 weeks")';
          }
          break;

        default:
          return "";
      }
      return "";
    },
    [formData.fabricId],
  );

  // Pure validation function - no side effects, properly memoized
  const validateFormPure = useCallback(
    (data: typeof formData) => {
      const errors: Record<string, string> = {};
      let errorCount = 0;
      let warningCount = 0;

      // Validate all critical fields
      const fieldsToValidate = [
        "name",
        "sku",
        "description",
        "categoryId",
        "fabricId",
        "selectedFiberComposition",
        "primaryImageId",
        "minimumOrderQuantity",
        "leadTime",
      ];

      fieldsToValidate.forEach((field) => {
        const error = validateField(field, data[field as keyof typeof data]);
        if (error) {
          errors[field] = error;
          if (["name", "sku", "categoryId", "fabricId", "primaryImageId"].includes(field)) {
            errorCount++;
          } else {
            warningCount++;
          }
        }
      });

      // Additional validations
      if (data.imageIds.length === 0 && !data.primaryImageId) {
        errors.images = "At least one product image is required";
        errorCount++;
      }

      if (data.certificateIds.length === 0) {
        errors.certificates = "Consider adding sustainability certificates for B2B credibility";
        warningCount++;
      }

      if (Object.keys(data.technicalSpecs || {}).length === 0) {
        errors.technicalSpecs =
          "Technical specifications help B2B customers make informed decisions";
        warningCount++;
      }

      return { errors, isValid: errorCount === 0, errorCount, warningCount };
    },
    [validateField],
  ); // No dependencies - pure function

  // Debounced validation to prevent excessive re-renders
  const [validationSummary, setValidationSummary] = useState(() => validateFormPure(formData));

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const result = validateFormPure(formData);
      setValidationSummary(result);
      setFormErrors(result.errors);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [formData, validateFormPure]);

  // Phase 3: Workflow Enhancements - Auto-generation and Smart Features
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounced auto-generation functions to prevent loops
  const debouncedSlugGeneration = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (name: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (name && !formData.slug) {
          const generatedSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 50);
          updateField("slug", generatedSlug);
        }
      }, 500);
    };
  }, [formData.slug, updateField]);

  const debouncedSkuGeneration = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (name: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (name && !formData.sku && !isEditing) {
          const words = name.split(" ").filter((word) => word.length > 2);
          const initials = words.map((word) => word.substring(0, 2).toUpperCase()).join("");
          const randomNum = Math.floor(Math.random() * 90) + 10;
          const suggestedSku = `${initials}_${randomNum}`;
          updateField("sku", suggestedSku);
        }
      }, 500);
    };
  }, [formData.sku, isEditing, updateField]);

  // Auto-generate slug from name with debouncing
  useEffect(() => {
    if (formData.name) {
      debouncedSlugGeneration(formData.name);
    }
  }, [formData.name, debouncedSlugGeneration]);

  // Auto-generate SKU suggestion with debouncing
  useEffect(() => {
    if (formData.name) {
      debouncedSkuGeneration(formData.name);
    }
  }, [formData.name, debouncedSkuGeneration]);

  // Auto-save draft functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Only auto-save if form has content and is not being submitted
    if (formData.name && !isLoading) {
      const timer = setTimeout(() => {
        setLastSaved(new Date());
        // Note: In a real app, you'd save to localStorage or send to server
      }, 3000); // Auto-save after 3 seconds of inactivity

      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [formData, isLoading, autoSaveTimer]);

  // Phase 3: Workflow Enhancement - Keyboard Shortcuts & Quick Actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !isLoading) {
        e.preventDefault();
        (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.click();
      }

      // Ctrl/Cmd + D for duplicate (when editing)
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && isEditing) {
        e.preventDefault();
        // Reset form for duplication
        updateMultipleFields({
          ...formData,
          name: `${formData.name} (Copy)`,
          sku: "",
          slug: "",
        });
      }

      // Escape to close
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    isLoading,
    isEditing,
    onClose,
    formData, // Reset form for duplication
    updateMultipleFields,
  ]);

  // Memoized smart completion functions
  const generateMetaTitle = useCallback(() => {
    if (formData.name && !formData.metaTitle) {
      const category = categories.find((c) => c.id === formData.categoryId);
      const title = `${formData.name}${category ? ` - ${category.name}` : ""} | RUN APPAREL`;
      updateField("metaTitle", title.substring(0, 60));
    }
  }, [formData.name, formData.metaTitle, formData.categoryId, categories, updateField]);

  const generateMetaDescription = useCallback(() => {
    if (formData.description && !formData.metaDescription) {
      const fabric = fabrics.find((f) => f.id === formData.fabricId);
      const desc = `${formData.description.substring(0, 100)}${fabric ? ` Made with ${fabric.name}` : ""}. B2B sportswear manufacturing by RUN APPAREL.`;
      updateField("metaDescription", desc.substring(0, 160));
    }
  }, [formData.description, formData.metaDescription, formData.fabricId, fabrics, updateField]);

  // Phase 3: Progress Indicators - Comprehensive form completion tracking
  const calculateFormProgress = useCallback(() => {
    const sections = {
      basic: {
        name: "Basic Information",
        fields: ["name", "sku", "description"],
        completed: 0,
        total: 3,
        icon: Package,
      },
      categorization: {
        name: "Categorization",
        fields: ["categoryId", "fabricId"],
        completed: 0,
        total: 2,
        icon: Tag,
      },
      media: {
        name: "Media Assets",
        fields: ["primaryImageId", "imageIds", "videos"],
        completed: 0,
        total: 3,
        icon: Camera,
      },
      specifications: {
        name: "Technical Specs",
        fields: ["specifications", "minimumOrderQuantity", "leadTime"],
        completed: 0,
        total: 3,
        icon: Settings,
      },
      advanced: {
        name: "Advanced Features",
        fields: ["certificateIds", "accessoryIds", "customizationOptions"],
        completed: 0,
        total: 3,
        icon: Star,
      },
      seo: {
        name: "SEO & Marketing",
        fields: ["metaTitle", "metaDescription"],
        completed: 0,
        total: 2,
        icon: Search,
      },
    };

    // Calculate completion for each section
    Object.keys(sections).forEach((sectionKey) => {
      const section = sections[sectionKey as keyof typeof sections];
      section.completed = section.fields.reduce((count: number, field: string) => {
        const value = formData[field as keyof typeof formData];

        // Check if field has meaningful content
        if (field === "specifications" && Array.isArray(value)) {
          return (
            count +
            (value.length > 0 &&
            value.some(
              (spec: unknown) =>
                typeof spec === "object" &&
                spec !== null &&
                "name" in spec &&
                "value" in spec &&
                spec.name &&
                spec.value,
            )
              ? 1
              : 0)
          );
        }
        if (Array.isArray(value)) {
          return count + (value.length > 0 ? 1 : 0);
        }
        if (typeof value === "string") {
          return count + (value.trim().length > 0 ? 1 : 0);
        }
        if (typeof value === "number" && field !== "sortOrder") {
          return count + (value > 0 ? 1 : 0);
        }
        if (field === "sortOrder") {
          return count + 1; // sortOrder is always considered complete if present
        }
        return count + (value ? 1 : 0);
      }, 0);
    });

    const totalCompleted = Object.values(sections).reduce(
      (sum, section) => sum + section.completed,
      0,
    );
    const totalFields = Object.values(sections).reduce((sum, section) => sum + section.total, 0);
    const overallProgress = Math.round((totalCompleted / totalFields) * 100);

    return {
      sections,
      totalCompleted,
      totalFields,
      overallProgress,
    };
  }, [formData]);

  const progressData = useMemo(() => calculateFormProgress(), [calculateFormProgress]);

  // Mutations moved to earlier location to avoid temporal dead zone

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const validation = validateFormPure(formData);
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive",
      });
      return;
    }

    // Convert enhanced form data to API format
    const productData: InsertProduct = {
      // Basic Information
      name: formData.name || "",
      sku: formData.sku || "",
      description: formData.description || undefined,
      shortDescription: formData.shortDescription || undefined,
      slug: formData.slug || "",
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,

      // Category & Fabric
      categoryId: formData.categoryId!,
      fabricId: formData.fabricId,
      sizeChartId: formData.sizeChartId,
      fiberComposition:
        formData.selectedFiberComposition && formData.selectedFiberComposition.length > 0
          ? { selected: formData.selectedFiberComposition }
          : undefined,

      // Media Assets - Using correct schema fields
      primaryImageId: formData.primaryImageId,
      primaryVideoId: formData.primaryVideoId,
      imageIds: formData.imageIds.length > 0 ? formData.imageIds : undefined,
      videos:
        formData.videos.length > 0
          ? formData.videos
              .map((id) => {
                const asset = mediaAssets.find((m) => m.id === id);
                return asset
                  ? {
                      url: asset.url,
                      thumbnail: asset.url, // Video thumbnail same as URL for now
                      type: "video",
                      title: asset.filename,
                    }
                  : null;
              })
              .filter((v): v is NonNullable<typeof v> => v !== null)
          : undefined,
      modelFileId: formData.modelFileId,

      // Specifications & Features
      specifications: formData.specifications.length > 0 ? formData.specifications : undefined,
      technicalSpecs:
        Object.keys(formData.technicalSpecs || {}).length > 0 ? formData.technicalSpecs : undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      careInstructions:
        formData.careInstructions.length > 0 ? formData.careInstructions : undefined,

      // B2B Details
      minimumOrderQuantity: formData.minimumOrderQuantity
        ? parseInt(formData.minimumOrderQuantity, 10)
        : undefined,
      leadTime: formData.leadTime || undefined,
      customWeight: formData.customWeight || undefined,
      customFit: formData.customFit || undefined,

      // Customization
      customizationOptions:
        formData.customizationOptions && formData.customizationOptions.length > 0
          ? formData.customizationOptions
          : undefined,

      // Relationships
      certificateIds: formData.certificateIds.length > 0 ? formData.certificateIds : undefined,
      accessoryIds: formData.accessoryIds.length > 0 ? formData.accessoryIds : undefined,
      relatedProductIds:
        formData.relatedProductIds && formData.relatedProductIds.length > 0
          ? formData.relatedProductIds
          : undefined,

      // SEO & Marketing
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
    };

    if (isEditing && product?.id) {
      updateProductMutation.mutate({ id: product.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  // Remove duplicate isLoading declaration

  // Optimized handleInputChange with debounced validation
  const debouncedFieldValidation = useMemo(() => {
    const timeouts = new Map<string, NodeJS.Timeout>();

    return (field: string, value: unknown) => {
      // Clear existing timeout for this field
      const existingTimeout = timeouts.get(field);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout for validation
      const newTimeout = setTimeout(() => {
        const fieldError = validateField(field, value);
        setFormErrors((prev) => ({
          ...prev,
          [field]: fieldError,
        }));
        timeouts.delete(field);
      }, 300); // 300ms debounce

      timeouts.set(field, newTimeout);
    };
  }, [validateField]);

  const handleInputChange = useCallback(
    (field: string, value: unknown) => {
      updateField(field as keyof typeof formData, value as ProductFormFieldValue);

      // Debounced field validation to improve performance
      debouncedFieldValidation(field, value);
    },
    [updateField, debouncedFieldValidation],
  );

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

  // Utility functions for data relationships
  const getMediaAsset = (id: number) => {
    if (!Array.isArray(mediaAssets)) {
      return undefined;
    }
    return mediaAssets.find((m) => m && m.id === id);
  };

  // Normalize specifications to clean up legacy data with array index prefixes
  const normalizeSpecifications = (
    specs: string[] | Record<string, unknown> | undefined,
  ): string[] => {
    if (!specs) {
      return [];
    }

    // Convert object to array if needed (legacy data compatibility)
    let specsArray: string[];
    if (Array.isArray(specs)) {
      specsArray = specs;
    } else if (typeof specs === "object") {
      // Handle object-shaped specifications (legacy format)
      specsArray = Object.values(specs).map((v) => (typeof v === "string" ? v : String(v)));
    } else {
      return [];
    }

    // Clean up array index prefixes from each specification string
    return specsArray.map((spec) => {
      if (typeof spec !== "string") {
        return String(spec);
      }

      // Remove array index prefixes like "0: ", "1: ", "2: " etc.
      // Match digit(s) followed by colon and optional space at the start
      const cleanedSpec = spec.replace(/^\d+:\s*/, "");
      return cleanedSpec;
    });
  };

  // Phase 3: Accordion control with persistence (handled by useAccordionPersistence)

  // Section completion validation

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent contentType="form" aria-describedby="product-form-description">
        <VisuallyHidden.Root>
          <DialogTitle>Product Management Form</DialogTitle>
        </VisuallyHidden.Root>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" id="product-form-title">
            <Package className="h-5 w-5" />
            {isEditing ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription id="product-form-description">
            {isEditing
              ? "Update product information and media assets"
              : "Add a new product to your catalog with category, fabric, and media selections"}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="mb-4">
            {/* Detailed Section Progress */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {Object.entries(progressData.sections).map(([key, section]) => {
                const typedSection = section as SectionProgress;
                const IconComponent = typedSection.icon;
                const percentage = Math.round((typedSection.completed / typedSection.total) * 100);

                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-2 text-center ${
                      percentage === 100
                        ? "border-green-200 bg-green-50"
                        : percentage > 0
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-border bg-background"
                    }`}
                  >
                    <IconComponent
                      className={`mx-auto mb-1 h-4 w-4 ${
                        percentage === 100
                          ? "text-green-600"
                          : percentage > 0
                            ? "text-yellow-600"
                            : "text-muted-foreground/70"
                      }`}
                    />
                    <p className="text-foreground/80 mb-1 text-xs font-medium">
                      {typedSection.name}
                    </p>
                    <div className="center-flex gap-1 text-xs">
                      <span
                        className={
                          percentage === 100
                            ? "font-semibold text-green-600"
                            : percentage > 0
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                        }
                      >
                        {typedSection.completed}/{typedSection.total}
                      </span>
                      {percentage === 100 && <span className="text-green-600">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workflow Status Indicators */}
            <div className="flex gap-2 text-xs">
              {/* Auto-save Status */}
              {lastSaved && (
                <div className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-green-700">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Draft saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Auto-generation Indicators */}
              {formData.name && formData.slug && (
                <div className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-blue-700">
                  <Zap className="h-3 w-3" />
                  <span>Slug auto-generated</span>
                </div>
              )}

              {formData.name && formData.sku && !isEditing && (
                <div className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-purple-700">
                  <Zap className="h-3 w-3" />
                  <span>SKU auto-suggested</span>
                </div>
              )}
            </div>

            {/* Phase 3: Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Auto-generate meta tags */}
              {formData.name && formData.description && !formData.metaTitle && (
                <Button
                  data-testid="auto-generate-meta-title-button"
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generateMetaTitle}
                  className="text-xs"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Auto-generate Meta Title
                </Button>
              )}

              {formData.description && !formData.metaDescription && (
                <Button
                  data-testid="auto-generate-meta-description-button"
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generateMetaDescription}
                  className="text-xs"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Auto-generate Meta Description
                </Button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phase 5.1: Lazy-loaded sections with Suspense boundaries */}
            <Suspense
              fallback={
                <div className="bg-background animate-pulse rounded-lg border p-4">Loading...</div>
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
                  const newSlug = generateSlug(formData.name);
                  handleInputChange("slug", newSlug);
                }}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-background animate-pulse rounded-lg border p-4">Loading...</div>
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
                categories={categories || []}
                fabrics={fabrics || []}
                sizeCharts={sizeCharts || []}
                fibers={fibers || []}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-background animate-pulse rounded-lg border p-4">Loading...</div>
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
                <div className="bg-background animate-pulse rounded-lg border p-4">Loading...</div>
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
                <div className="bg-background animate-pulse rounded-lg border p-4">Loading...</div>
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
                certificates={certificates || []}
                accessories={accessories || []}
                products={
                  Array.isArray(allProducts)
                    ? allProducts.filter((p: Product) => p.id !== product?.id)
                    : []
                }
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="bg-background animate-pulse rounded-lg border p-4">Loading...</div>
              }
            >
              <CustomizationSection
                formData={{
                  customizationOptions: formData.customizationOptions || [],
                  metaTitle: formData.metaTitle,
                  metaDescription: formData.metaDescription,
                }}
                formErrors={formErrors}
                isOpen={!!accordionStates.customization}
                onToggle={() => toggleSection("customization")}
                onInputChange={handleInputChange}
                generateMetaTitle={generateMetaTitle}
                generateMetaDescription={generateMetaDescription}
              />
            </Suspense>

            {/* Phase 3: Enhanced Actions with Validation Status */}
            <div className="space-y-3 border-t pt-4">
              {/* Validation Status Summary */}
              {!validationSummary.isValid && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">
                    Fix {validationSummary.errorCount} error
                    {validationSummary.errorCount !== 1 ? "s" : ""}
                    {validationSummary.warningCount > 0 &&
                      ` and ${validationSummary.warningCount} warning${validationSummary.warningCount !== 1 ? "s" : ""}`}{" "}
                    before submitting
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  data-testid="product-form-cancel-button"
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  data-testid="product-form-submit-button"
                  type="submit"
                  className={`${
                    validationSummary.isValid
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  disabled={isLoading || !validationSummary.isValid}
                >
                  {validationSummary.isValid ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  {isLoading
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Product"
                      : "Create Product"}
                </Button>
              </div>
            </div>
          </form>

          {/* Unified Media Selection Dialog */}
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

export default ProductCreateEditModal;
