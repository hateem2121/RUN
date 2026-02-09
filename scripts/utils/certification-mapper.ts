// @ts-nocheck
/**
 * Certification Mapper Utility
 * Maps certification names to existing certification IDs in the database
 */

import type { ReplitStorage } from "../../server/replit-storage.js";

interface CertificationMappingResult {
  success: boolean;
  certificationIds: number[];
  missingCertifications: string[];
  errors: string[];
}

export class CertificationMapper {
  private storage: ReplitStorage;
  private certificationMap: Map<string, number> = new Map();
  private initialized = false;

  constructor(storage: ReplitStorage) {
    this.storage = storage;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    const certificates = await this.storage.getCertificates();

    // Create mapping from certification names to IDs
    for (const certificate of certificates) {
      // Map exact name
      this.certificationMap.set(certificate.name.toLowerCase(), certificate.id);

      // Map common variations
      const variations = this.getCertificationVariations(certificate.name);
      for (const variation of variations) {
        this.certificationMap.set(variation.toLowerCase(), certificate.id);
      }
    }
    this.initialized = true;
  }

  async mapCertifications(certificationNames: string[]): Promise<CertificationMappingResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result: CertificationMappingResult = {
      success: true,
      certificationIds: [],
      missingCertifications: [],
      errors: [],
    };

    for (const certName of certificationNames) {
      const certId = this.findCertificationId(certName);

      if (certId) {
        result.certificationIds.push(certId);
      } else {
        result.missingCertifications.push(certName);
        result.errors.push(`Certification not found: ${certName}`);
        result.success = false;
      }
    }

    // Remove duplicates
    result.certificationIds = [...new Set(result.certificationIds)];

