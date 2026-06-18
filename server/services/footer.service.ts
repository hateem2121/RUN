import { eq, inArray } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import {
  certificates,
  type FooterConfiguration,
  footerConfiguration,
  insertFooterConfigurationSchema,
  mediaAssets,
} from "../../shared/index.js";
import { db } from "../db.js";
import { type AppError, InternalError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

class FooterService {
  /**
   * Retrieves the footer configuration with populated certificates and media.
   */
  async getFooterConfig(): Promise<
    Result<
      FooterConfiguration & {
        certifications: Array<{
          id: number;
          name: string;
          imageUrl: string;
          type: string | null;
          issuingOrganization: string | null;
        }>;
      },
      AppError
    >
  > {
    try {
      // Query DB for footer config
      const [config] = await withCircuit(
        "get-footer-config",
        () => db.select().from(footerConfiguration).limit(1),
        DB_CIRCUIT_OPTIONS,
      );

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
        const certIds = baseResponse.certificateIds;

        // Batch fetch certificates using Drizzle
        const fetchedCertificates = await withCircuit(
          "fetch-footer-certificates",
          () =>
            db
              .select({
                id: certificates.id,
                name: certificates.name,
                type: certificates.type,
                issuingOrganization: certificates.issuingOrganization,
                imageId: certificates.imageId,
                imageUrl: certificates.imageUrl, // Fallback
              })
              .from(certificates)
              .where(inArray(certificates.id, certIds)),
          DB_CIRCUIT_OPTIONS,
        );

        const certificateMap = new Map(fetchedCertificates.map((cert) => [cert.id, cert]));

        // Collect imageIds for batch fetching
        const imageIds = fetchedCertificates
          .map((c) => c.imageId)
          .filter((id): id is number => id !== null);

        // Batch fetch media
        let mediaMap = new Map();
        if (imageIds.length > 0) {
          const medias = await withCircuit(
            "fetch-footer-media",
            () => db.select().from(mediaAssets).where(inArray(mediaAssets.id, imageIds)),
            DB_CIRCUIT_OPTIONS,
          );

          mediaMap = new Map(medias.map((m) => [m.id, m]));
        }

        // Map results preserving order of certificateIds
        const certificatesWithNulls = certIds.map((certId: number) => {
          const cert = certificateMap.get(certId);
          if (!cert) {
            return null;
          }

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
      }

      return ok({
        ...baseResponse,
        certifications,
      } as FooterConfiguration & { certifications: typeof certifications });
    } catch (error) {
      logger.error("[FooterService] Failed to fetch footer config", undefined, error as Error);
      return err(new InternalError("Failed to fetch footer configuration", { error }));
    }
  }

  /**
   * Updates the footer configuration.
   */
  async updateFooterConfig(data: unknown): Promise<Result<FooterConfiguration, AppError>> {
    try {
      // 1. Validate payload
      const updateSchema = insertFooterConfigurationSchema.partial();
      const validatedData = updateSchema.parse(data);

      // 2. Transform/Normalize data for frontend compatibility
      const normalizedData: Record<string, unknown> = { ...validatedData };

      if (validatedData.navigationColumns) {
        normalizedData.navigationColumns = (
          validatedData.navigationColumns as Array<{
            title: string;
            links: Array<{ label: string; href: string; url?: string; external?: boolean }>;
          }>
        ).map((col) => ({
          title: col.title,
          links:
            col.links?.map((link) => ({
              label: link.label,
              href: link.href || link.url || "",
              external: link.external,
            })) || [],
        }));
      }

      if (validatedData.socialLinks) {
        normalizedData.socialLinks = (
          validatedData.socialLinks as Array<{
            name?: string;
            platform?: string;
            icon: string;
            href?: string;
            url?: string;
            hoverColor: string;
          }>
        ).map((social) => ({
          name: social.name || social.platform || "",
          icon: social.icon,
          href: social.href || social.url || "",
          hoverColor: social.hoverColor,
        }));
      }

      if (validatedData.legalLinks) {
        normalizedData.legalLinks = (
          validatedData.legalLinks as Array<{ label: string; href?: string; url?: string }>
        ).map((link) => ({
          label: link.label,
          href: link.href || link.url || "",
        }));
      }

      // 3. Perform Upsert
      const [existing] = await withCircuit(
        "get-existing-footer-config",
        () => db.select().from(footerConfiguration).limit(1),
        DB_CIRCUIT_OPTIONS,
      );

      let updated: FooterConfiguration | undefined;
      if (existing) {
        [updated] = await withCircuit(
          "update-footer-config",
          () =>
            db
              .update(footerConfiguration)
              .set({ ...normalizedData, updatedAt: new Date() })
              .where(eq(footerConfiguration.id, existing.id))
              .returning(),
          DB_CIRCUIT_OPTIONS,
        );
      } else {
        [updated] = await withCircuit(
          "insert-footer-config",
          () =>
            db
              .insert(footerConfiguration)
              .values({
                ...normalizedData,
              } as typeof footerConfiguration.$inferInsert)
              .returning(),
          DB_CIRCUIT_OPTIONS,
        );
      }

      if (!updated) {
        return err(new InternalError("Failed to update footer configuration"));
      }

      return ok(updated);
    } catch (error) {
      logger.error("[FooterService] Failed to update footer config", undefined, error as Error);
      return err(new InternalError("Failed to update footer configuration", { error }));
    }
  }
}

export const footerService = new FooterService();
