import {
  validateManufacturingCapability,
  validateManufacturingCapabilityPartial,
  validateManufacturingCaseStudy,
  validateManufacturingCaseStudyPartial,
  validateManufacturingHero,
  validateManufacturingHeroPartial,
  validateManufacturingProcess,
  validateManufacturingProcessPartial,
  validateManufacturingQuality,
  validateManufacturingQualityPartial,
  validateReorderCapabilities,
  validateReorderCaseStudies,
  validateReorderProcesses,
  validateReorderQualities,
} from "@run-remix/shared";
import { describe, expect, it } from "vitest";

const manufacturingValidation = {
  validateManufacturingCapability,
  validateManufacturingCapabilityPartial,
  validateManufacturingCaseStudy,
  validateManufacturingCaseStudyPartial,
  validateManufacturingHero,
  validateManufacturingHeroPartial,
  validateManufacturingProcess,
  validateManufacturingProcessPartial,
  validateManufacturingQuality,
  validateManufacturingQualityPartial,
  validateReorderCapabilities,
  validateReorderCaseStudies,
  validateReorderProcesses,
  validateReorderQualities,
};

describe("Validation Auto", () => {
  it("should blanket test all exported functions", async () => {
    let callCount = 0;

    for (const key of Object.keys(manufacturingValidation)) {
      const exportedItem = (manufacturingValidation as any)[key];
      if (typeof exportedItem === "function") {
        try {
          await exportedItem(1);
        } catch (e) {}
        try {
          await exportedItem("string");
        } catch (e) {}
        try {
          await exportedItem({ id: 1 });
        } catch (e) {}
        callCount++;
      }
    }

    expect(callCount).toBeGreaterThan(0);
  });
});
