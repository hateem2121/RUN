import { useCallback, useState } from "react";

export interface ValidationRule {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	custom?: (value: any) => boolean;
	message: string;
}

export interface ValidationSchema {
	[field: string]: ValidationRule[];
}

export interface ValidationState {
	isValid: boolean;
	message: string;
}

export interface ValidationErrors {
	[field: string]: ValidationState;
}

export function useFormValidation(schema: ValidationSchema) {
	const [errors, setErrors] = useState<ValidationErrors>(() => {
		const initialErrors: ValidationErrors = {};
		Object.keys(schema).forEach((field) => {
			initialErrors[field] = { isValid: true, message: "" };
		});
		return initialErrors;
	});

	const validateField = useCallback(
		(field: string, value: any): ValidationState => {
			const rules = schema[field];
			if (!rules) {
				return { isValid: true, message: "" };
			}

			for (const rule of rules) {
				// Required validation
				if (rule.required) {
					const stringValue = String(value || "").trim();
					if (!stringValue) {
						return { isValid: false, message: rule.message };
					}
				}

				// Min length validation
				if (rule.minLength !== undefined) {
					const stringValue = String(value || "");
					if (stringValue.length < rule.minLength) {
						return { isValid: false, message: rule.message };
					}
				}

				// Max length validation
				if (rule.maxLength !== undefined) {
					const stringValue = String(value || "");
					if (stringValue.length > rule.maxLength) {
						return { isValid: false, message: rule.message };
					}
				}

				// Pattern validation
				if (rule.pattern) {
					const stringValue = String(value || "");
					if (stringValue && !rule.pattern.test(stringValue)) {
						return { isValid: false, message: rule.message };
					}
				}

				// Custom validation
				if (rule.custom) {
					if (!rule.custom(value)) {
						return { isValid: false, message: rule.message };
					}
				}
			}

			return { isValid: true, message: "" };
		},
		[schema],
	);

	const validate = useCallback(
		(field: string, value: any) => {
			const result = validateField(field, value);
			setErrors((prev) => ({
				...prev,
				[field]: result,
			}));
			return result.isValid;
		},
		[validateField],
	);

	const validateAll = useCallback(
		(values: Record<string, any>): boolean => {
			const newErrors: ValidationErrors = {};
			let isFormValid = true;

			Object.keys(schema).forEach((field) => {
				const result = validateField(field, values[field]);
				newErrors[field] = result;
				if (!result.isValid) {
					isFormValid = false;
				}
			});

			setErrors(newErrors);
			return isFormValid;
		},
		[schema, validateField],
	);

	const resetValidation = useCallback(() => {
		const resetErrors: ValidationErrors = {};
		Object.keys(schema).forEach((field) => {
			resetErrors[field] = { isValid: true, message: "" };
		});
		setErrors(resetErrors);
	}, [schema]);

	return {
		errors,
		validate,
		validateAll,
		resetValidation,
	};
}
