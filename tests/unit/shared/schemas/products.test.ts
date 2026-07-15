import { describe, expect, it } from "vitest";
import { productRelations, products } from "../../../../shared/schemas/products.js";

describe("Products Schemas", () => {
  describe("products", () => {
    it("should define an onUpdate function for updatedAt that returns a Date", () => {
      const onUpdateFn = products.updatedAt.onUpdateFn;
      expect(onUpdateFn).toBeDefined();
      if (onUpdateFn) {
        expect(onUpdateFn()).toBeInstanceOf(Date);
      }
    });

    it("should have relation fields defined", () => {
      expect(products.categoryId).toBeDefined();
      expect(products.primaryImageId).toBeDefined();
      expect(products.primaryVideoId).toBeDefined();
      expect(products.modelFileId).toBeDefined();
      expect(products.fabricId).toBeDefined();
      expect(products.sizeChartId).toBeDefined();
    });
  });

  describe("productRelations", () => {
    it("should have relation fields defined", () => {
      expect(productRelations.productId).toBeDefined();
      expect(productRelations.relatedProductId).toBeDefined();
    });
  });
});
