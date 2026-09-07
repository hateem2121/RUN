import type { ProductDetail, ProductSummary } from "@run-remix/shared";
import { describe, expect, it } from "vitest";
import {
  createBreadcrumbSchema,
  createOrganizationSchema,
  createProductSchema,
} from "../../client/app/lib/seo-structured-data";

describe("SEO Structured Data (JSON-LD)", () => {
  describe("createOrganizationSchema", () => {
    it("generates valid schema.org Organization and Manufacturer metadata", () => {
      const schema = createOrganizationSchema();

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toEqual(["Organization", "Manufacturer"]);
      expect(schema.name).toBe("RUN APPAREL (PVT) LTD");
      expect(schema.alternateName).toBe("RUN APPAREL");
      expect(schema.url).toBe("https://wear-run.com");
      expect(schema.logo).toBe("https://wear-run.com/logo.webp");
      expect(schema.address).toEqual({
        "@type": "PostalAddress",
        addressLocality: "Sialkot",
        addressRegion: "Punjab",
        addressCountry: "PK",
      });
      expect(schema.geo).toEqual({
        "@type": "GeoCoordinates",
        latitude: 32.4945,
        longitude: 74.5229,
      });
      expect(schema.contactPoint).toEqual({
        "@type": "ContactPoint",
        contactType: "sales",
        url: "https://wear-run.com/contact",
      });
    });

    it("respects custom baseUrl option", () => {
      const schema = createOrganizationSchema({ baseUrl: "https://staging.wear-run.com" });
      expect(schema.url).toBe("https://staging.wear-run.com");
      expect(schema.logo).toBe("https://staging.wear-run.com/logo.webp");
      expect(schema.contactPoint.url).toBe("https://staging.wear-run.com/contact");
    });
  });

  describe("createProductSchema", () => {
    const mockProductSummary: ProductSummary = {
      id: 101,
      name: "Pro Performance Aero Jersey",
      slug: "pro-performance-aero-jersey",
      sku: "RUN-AERO-01",
      description: "Elite aerodynamic race jersey engineered from recycled Italian fabrics.",
      shortDescription: "Elite aerodynamic race jersey.",
      primaryImageId: 1,
      primaryVideoId: null,
      imageIds: [1, 2],
      videos: null,
      minimumOrderQuantity: 75,
      leadTime: "3-4 weeks",
      careInstructions: "Machine wash cold",
      technicalSpecs: { weight: "120gsm", airflow: "high" },
      customFit: "Aero Fit",
      fiberComposition: "85% Recycled Polyester, 15% Elastane",
      specifications: { composition: "recycled" },
      isActive: true,
      isFeatured: true,
      categoryId: 5,
      fabricId: 2,
      certificateIds: [1],
      sizeChartId: 3,
      accessoryIds: [],
      tags: ["cycling", "aero"],
      urlPath: "/products/cycling/pro-performance-aero-jersey",
      createdAt: new Date(),
    };

    it("generates valid Product schema for ProductSummary", () => {
      const schema = createProductSchema(mockProductSummary, {
        categoryName: "Cycling Apparel",
      });

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Product");
      expect(schema.name).toBe("Pro Performance Aero Jersey");
      expect(schema.sku).toBe("RUN-AERO-01");
      expect(schema.description).toBe("Elite aerodynamic race jersey.");
      expect(schema.category).toBe("Cycling Apparel");
      expect(schema.url).toBe("https://wear-run.com/products/cycling/pro-performance-aero-jersey");
      expect(schema.brand).toEqual({
        "@type": "Brand",
        name: "RUN APPAREL",
      });
      expect(schema.manufacturer).toEqual({
        "@type": "Organization",
        name: "RUN APPAREL (PVT) LTD",
        url: "https://wear-run.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sialkot",
          addressCountry: "PK",
        },
      });
      expect(schema.offers).toEqual({
        "@type": "Offer",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://wear-run.com/products/cycling/pro-performance-aero-jersey",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 75,
          unitText: "piece",
        },
      });
    });

    it("handles inactive products with OutOfStock availability", () => {
      const inactiveProduct: ProductSummary = {
        ...mockProductSummary,
        isActive: false,
        minimumOrderQuantity: null,
      };

      const schema = createProductSchema(inactiveProduct);
      expect(schema.offers.availability).toBe("https://schema.org/OutOfStock");
      expect(schema.offers.eligibleQuantity.minValue).toBe(50); // Default fallback MOQ
    });

    it("handles ProductDetail with custom options", () => {
      const mockProductDetail: ProductDetail = {
        id: 202,
        name: "Recycled Compression Tights",
        sku: "RUN-TIGHTS-02",
        slug: "recycled-compression-tights",
        description: "Gradient compression tights designed for muscle recovery.",
        shortDescription: null,
        isActive: true,
        isFeatured: false,
        categoryId: 6,
        fabricId: 3,
        sizeChartId: 2,
        primaryImageId: 4,
        primaryVideoId: null,
        imageIds: [4],
        videos: null,
        modelFileId: null,
        specifications: null,
        technicalSpecs: null,
        careInstructions: null,
        tags: ["compression"],
        customWeight: "220gsm",
        customFit: "Tight",
        minimumOrderQuantity: 100,
        leadTime: "4 weeks",
        certificateIds: [],
        accessoryIds: [],
        relatedProductIds: [],
        customizationOptions: null,
        metaTitle: "Recycled Compression Tights | RUN APPAREL",
        metaDescription: "B2B manufacturing for sustainable compression tights.",
        urlPath: null,
        fiberComposition: "78% Econyl, 22% Lycra",
        metadata: null,
        deletedAt: null,
      };

      const schema = createProductSchema(mockProductDetail, {
        baseUrl: "https://wear-run.com",
        categoryName: "Compression Wear",
        imageUrl: "https://wear-run.com/cdn/tights.webp",
      });

      expect(schema.name).toBe("Recycled Compression Tights");
      expect(schema.description).toBe("Gradient compression tights designed for muscle recovery.");
      expect(schema.image).toBe("https://wear-run.com/cdn/tights.webp");
      expect(schema.url).toBe("https://wear-run.com/products/recycled-compression-tights");
      expect(schema.offers.eligibleQuantity.minValue).toBe(100);
    });
  });

  describe("createBreadcrumbSchema", () => {
    it("generates valid BreadcrumbList schema with 1-based positions and absolute URLs", () => {
      const items = [
        { name: "Home", url: "/" },
        { name: "Catalog", url: "/products" },
        { name: "Aero Jersey", url: "https://wear-run.com/products/aero-jersey" },
      ];

      const schema = createBreadcrumbSchema(items);

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("BreadcrumbList");
      expect(schema.itemListElement).toEqual([
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://wear-run.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Catalog",
          item: "https://wear-run.com/products",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Aero Jersey",
          item: "https://wear-run.com/products/aero-jersey",
        },
      ]);
    });
  });
});
