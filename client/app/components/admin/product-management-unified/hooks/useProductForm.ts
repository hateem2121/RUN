import type { Product } from "@shared/index";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useAccordionPersistence } from "../shared/hooks/useAccordionPersistence";

// Simple debounce utility - avoids external dependency
function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => unknown,
  delay: number,
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: TArgs) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Section keys matching the 6 form sections
export type SectionKey =
  | "basic"
  | "categorization"
  | "media"
  | "specifications"
  | "advanced"
  | "seo";

// Full state interface — aligned with existing modal field names
// Uses the same field names and types as the old shared/hooks version
// to maintain backward compatibility with all section components
export interface ProductFormState {
  // Basic Information
  name: string;
  sku: string;
  description: string;
  shortDescription: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;

  // Category & Fabric
  categoryId: number | null;
  fabricId: number | null;
  sizeChartId: number | null;
  selectedFiberComposition: number[];

  // Media Assets
  primaryImageId: number | null;
  primaryVideoId: number | null;
  imageIds: number[];
  videos: number[];
  modelFileId: number | null;

  // Specifications & Features
  specifications: string[];
  technicalSpecs: Record<string, string>;
  tags: string[];
  careInstructions: string[];

  // B2B Details
  minimumOrderQuantity: string;
  leadTime: string;

  // Custom fields
  customWeight: string;
  customFit: string;
  customizationOptions: string[];

  // Relationships
  certificateIds: number[];
  accessoryIds: number[];
  relatedProductIds: number[];

  // SEO & Marketing
  metaTitle: string;
  metaDescription: string;
}

// ─── Reducer ────────────────────────────────────────────────────────────────

type ProductFormAction =
  | {
      type: "SET_FIELD";
      field: keyof ProductFormState;
      value:
        | ProductFormState[keyof ProductFormState]
        | Record<string, unknown>
        | Record<string, unknown>[];
    }
  | { type: "SET_MULTIPLE_FIELDS"; fields: Partial<ProductFormState> }
  | { type: "RESET_FORM" }
  | { type: "LOAD_PRODUCT"; product: Product }
  | { type: "GENERATE_SLUG"; name: string }
  | {
      type: "ADD_TO_ARRAY";
      field: keyof ProductFormState;
      value:
        | ProductFormState[keyof ProductFormState]
        | Record<string, unknown>
        | Record<string, unknown>[];
    }
  | { type: "REMOVE_FROM_ARRAY"; field: keyof ProductFormState; index: number };

const initialState: ProductFormState = {
  name: "",
  sku: "",
  description: "",
  shortDescription: "",
  slug: "",
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
  categoryId: null,
  fabricId: null,
  sizeChartId: null,
  selectedFiberComposition: [],
  primaryImageId: null,
  primaryVideoId: null,
  imageIds: [],
  videos: [],
  modelFileId: null,
  specifications: [],
  technicalSpecs: {},
  tags: [],
  careInstructions: [],
  minimumOrderQuantity: "",
  leadTime: "",
  customWeight: "",
  customFit: "",
  customizationOptions: [],
  certificateIds: [],
  accessoryIds: [],
  relatedProductIds: [],
  metaTitle: "",
  metaDescription: "",
};

