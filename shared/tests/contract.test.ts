import { describe, expect, it } from "vitest";
import { insertProductSchema } from "../schemas/products";

describe("Schema Contracts", () => {
  it("insert product schema accepts valid payload", () => {
    const validProduct = {
      name: "Test Product",
      slug: "test-product",
      sku: "SKU-001",
      categoryId: 1,
      // Optional fields omitted
    };

    const result = insertProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("insert product schema rejects invalid payload", () => {
    const invalidProduct = {
      name: "Test Product",
      // Missing required fields
    };

    const result = insertProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});
