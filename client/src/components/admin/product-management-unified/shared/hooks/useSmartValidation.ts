import { useCallback, useMemo, useRef } from "react";
import type { ProductFormFieldValue } from "../types";

// UPGRADED: Using unified validation system (Phase 3.2 Integration)
interface ValidationResult {
	isValid: boolean;
	errors: Record<string, string>;
	warnings: Record<string, string>;
}

interface ValidationConfig {
	criticalFields: string[];
	validateOnBlur: boolean;
	validateOnSubmit: boolean;
	cacheResults: boolean;
}

const defaultConfig: ValidationConfig = {
	criticalFields: ["name", "sku"],
	validateOnBlur: true,
	validateOnSubmit: true,
	cacheResults: true,
};

export function useSmartValidation(config: Partial<ValidationConfig> = {}) {
	const mergedConfig = { ...defaultConfig, ...config };
	const validationCache = useRef<Map<string, ValidationResult>>(new Map());
	const validationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

	// ENHANCED: Using unified validation system for critical fields
	const validateCriticalField = useCallback(
		(field: string, value: ProductFormFieldValue): string | null => {
			// Basic validation from unified system (sync version)
			switch (field) {
				case "name":
					if (typeof value !== "string" || !value || value.trim().length === 0)
						return "Product name is required";
					if (value.length < 3)
						return "Product name must be at least 3 characters";
					if (value.length > 100)
						return "Product name must be less than 100 characters";
					return null;

				case "sku":
					if (typeof value !== "string" || !value || value.trim().length === 0)
						return "SKU is required";
					if (!/^[A-Z0-9_-]+$/i.test(value))
						return "SKU can only contain letters, numbers, hyphens and underscores";
					if (value.length > 50) return "SKU must be less than 50 characters";
					return null;

				default:
					return null;
			}
		},
		[],
	);

	// Non-critical field validation (deferred)
	const validateNonCriticalField = useCallback(
		(field: string, value: ProductFormFieldValue): string | null => {
			switch (field) {
				case "description":
					if (typeof value === "string" && value.length > 5000)
						return "Description must be less than 5000 characters";
					return null;

				case "minimumOrderQuantity":
					if (
						typeof value === "string" &&
						value &&
						(isNaN(Number(value)) || parseInt(value) < 1)
					)
						return "MOQ must be a positive number";
					return null;

				case "leadTime":
					if (typeof value === "string" && value.length > 100)
						return "Lead time must be less than 100 characters";
					return null;

				case "metaTitle":
					if (typeof value === "string" && value.length > 60)
						return "Meta title should be less than 60 characters for SEO";
					return null;

				case "metaDescription":
					if (typeof value === "string" && value.length > 160)
						return "Meta description should be less than 160 characters for SEO";
					return null;

				default:
					return null;
			}
		},
		[],
	);

	// Smart validation with caching
	const validateField = useCallback(
		(
			field: string,
			value: ProductFormFieldValue,
			immediate = false,
		): string | null | Promise<string | null> => {
			// Check cache first
			if (mergedConfig.cacheResults) {
				const cacheKey = `${field}:${JSON.stringify(value)}`;
				const cached = validationCache.current.get(cacheKey);
				if (cached) {
					return cached.errors[field] || null;
				}
			}

			// Clear existing timer for this field
			const existingTimer = validationTimers.current.get(field);
			if (existingTimer) {
				clearTimeout(existingTimer);
			}

			// Immediate validation for critical fields
			if (mergedConfig.criticalFields.includes(field) || immediate) {
				const error = validateCriticalField(field, value);

				// Cache result
				if (mergedConfig.cacheResults) {
					const cacheKey = `${field}:${JSON.stringify(value)}`;
					validationCache.current.set(cacheKey, {
						isValid: !error,
						errors: error ? { [field]: error } : {},
						warnings: {},
					});
				}

				return error;
			}

			// Deferred validation for non-critical fields
			return new Promise<string | null>((resolve) => {
				const timer = setTimeout(() => {
					const error = validateNonCriticalField(field, value);

					// Cache result
					if (mergedConfig.cacheResults) {
						const cacheKey = `${field}:${JSON.stringify(value)}`;
						validationCache.current.set(cacheKey, {
							isValid: !error,
							errors: error ? { [field]: error } : {},
							warnings: {},
						});
					}

					resolve(error);
				}, 500); // 500ms delay for non-critical fields

				validationTimers.current.set(field, timer);
			});
		},
		[mergedConfig, validateCriticalField, validateNonCriticalField],
	);

	// Batch validation for form submission
	const validateForm = useCallback(
		async (
			formData: Record<string, ProductFormFieldValue>,
		): Promise<ValidationResult> => {
			const errors: Record<string, string> = {};
			const warnings: Record<string, string> = {};

			// Validate all fields in parallel
			const validationPromises = Object.entries(formData).map(
				async ([field, value]) => {
					const error = await validateField(field, value, true);
					if (error) {
						errors[field] = error;
					}
				},
			);

			await Promise.all(validationPromises);

			return {
				isValid: Object.keys(errors).length === 0,
				errors,
				warnings,
			};
		},
		[validateField],
	);

	// Clear validation cache
	const clearCache = useCallback(() => {
		validationCache.current.clear();
	}, []);

	// Clear all timers on cleanup
	const clearTimers = useCallback(() => {
		validationTimers.current.forEach((timer) => clearTimeout(timer));
		validationTimers.current.clear();
	}, []);

	// Memoized validation state
	const validationState = useMemo(
		() => ({
			cacheSize: validationCache.current.size,
			pendingValidations: validationTimers.current.size,
		}),
		[validationCache.current.size, validationTimers.current.size],
	);

	return {
		validateField,
		validateForm,
		clearCache,
		clearTimers,
		validationState,
	};
}