function productFormReducer(state: ProductFormState, action: ProductFormAction): ProductFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_MULTIPLE_FIELDS":
      return { ...state, ...action.fields };

    case "RESET_FORM":
      return initialState;

    case "LOAD_PRODUCT": {
      const p = action.product as Product & {
        sortOrder?: number;
        selectedFiberComposition?: number[];
        technicalSpecs?: Record<string, string>;
        careInstructions?: string[];
        customizationOptions?: string[];
        relatedProductIds?: number[];
      };
      return {
        name: p.name || "",
        sku: p.sku || "",
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        slug: p.slug || "",
        sortOrder: p.sortOrder || 0,
        isActive: p.isActive ?? true,
        isFeatured: p.isFeatured ?? false,
        categoryId: p.categoryId || null,
        fabricId: p.fabricId || null,
        sizeChartId: p.sizeChartId || null,
        selectedFiberComposition: p.selectedFiberComposition || [],
        primaryImageId: p.primaryImageId || null,
        primaryVideoId: p.primaryVideoId || null,
        imageIds: p.imageIds || [],
        videos: Array.isArray(p.videos)
          ? p.videos
              .map((v) =>
                typeof v === "number"
                  ? v
                  : typeof v === "object" && v && "id" in v
                    ? (v as { id: number }).id
                    : 0,
              )
              .filter((id) => id !== 0)
          : [],
        modelFileId: p.modelFileId || null,
        specifications: Array.isArray(p.specifications)
          ? p.specifications
          : p.specifications && typeof p.specifications === "object"
            ? Object.values(p.specifications as Record<string, string>)
            : [],
        technicalSpecs: p.technicalSpecs || {},
        tags: p.tags || [],
        careInstructions: p.careInstructions || [],
        minimumOrderQuantity: String(p.minimumOrderQuantity || ""),
        leadTime: p.leadTime || "",
        customWeight: (p as Product & { customWeight?: string }).customWeight || "",
        customFit: (p as Product & { customFit?: string }).customFit || "",
        customizationOptions: p.customizationOptions || [],
        certificateIds: p.certificateIds || [],
        accessoryIds: p.accessoryIds || [],
        relatedProductIds: p.relatedProductIds || [],
        metaTitle: p.metaTitle || "",
        metaDescription: p.metaDescription || "",
      };
    }

    case "GENERATE_SLUG":
      return {
        ...state,
        slug: action.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      };

    case "ADD_TO_ARRAY": {
      const current = state[action.field];
      if (!Array.isArray(current)) return state;
      return { ...state, [action.field]: [...current, action.value] };
    }

    case "REMOVE_FROM_ARRAY": {
      const current = state[action.field];
      if (!Array.isArray(current)) return state;
      return {
        ...state,
        [action.field]: current.filter((_, i) => i !== action.index),
      };
    }

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProductForm(product?: Product | null) {
  const [formData, dispatch] = useReducer(productFormReducer, initialState);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  // Accordion state — persisted to localStorage (UI state only, NOT form data)
  const accordionHelper = useAccordionPersistence("product-form-accordion-states");

  // ── Load / Reset when product prop changes ──────────────────────────────
  useEffect(() => {
    if (product) {
      dispatch({ type: "LOAD_PRODUCT", product });
    } else {
      dispatch({ type: "RESET_FORM" });
    }
  }, [product]);

  // ── Slug auto-generation (debounced, with API uniqueness check placeholder) ──
  const generateSlugAndCheck = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setIsGeneratingSlug(true);

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    try {
      // TODO: call GET /api/v1/admin/products/check-slug?slug={baseSlug}&excludeId={product?.id}
      // and append suffix if taken (e.g. baseSlug + "-2")
      dispatch({ type: "SET_FIELD", field: "slug", value: baseSlug });
    } catch {
      dispatch({ type: "SET_FIELD", field: "slug", value: baseSlug });
    } finally {
      setIsGeneratingSlug(false);
    }
  }, []);

  const debouncedGenerateSlug = useMemo(
    () => debounce(generateSlugAndCheck, 500),
    [generateSlugAndCheck],
  );

  // ── SKU auto-suggestion (debounced, create mode only) ───────────────────
  const generateSku = useCallback(
    (name: string) => {
      if (!name.trim() || formData.sku) return;
      // e.g. "Premium Running Tee" → "RUN-PRT-001"
      const words = name.trim().split(/\s+/);
      const initials =
        words.length === 1 && words[0]
          ? words[0].substring(0, 3).toUpperCase()
          : words
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("")
              .substring(0, 3);
      const suffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      dispatch({
        type: "SET_FIELD",
        field: "sku",
        value: `RUN-${initials}-${suffix}`,
      });
    },
    [formData.sku],
  );

  const debouncedGenerateSku = useMemo(() => debounce(generateSku, 500), [generateSku]);

  // ── Field update — triggers auto-generation on name in create mode ──────
  const updateField = useCallback(
    (
      field: keyof ProductFormState,
      value:
        | ProductFormState[keyof ProductFormState]
        | Record<string, unknown>
        | Record<string, unknown>[],
    ) => {
      dispatch({ type: "SET_FIELD", field, value });
      if (!product && field === "name" && typeof value === "string") {
        debouncedGenerateSlug(value);
        debouncedGenerateSku(value);
      }
    },
    [product, debouncedGenerateSlug, debouncedGenerateSku],
  );

  const updateMultipleFields = useCallback((fields: Partial<ProductFormState>) => {
    dispatch({ type: "SET_MULTIPLE_FIELDS", fields });
  }, []);

  const addToArray = useCallback(
    (
      field: keyof ProductFormState,
      value:
        | ProductFormState[keyof ProductFormState]
        | Record<string, unknown>
        | Record<string, unknown>[],
    ) => {
      dispatch({ type: "ADD_TO_ARRAY", field, value });
    },
    [],
  );

  const removeFromArray = useCallback((field: keyof ProductFormState, index: number) => {
    dispatch({ type: "REMOVE_FROM_ARRAY", field, index });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: "RESET_FORM" });
  }, []);

  // ── Per-section completion indicator ────────────────────────────────────
  const isSectionComplete = useCallback(
    (section: SectionKey): boolean => {
      switch (section) {
        case "basic":
          return !!(formData.name?.trim() && formData.sku?.trim() && formData.slug?.trim());
        case "categorization":
          return !!formData.categoryId;
        case "media":
          return !!(formData.primaryImageId || formData.imageIds.length > 0);
        case "specifications":
          return (
            formData.specifications.length > 0 ||
            Object.keys(formData.technicalSpecs || {}).length > 0
          );
        case "advanced":
          return formData.certificateIds.length > 0 || formData.customizationOptions.length > 0;
        case "seo":
          return !!(formData.metaTitle?.trim() && formData.metaDescription?.trim());
        default:
          return false;
      }
    },
    [formData],
  );

  return {
    formData,
    updateField,
    updateMultipleFields,
    addToArray,
    removeFromArray,
    resetForm,
    isSectionComplete,
    accordionHelper,
    isGeneratingSlug,
  };
}
