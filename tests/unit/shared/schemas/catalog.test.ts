import { describe, expect, it } from "vitest";
import { accessories, certificates, sizeCharts } from "../../../../shared/schemas/catalog.js";

describe("Catalog Schemas", () => {
  describe("certificates", () => {
    it("should define an onUpdate function for updatedAt that returns a Date", () => {
      const onUpdateFn = certificates.updatedAt.onUpdateFn;
      expect(onUpdateFn).toBeDefined();
      if (onUpdateFn) {
        expect(onUpdateFn()).toBeInstanceOf(Date);
      }
    });

    it("should have relation fields defined", () => {
      expect(certificates.imageId).toBeDefined();
      expect(certificates.documentId).toBeDefined();
    });
  });

  describe("sizeCharts", () => {
    it("should define an onUpdate function for updatedAt that returns a Date", () => {
      const onUpdateFn = sizeCharts.updatedAt.onUpdateFn;
      expect(onUpdateFn).toBeDefined();
      if (onUpdateFn) {
        expect(onUpdateFn()).toBeInstanceOf(Date);
      }
    });

    it("should have relation fields defined", () => {
      expect(sizeCharts.imageId).toBeDefined();
    });
  });

  describe("accessories", () => {
    it("should define an onUpdate function for updatedAt that returns a Date", () => {
      const onUpdateFn = accessories.updatedAt.onUpdateFn;
      expect(onUpdateFn).toBeDefined();
      if (onUpdateFn) {
        expect(onUpdateFn()).toBeInstanceOf(Date);
      }
    });

    it("should have relation fields defined", () => {
      expect(accessories.imageId).toBeDefined();
    });
  });
});
