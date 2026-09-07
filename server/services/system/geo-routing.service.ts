/**
 * GEO-IP REGIONAL FACTORY DISPATCH SERVICE (GEO-01)
 *
 * Inspects incoming Edge headers and client IP to determine regional routing:
 * - SIALKOT_HQ: Asian, Middle Eastern, and direct production/technical manufacturing regions
 * - ZURICH_SALES: European, North American, and Western global corporate sales
 */

import { logger } from "../../lib/monitoring/logger.js";

export type RoutingHub = "SIALKOT_HQ" | "ZURICH_SALES";

export interface GeoRoutingDispatch {
  routingHub: RoutingHub;
  countryCode: string;
  isProductionRegion: boolean;
  matchedHeader: string;
}

/**
 * Asian, Middle Eastern, and direct production/technical manufacturing regions
 */
export const SIALKOT_PRODUCTION_REGIONS = new Set([
  "PK", // Pakistan (Manufacturing HQ & Technical Production Hub)
  "AE", // United Arab Emirates (Middle East Distribution Hub)
  "SA", // Saudi Arabia
  "QA", // Qatar
  "KW", // Kuwait
  "OM", // Oman
  "BH", // Bahrain
  "CN", // China (Fabric & Raw Materials Partner Mills)
  "IN", // India
  "BD", // Bangladesh
  "VN", // Vietnam
  "LK", // Sri Lanka
  "TH", // Thailand
  "ID", // Indonesia
  "MY", // Malaysia
  "PH", // Philippines
  "TR", // Turkey (Textile Hub)
  "EG", // Egypt
  "JO", // Jordan
  "LB", // Lebanon
]);

/**
 * European, North American, and Western global corporate sales regions
 */
export const ZURICH_SALES_REGIONS = new Set([
  "CH", // Switzerland (Global Corporate Sales HQ)
  "DE", // Germany
  "FR", // France
  "GB", // United Kingdom
  "IT", // Italy
  "ES", // Spain
  "US", // United States
  "CA", // Canada
  "AU", // Australia
  "NZ", // New Zealand
  "NL", // Netherlands
  "SE", // Sweden
  "NO", // Norway
  "DK", // Denmark
  "FI", // Finland
  "AT", // Austria
  "BE", // Belgium
  "IE", // Ireland
  "JP", // Japan
  "SG", // Singapore
]);

export class GeoRoutingService {
  /**
   * Resolves regional factory dispatch based on request headers and client IP
   */
  public resolveRouting(
    headers?: Record<string, string | string[] | undefined> | undefined,
    clientIp?: string | undefined,
  ): GeoRoutingDispatch {
    // 1. Inspect Edge / Reverse Proxy Headers
    if (headers) {
      // Cloudflare Edge Country Header
      const cfCountry = this.extractHeaderValue(headers, "cf-ipcountry");
      if (cfCountry && this.isValidCountryCode(cfCountry)) {
        return this.buildDispatch("cf-ipcountry", cfCountry);
      }

      // Standard CDN / Proxy Country Header
      const xCountry = this.extractHeaderValue(headers, "x-country-code");
      if (xCountry && this.isValidCountryCode(xCountry)) {
        return this.buildDispatch("x-country-code", xCountry);
      }

      // GCP / Cloud Load Balancer Geo Country Header
      const xClientGeoCountry = this.extractHeaderValue(headers, "x-client-geo-country");
      if (xClientGeoCountry && this.isValidCountryCode(xClientGeoCountry)) {
        return this.buildDispatch("x-client-geo-country", xClientGeoCountry);
      }
    }

    // 2. Client IP Inspection
    if (clientIp) {
      const detectedCountry = this.detectCountryFromIp(clientIp);
      if (detectedCountry) {
        return this.buildDispatch("client-ip", detectedCountry);
      }
    }

    // 3. Fallback: Default to Zurich Global Sales
    logger.debug("[GeoRouting] No regional header or IP matched; defaulting to ZURICH_SALES");
    return {
      routingHub: "ZURICH_SALES",
      countryCode: "CH",
      isProductionRegion: false,
      matchedHeader: "fallback",
    };
  }

  private extractHeaderValue(
    headers: Record<string, string | string[] | undefined>,
    headerName: string,
  ): string | null {
    const targetKey = headerName.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === targetKey && value) {
        const raw = Array.isArray(value) ? value[0] : value;
        if (raw) {
          return raw.trim().toUpperCase();
        }
      }
    }
    return null;
  }

  private isValidCountryCode(code: string): boolean {
    // Valid 2-letter uppercase ISO alpha-2 country code
    // Exclude special Cloudflare codes like XX (unknown) and T1 (Tor)
    return /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1";
  }

  private detectCountryFromIp(ip: string): string | null {
    const cleanIp = ip.replace(/^::ffff:/, "").trim();

    // Known test / development / regional subnet indicators
    if (
      cleanIp.startsWith("111.119.") ||
      cleanIp.startsWith("175.107.") ||
      cleanIp.startsWith("39.32.") ||
      cleanIp.startsWith("202.163.")
    ) {
      return "PK";
    }

    if (
      cleanIp.startsWith("178.192.") ||
      cleanIp.startsWith("194.230.") ||
      cleanIp.startsWith("128.178.")
    ) {
      return "CH";
    }

    if (cleanIp.startsWith("202.108.") || cleanIp.startsWith("123.125.")) {
      return "CN";
    }

    if (cleanIp.startsWith("8.8.8.") || cleanIp.startsWith("192.0.2.")) {
      return "US";
    }

    if (cleanIp.startsWith("151.101.")) {
      return "GB";
    }

    return null;
  }

  private buildDispatch(matchedHeader: string, countryCode: string): GeoRoutingDispatch {
    const isProductionRegion = SIALKOT_PRODUCTION_REGIONS.has(countryCode);
    const routingHub: RoutingHub = isProductionRegion ? "SIALKOT_HQ" : "ZURICH_SALES";

    return {
      routingHub,
      countryCode,
      isProductionRegion,
      matchedHeader,
    };
  }
}

export const geoRoutingService = new GeoRoutingService();
