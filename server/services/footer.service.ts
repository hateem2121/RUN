import * as footerQueries from "../db/queries/footer.queries.js";
import { logger } from "../lib/monitoring/logger.js";

export async function getFooterConfig() {
  const config = await footerQueries.getFooterConfigurationBase();

  // Default fallback if no config exists
  const baseResponse = config || {
    id: null,
    contactFormHeading: "GET IN TOUCH WITH RUN APPAREL",
    contactFormEnabled: true,
    navigationColumns: [],
    socialLinks: [],
    certificateIds: [],
    legalLinks: [],
    companyName: "RUN APPAREL (PVT) LTD",
    companyAddress: "13km Daska Road, Sialkot 51040, Pakistan",
    companyPhone: "+92 336 1777313",
    companyEmail: "team@run-apparel.com",
    brandText: "RUN APPAREL",
    brandTagline: "Ethically Engineered • Sustainably Crafted",
    brandSubtext: "A subsidiary of Durus Industries",
    structuredData: {},
  };

  // Populate full certificate details with media
  let certifications: Array<{
    id: number;
    name: string;
    imageUrl: string;
    type: string | null;
    issuingOrganization: string | null;
  }> = [];

  if (baseResponse.certificateIds && baseResponse.certificateIds.length > 0) {
    try {
      const certIds = baseResponse.certificateIds as number[];

      const fetchedCertificates = await footerQueries.getCertificatesByIds(certIds);
      const certificateMap = new Map(fetchedCertificates.map((cert) => [cert.id, cert]));

      const imageIds = fetchedCertificates
        .map((c) => c.imageId)
        .filter((id): id is number => id !== null);

      let mediaMap = new Map();
      if (imageIds.length > 0) {
        const medias = await footerQueries.getMediaAssetsByIds(imageIds);
        mediaMap = new Map(medias.map((m) => [m.id, m]));
      }

      const certificatesWithNulls = certIds.map((certId) => {
        const cert = certificateMap.get(certId);
        if (!cert) return null;

        let imageUrl = cert.imageUrl || "";
        if (cert.imageId) {
          const media = mediaMap.get(cert.imageId);
          if (media && !media.deletedAt) {
            imageUrl = `/api/media/${media.id}/content`;
          }
        }

        return {
          id: cert.id,
          name: cert.name,
          imageUrl,
          type: cert.type,
          issuingOrganization: cert.issuingOrganization,
        };
      });

      certifications = certificatesWithNulls.filter(
        (cert): cert is NonNullable<typeof cert> => cert !== null,
      );
    } catch (error) {
      logger.error("[Footer] Error populating certificates:", error);
      certifications = [];
    }
  }

  return {
    ...baseResponse,
    certifications,
  };
}

export async function upsertFooterConfig(normalizedData: Record<string, unknown>) {
  const existing = await footerQueries.getFooterConfigurationBase();

  if (existing) {
    return footerQueries.updateFooterConfiguration(existing.id, normalizedData);
  } else {
    return footerQueries.insertFooterConfiguration(normalizedData);
  }
}
