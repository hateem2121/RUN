import { describe, expect, it } from "vitest";
import * as about from "../../schemas/content/about.js";
import * as common from "../../schemas/content/common.js";
import * as home from "../../schemas/content/home.js";
import * as legal from "../../schemas/content/legal.js";
import * as manufacturing from "../../schemas/content/manufacturing.js";
import * as services from "../../schemas/content/services.js";
import * as sustainability from "../../schemas/content/sustainability.js";
import * as technology from "../../schemas/content/technology.js";

const modules = [about, common, home, legal, manufacturing, services, sustainability, technology];

describe("Content Schemas", () => {
  describe("onUpdateFn", () => {
    it("should define an onUpdate function for updatedAt if the table has it", () => {
      modules.forEach((mod) => {
        Object.entries(mod).forEach(([_key, exportVal]) => {
          // Check if it's a Drizzle table (has Symbol properties or internal state)
          // The easiest way is to check if it's an object with an `updatedAt` property
          if (exportVal && typeof exportVal === "object") {
            const table = exportVal as any;
            if (table.updatedAt?.onUpdateFn) {
              const onUpdateFn = table.updatedAt.onUpdateFn;
              expect(onUpdateFn).toBeDefined();
              expect(onUpdateFn()).toBeInstanceOf(Date);
            }
          }
        });
      });
    });
  });

  describe("relation fields", () => {
    it("should test basic relations on tables to ensure they are parsed", () => {
      // Just check a few specific known ones to ensure they actually evaluate their relations
      expect((about.aboutHero as any).imageId).toBeDefined();
      expect((home.homepageHero as any).backgroundImageId).toBeDefined();
      expect((manufacturing.manufacturingHero as any).imageId).toBeDefined();
      expect((sustainability.sustainabilityHero as any).imageId).toBeDefined();
      expect((technology.technologyHero as any).imageId).toBeDefined();
    });
  });
});
