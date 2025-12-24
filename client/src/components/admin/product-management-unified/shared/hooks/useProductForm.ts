import type { Product } from "@shared/schema";
import { useCallback, useEffect, useReducer } from "react";
import { logger } from "../logger";
import type { ProductFormFieldValue } from "../types";

// Product form state interface
interface ProductFormState {
	// Basic Information (ALIGNED: with actual schema)
	name: string;
	sku: string;
	description: string;
	shortDescription: string;
	slug: string;
	isActive: boolean;
	isFeatured: boolean;
	sortOrder: number;

	// Category & Fabric (ALIGNED: with actual schema)
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

	// Specifications & Features (ALIGNED: with actual schema)
	specifications: string[];
	technicalSpecs: Record<string, string>;
	tags: string[];
	careInstructions: string[];

	// B2B Details (ALIGNED: with actual schema)
	minimumOrderQuantity: string;
	leadTime: string;

	// Custom fields (ALIGNED: with actual schema)
	customWeight: string;
	customFit: string;
	customizationOptions: string[];

	// Relationships (ALIGNED: with actual schema)
	certificateIds: number[];
	accessoryIds: number[];
	relatedProductIds: number[];

	// SEO & Marketing
	metaTitle: string;
	metaDescription: string;
}

// Form action types
type ProductFormAction =
	| {
			type: "SET_FIELD";
			field: keyof ProductFormState;
			value: ProductFormFieldValue;
	  }
	| { type: "SET_MULTIPLE_FIELDS"; fields: Partial<ProductFormState> }
	| { type: "RESET_FORM" }
	| { type: "LOAD_PRODUCT"; product: Product }
	| { type: "GENERATE_SLUG"; name: string }
	| {
			type: "ADD_TO_ARRAY";
			field: keyof ProductFormState;
			value: ProductFormFieldValue;
	  }
	| { type: "REMOVE_FROM_ARRAY"; field: keyof ProductFormState; index: number };

// Initial state
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

// Reducer function
function productFormReducer(
	state: ProductFormState,
	action: ProductFormAction,
): ProductFormState {
	switch (action.type) {
		case "SET_FIELD":
			return {
				...state,
				[action.field]: action.value,
			};

		case "SET_MULTIPLE_FIELDS":
			return {
				...state,
				...action.fields,
			};

		case "RESET_FORM":
			return initialState;

		case "LOAD_PRODUCT": {
			const product = action.product as Product & {
				sortOrder?: number;
				selectedFiberComposition?: number[];
				technicalSpecs?: Record<string, string>;
				careInstructions?: string[];
				customizationOptions?: Array<{
					name?: string;
					value?: string;
					[key: string]: unknown;
				}>;
				relatedProductIds?: number[];
			};

			return {
				name: product.name || "",
				sku: product.sku || "",
				description: product.description || "",
				shortDescription: product.shortDescription || "",
				slug: product.slug || "",
				sortOrder: product.sortOrder || 0,
				isActive: product.isActive ?? true,
				isFeatured: product.isFeatured ?? false,
				categoryId: product.categoryId || null,
				fabricId: product.fabricId || null,
				sizeChartId: product.sizeChartId || null,
				selectedFiberComposition: product.selectedFiberComposition || [],
				primaryImageId: product.primaryImageId || null,
				primaryVideoId: product.primaryVideoId || null,
				imageIds: product.imageIds || [],
				videos: Array.isArray(product.videos)
					? product.videos
							.map((v) =>
								typeof v === "number"
									? v
									: typeof v === "object" && v?.id
										? v.id
										: 0,
							)
							.filter((id) => id !== 0)
					: [],
				modelFileId: product.modelFileId || null,
				specifications: Array.isArray(product.specifications)
					? product.specifications
					: product.specifications && typeof product.specifications === "object"
						? Object.values(product.specifications)
						: [],
				technicalSpecs: product.technicalSpecs || {},
				tags: product.tags || [],
				careInstructions: product.careInstructions || [],
				minimumOrderQuantity: String(product.minimumOrderQuantity || ""),
				leadTime: product.leadTime || "",
				customWeight: product.customWeight || "",
				customFit: product.customFit || "",
				customizationOptions: product.customizationOptions || [],
				certificateIds: product.certificateIds || [],
				accessoryIds: product.accessoryIds || [],
				relatedProductIds: product.relatedProductIds || [],
				metaTitle: product.metaTitle || "",
				metaDescription: product.metaDescription || "",
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
			const currentValue = state[action.field];
			if (!Array.isArray(currentValue)) {
				return state;
			}
			return {
				...state,
				[action.field]: [...currentValue, action.value],
			};
		}

		case "REMOVE_FROM_ARRAY": {
			const currentValue = state[action.field];
			if (!Array.isArray(currentValue)) {
				return state;
			}
			return {
				...state,
				[action.field]: currentValue.filter((_, i) => i !== action.index),
			};
		}

		default:
			return state;
	}
}

// Custom hook
export function useProductForm(product?: Product | null) {
	const [state, dispatch] = useReducer(productFormReducer, initialState);

	// Load product data when product prop changes
	useEffect(() => {
		if (product) {
			logger.debug("Loading product data into form", { productId: product.id });
			dispatch({ type: "LOAD_PRODUCT", product });
		} else {
			dispatch({ type: "RESET_FORM" });
		}
	}, [product]);

	// Optimized field update function
	const updateField = useCallback(
		(field: keyof ProductFormState, value: ProductFormFieldValue) => {
			dispatch({ type: "SET_FIELD", field, value });

			// Auto-generate slug when name changes
			if (field === "name" && typeof value === "string") {
				dispatch({ type: "GENERATE_SLUG", name: value });
			}
		},
		[],
	);

	// Batch field updates
	const updateMultipleFields = useCallback(
		(fields: Partial<ProductFormState>) => {
			dispatch({ type: "SET_MULTIPLE_FIELDS", fields });
		},
		[],
	);

	// Array manipulation helpers
	const addToArray = useCallback(
		(field: keyof ProductFormState, value: ProductFormFieldValue) => {
			dispatch({ type: "ADD_TO_ARRAY", field, value });
		},
		[],
	);

	const removeFromArray = useCallback(
		(field: keyof ProductFormState, index: number) => {
			dispatch({ type: "REMOVE_FROM_ARRAY", field, index });
		},
		[],
	);

	// Reset form
	const resetForm = useCallback(() => {
		dispatch({ type: "RESET_FORM" });
	}, []);

	return {
		formData: state,
		updateField,
		updateMultipleFields,
		addToArray,
		removeFromArray,
		resetForm,
	};
}
