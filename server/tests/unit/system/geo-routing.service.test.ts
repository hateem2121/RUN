import { describe, expect, it } from "vitest";
import {
  GeoRoutingService,
  geoRoutingService,
  SIALKOT_PRODUCTION_REGIONS,
  ZURICH_SALES_REGIONS,
} from "../../../services/system/geo-routing.service.js";

describe("GeoRoutingService (GEO-01)", () => {
  const service = new GeoRoutingService();

  describe("Edge Headers Inspection & Routing", () => {
    it("should route to SIALKOT_HQ via cf-ipcountry for Pakistan (PK)", () => {
      const result = service.resolveRouting({ "cf-ipcountry": "PK" });
      expect(result).toEqual({
        routingHub: "SIALKOT_HQ",
        countryCode: "PK",
        isProductionRegion: true,
        matchedHeader: "cf-ipcountry",
      });
    });

    it("should route to SIALKOT_HQ via cf-ipcountry for UAE (AE)", () => {
      const result = service.resolveRouting({ "cf-ipcountry": "AE" });
      expect(result).toEqual({
        routingHub: "SIALKOT_HQ",
        countryCode: "AE",
        isProductionRegion: true,
        matchedHeader: "cf-ipcountry",
      });
    });

    it("should route to ZURICH_SALES via cf-ipcountry for Switzerland (CH)", () => {
      const result = service.resolveRouting({ "cf-ipcountry": "CH" });
      expect(result).toEqual({
        routingHub: "ZURICH_SALES",
        countryCode: "CH",
        isProductionRegion: false,
        matchedHeader: "cf-ipcountry",
      });
    });

    it("should route to ZURICH_SALES via cf-ipcountry for United States (US)", () => {
      const result = service.resolveRouting({ "cf-ipcountry": "US" });
      expect(result).toEqual({
        routingHub: "ZURICH_SALES",
        countryCode: "US",
        isProductionRegion: false,
        matchedHeader: "cf-ipcountry",
      });
    });

    it("should handle lowercase and whitespace in header values", () => {
      const result = service.resolveRouting({ "cf-ipcountry": "  pk  " });
      expect(result.countryCode).toBe("PK");
      expect(result.routingHub).toBe("SIALKOT_HQ");
      expect(result.matchedHeader).toBe("cf-ipcountry");
    });

    it("should handle array header values from Express", () => {
      const result = service.resolveRouting({ "cf-ipcountry": ["DE", "US"] });
      expect(result.countryCode).toBe("DE");
      expect(result.routingHub).toBe("ZURICH_SALES");
      expect(result.matchedHeader).toBe("cf-ipcountry");
    });

    it("should inspect x-country-code when cf-ipcountry is absent", () => {
      const result = service.resolveRouting({ "x-country-code": "BD" });
      expect(result).toEqual({
        routingHub: "SIALKOT_HQ",
        countryCode: "BD",
        isProductionRegion: true,
        matchedHeader: "x-country-code",
      });
    });

    it("should inspect x-client-geo-country when other headers are absent", () => {
      const result = service.resolveRouting({ "x-client-geo-country": "QA" });
      expect(result).toEqual({
        routingHub: "SIALKOT_HQ",
        countryCode: "QA",
        isProductionRegion: true,
        matchedHeader: "x-client-geo-country",
      });
    });

    it("should prioritize cf-ipcountry over x-country-code", () => {
      const result = service.resolveRouting({
        "cf-ipcountry": "PK",
        "x-country-code": "US",
      });
      expect(result.routingHub).toBe("SIALKOT_HQ");
      expect(result.countryCode).toBe("PK");
      expect(result.matchedHeader).toBe("cf-ipcountry");
    });

    it("should ignore invalid Cloudflare codes like XX or T1 and fall back", () => {
      const result = service.resolveRouting({ "cf-ipcountry": "XX", "x-country-code": "CN" });
      expect(result.routingHub).toBe("SIALKOT_HQ");
      expect(result.countryCode).toBe("CN");
      expect(result.matchedHeader).toBe("x-country-code");
    });
  });

  describe("Client IP Inspection", () => {
    it("should resolve Pakistan IP to SIALKOT_HQ when no headers exist", () => {
      const result = service.resolveRouting(undefined, "111.119.50.25");
      expect(result).toEqual({
        routingHub: "SIALKOT_HQ",
        countryCode: "PK",
        isProductionRegion: true,
        matchedHeader: "client-ip",
      });
    });

    it("should resolve Switzerland IP to ZURICH_SALES when no headers exist", () => {
      const result = service.resolveRouting(undefined, "178.192.10.15");
      expect(result).toEqual({
        routingHub: "ZURICH_SALES",
        countryCode: "CH",
        isProductionRegion: false,
        matchedHeader: "client-ip",
      });
    });

    it("should strip ::ffff: prefix from IPv4-mapped IPv6 addresses", () => {
      const result = service.resolveRouting(undefined, "::ffff:39.32.100.1");
      expect(result).toEqual({
        routingHub: "SIALKOT_HQ",
        countryCode: "PK",
        isProductionRegion: true,
        matchedHeader: "client-ip",
      });
    });
  });

  describe("Fallback Behavior", () => {
    it("should fallback to ZURICH_SALES with country CH when headers and IP are unresolvable", () => {
      const result = service.resolveRouting({}, "127.0.0.1");
      expect(result).toEqual({
        routingHub: "ZURICH_SALES",
        countryCode: "CH",
        isProductionRegion: false,
        matchedHeader: "fallback",
      });
    });

    it("should fallback cleanly when no arguments provided", () => {
      const result = service.resolveRouting();
      expect(result).toEqual({
        routingHub: "ZURICH_SALES",
        countryCode: "CH",
        isProductionRegion: false,
        matchedHeader: "fallback",
      });
    });
  });

  describe("Regional Classification Sets", () => {
    it("should classify major production regions into SIALKOT_HQ", () => {
      const sampleProduction = ["PK", "AE", "SA", "QA", "CN", "IN", "BD", "VN", "TR"];
      for (const country of sampleProduction) {
        expect(SIALKOT_PRODUCTION_REGIONS.has(country)).toBe(true);
        const result = service.resolveRouting({ "cf-ipcountry": country });
        expect(result.routingHub).toBe("SIALKOT_HQ");
        expect(result.isProductionRegion).toBe(true);
      }
    });

    it("should classify major global corporate sales regions into ZURICH_SALES", () => {
      const sampleSales = ["CH", "DE", "FR", "GB", "IT", "ES", "US", "CA", "AU"];
      for (const country of sampleSales) {
        expect(ZURICH_SALES_REGIONS.has(country)).toBe(true);
        const result = service.resolveRouting({ "cf-ipcountry": country });
        expect(result.routingHub).toBe("ZURICH_SALES");
        expect(result.isProductionRegion).toBe(false);
      }
    });
  });

  describe("Singleton Instance", () => {
    it("should export pre-instantiated geoRoutingService singleton", () => {
      expect(geoRoutingService).toBeInstanceOf(GeoRoutingService);
    });
  });
});
