import { eq, type InferInsertModel, inArray } from "drizzle-orm";
import { certificates, footerConfiguration, mediaAssets } from "../../../shared/index.js";
import { db } from "../../db.js";

type FooterConfigInsert = Partial<InferInsertModel<typeof footerConfiguration>>;

export async function getFooterConfigurationBase() {
  const [config] = await db.select().from(footerConfiguration).limit(1);
  return config;
}

export async function getCertificatesByIds(certIds: number[]) {
  return db
    .select({
      id: certificates.id,
      name: certificates.name,
      type: certificates.type,
      issuingOrganization: certificates.issuingOrganization,
      imageId: certificates.imageId,
      imageUrl: certificates.imageUrl,
    })
    .from(certificates)
    .where(inArray(certificates.id, certIds));
}

export async function getMediaAssetsByIds(imageIds: number[]) {
  return db.select().from(mediaAssets).where(inArray(mediaAssets.id, imageIds));
}

export async function updateFooterConfiguration(id: number, data: FooterConfigInsert) {
  const [updated] = await db
    .update(footerConfiguration)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(footerConfiguration.id, id))
    .returning();
  return updated;
}

export async function insertFooterConfiguration(data: FooterConfigInsert) {
  const [inserted] = await db
    .insert(footerConfiguration)
    .values(data as never)
    .returning();
  return inserted;
}