    return result;
  }

  private findCertificationId(certificationName: string): number | null {
    const normalizedName = certificationName.toLowerCase().trim();

    // Direct lookup
    if (this.certificationMap.has(normalizedName)) {
      return this.certificationMap.get(normalizedName)!;
    }

    // Try with common variations
    const variations = this.getCertificationVariations(certificationName);
    for (const variation of variations) {
      if (this.certificationMap.has(variation.toLowerCase())) {
        return this.certificationMap.get(variation.toLowerCase())!;
      }
    }

    // Try partial matches for complex certification names
    for (const [mappedName, id] of this.certificationMap.entries()) {
      if (this.isPartialMatch(normalizedName, mappedName)) {
        return id;
      }
    }

    return null;
  }

  private getCertificationVariations(certificationName: string): string[] {
    const variations = [certificationName];
    const name = certificationName.toLowerCase().trim();

    // Add common variations for known certifications
    const variationMap: { [key: string]: string[] } = {
      "oeko-tex standard 100": [
        "oeko-tex standard 100",
        "oeko-tex",
        "oekotex",
        "oeko tex",
        "oeko-tex 100",
        "oekotex standard 100",
      ],
      "global organic textile standard": [
        "global organic textile standard",
        "gots",
        "organic textile standard",
        "global organic textile",
      ],
      "global recycled standard": [
        "global recycled standard",
        "grs",
        "recycled standard",
        "global recycled",
      ],
      "recycled claim standard": [
        "recycled claim standard",
        "rcs",
        "claim standard",
        "recycled claim",
      ],
      "better cotton initiative": [
        "better cotton initiative",
        "bci",
        "cotton initiative",
        "better cotton",
      ],
      "organic content standard": [
        "organic content standard",
        "ocs",
        "content standard",
        "organic content",
      ],
      "worldwide responsible accredited production": [
        "worldwide responsible accredited production",
        "wrap",
        "responsible accredited production",
        "worldwide responsible production",
      ],
      "cradle to cradle certified": [
        "cradle to cradle certified",
        "c2c",
        "cradle to cradle",
        "cradle certified",
      ],
      "bluesign approved": ["bluesign approved", "bluesign", "blue sign", "bluesign certified"],
      "greenguard certified": [
        "greenguard certified",
        "greenguard",
        "green guard",
        "greenguard gold",
      ],
    };

    // Find matching variations
    for (const [_key, values] of Object.entries(variationMap)) {
      if (values.some((v) => v === name || name.includes(v))) {
        variations.push(...values);
      }
    }

    return [...new Set(variations)];
  }

  private isPartialMatch(searchName: string, mappedName: string): boolean {
    // Check if the search name contains key words from the mapped name
    const searchWords = searchName.split(/\s+/);
    const mappedWords = mappedName.split(/\s+/);

    // Must have at least 2 matching words for partial match
    const matchingWords = searchWords.filter((word) =>
      mappedWords.some((mappedWord) => mappedWord.includes(word) || word.includes(mappedWord)),
    );

    return matchingWords.length >= 2;
  }

  getAvailableCertifications(): string[] {
    return Array.from(this.certificationMap.keys());
  }

  async createMissingCertifications(missingCertifications: string[]): Promise<void> {
    const uniqueCertifications = [...new Set(missingCertifications)];

    for (const certName of uniqueCertifications) {
      const certData = this.createCertificationData(certName);

      try {
        const createdCert = await this.storage.createCertificate(certData);
        this.certificationMap.set(certName.toLowerCase(), createdCert.id);
      } catch (_error) {}
    }
  }

  private createCertificationData(certificationName: string) {
    const name = certificationName.trim();
    const normalizedName = name.toLowerCase();

    // Define certification properties based on type
    const certificationData: { [key: string]: any } = {
      "oeko-tex standard 100": {
        type: "Chemical Safety",
        description: "International safety standard for textiles tested for harmful substances",
        issuingBody: "International OEKO-TEX Association",
      },
      gots: {
        type: "Organic Certification",
        description: "Global Organic Textile Standard for organic fiber processing",
        issuingBody: "Global Organic Textile Standard International",
      },
      "global organic textile standard": {
        type: "Organic Certification",
        description: "Global Organic Textile Standard for organic fiber processing",
        issuingBody: "Global Organic Textile Standard International",
      },
      grs: {
        type: "Recycled Content",
        description: "Global Recycled Standard for recycled content verification",
        issuingBody: "Textile Exchange",
      },
      "global recycled standard": {
        type: "Recycled Content",
        description: "Global Recycled Standard for recycled content verification",
        issuingBody: "Textile Exchange",
      },
      rcs: {
        type: "Recycled Content",
        description: "Recycled Claim Standard for recycled content tracking",
        issuingBody: "Textile Exchange",
      },
      "recycled claim standard": {
        type: "Recycled Content",
        description: "Recycled Claim Standard for recycled content tracking",
        issuingBody: "Textile Exchange",
      },
      bci: {
        type: "Sustainability",
        description: "Better Cotton Initiative for sustainable cotton production",
        issuingBody: "Better Cotton Initiative",
      },
      "better cotton initiative": {
        type: "Sustainability",
        description: "Better Cotton Initiative for sustainable cotton production",
        issuingBody: "Better Cotton Initiative",
      },
      ocs: {
        type: "Organic Content",
        description: "Organic Content Standard for organic raw material content",
        issuingBody: "Textile Exchange",
      },
      "organic content standard": {
        type: "Organic Content",
        description: "Organic Content Standard for organic raw material content",
        issuingBody: "Textile Exchange",
      },
      wrap: {
        type: "Social Compliance",
        description: "Worldwide Responsible Accredited Production certification",
        issuingBody: "Worldwide Responsible Accredited Production",
      },
      "worldwide responsible accredited production": {
        type: "Social Compliance",
        description: "Worldwide Responsible Accredited Production certification",
        issuingBody: "Worldwide Responsible Accredited Production",
      },
    };

    // Find matching properties or use defaults
    const certProps = certificationData[normalizedName] ||
      certificationData[normalizedName.replace(/[^a-z0-9]/g, "")] || {
        type: "General",
        description: `${name} certification for textile quality and compliance`,
        issuingBody: "Various Certification Bodies",
      };

    // Check for key words to determine type
    if (normalizedName.includes("organic")) {
      certProps.type = "Organic Certification";
    } else if (normalizedName.includes("recycled")) {
      certProps.type = "Recycled Content";
    } else if (normalizedName.includes("safety") || normalizedName.includes("oeko")) {
      certProps.type = "Chemical Safety";
    } else if (normalizedName.includes("social") || normalizedName.includes("responsible")) {
      certProps.type = "Social Compliance";
    } else if (normalizedName.includes("sustainable") || normalizedName.includes("environment")) {
      certProps.type = "Sustainability";
    }

    return {
      name,
      type: certProps.type,
      description: certProps.description,
      issuingBody: certProps.issuingBody,
      isActive: true,
    };
  }
}
