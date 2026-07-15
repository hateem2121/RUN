import { describe, expect, it } from "vitest";
import {
  productValidationSchema,
  productWarningSchema,
} from "../../../../shared/schemas/product-validation.js";

describe("productValidationSchema", () => {
  const getValidProduct = () => ({
    name: "Valid Product",
    sku: "SKU-123",
    description: "This is a valid product description with more than 20 characters.",
    slug: "valid-product",
    categoryId: 1,
    primaryImageId: 1,
  });

  describe("minimumOrderQuantity refinement", () => {
    it("should accept valid positive numbers", () => {
      const result = productValidationSchema.safeParse({
        ...getValidProduct(),
        minimumOrderQuantity: "10",
      });
      expect(result.success).toBe(true);
    });

    it("should reject non-positive numbers", () => {
      const result = productValidationSchema.safeParse({
        ...getValidProduct(),
        minimumOrderQuantity: "0",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Minimum order quantity must be a positive number",
        );
      }
    });

    it("should reject invalid numbers", () => {
      const result = productValidationSchema.safeParse({
        ...getValidProduct(),
        minimumOrderQuantity: "abc",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("leadTime refinement", () => {
    it("should accept detailed lead time", () => {
      const result = productValidationSchema.safeParse({
        ...getValidProduct(),
        leadTime: "2-3 weeks",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short lead time", () => {
      const result = productValidationSchema.safeParse({
        ...getValidProduct(),
        leadTime: "2w",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("more detailed");
      }
    });
  });

  describe("superRefine logic", () => {
    it("should reject if fabricId is provided without selectedFiberComposition", () => {
      const result = productValidationSchema.safeParse({
        ...getValidProduct(),
        fabricId: 1,
        selectedFiberComposition: " ",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("selectedFiberComposition"));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe("Fiber composition must be selected when fabric is chosen");
      }
    });

    it("should reject if no images are provided", () => {
      const invalidProduct = getValidProduct();
      delete (invalidProduct as any).primaryImageId;

      const result = productValidationSchema.safeParse({
        ...invalidProduct,
        imageIds: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("images"));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe("At least one product image is required");
      }
    });
  });
});

describe("productWarningSchema", () => {
  it("should validate technicalSpecs correctly", () => {
    const validResult = productWarningSchema.safeParse({
      certificateIds: [1],
      technicalSpecs: { key: "value" },
    });
    expect(validResult.success).toBe(true);

    const invalidResult = productWarningSchema.safeParse({
      certificateIds: [1],
      technicalSpecs: {},
    });
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues[0].message).toContain("Technical specifications help");
    }
  });
});
