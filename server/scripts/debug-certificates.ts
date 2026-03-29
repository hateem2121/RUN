import { eq, inArray } from "drizzle-orm";
import { certificates, mediaAssets } from "../../shared/index.js";
import { db } from "../db.js";

async function main() {
  // 1. Get certification IDs from Homepage Sustainability config
  // 1. Get certification IDs (hardcoded for debugging without homepageSustainability config)
  const certIds = [1, 2, 3]; // Example IDs, replace with actual IDs for debugging

  if (!certIds || certIds.length === 0) {
    return;
  }

  // 2. Fetch the certificates and their media assets
  const certs = await db
    .select({
      id: certificates.id,
      name: certificates.name,
      imageUrlInCert: certificates.imageUrl,
      imageId: certificates.imageId,
      mediaId: mediaAssets.id,
      mediaUrl: mediaAssets.url,
      mediaFilename: mediaAssets.filename,
    })
    .from(certificates)
    .leftJoin(mediaAssets, eq(certificates.imageId, mediaAssets.id))
    .where(inArray(certificates.id, certIds));
  for (const cert of certs) {
    // Simulate the logic in MiscRepository
    const _finalUrl = cert.imageUrlInCert || cert.mediaUrl || null;
  }
  process.exit(0);
}

main().catch((_err) => {
  process.exit(1);
});
