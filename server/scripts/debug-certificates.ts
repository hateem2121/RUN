import { db } from "../db.js";
import { certificates, mediaAssets } from "../../shared/schema.js";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("--- DEBUGGING SUSTAINABILITY CERTIFICATES ---");

  // 1. Get certification IDs from Homepage Sustainability config
  // 1. Get certification IDs (hardcoded for debugging without homepageSustainability config)
  const certIds = [1, 2, 3]; // Example IDs, replace with actual IDs for debugging
  console.log(`Using hardcoded Certification IDs: ${JSON.stringify(certIds)}`);

  if (!certIds || certIds.length === 0) {
    console.log("No certification IDs in config.");
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

  // 3. Analyze the results
  console.log("\n--- CERTIFICATE DATA ANALYSIS ---");
  for (const cert of certs) {
    console.log(`\nCertificate ID: ${cert.id} ("${cert.name}")`);
    console.log(`  - certificates.imageUrl: ${JSON.stringify(cert.imageUrlInCert)}`);
    console.log(`  - certificates.imageId:  ${cert.imageId}`);
    console.log(`  - mediaAssets.id:        ${cert.mediaId}`);
    console.log(`  - mediaAssets.url:       ${JSON.stringify(cert.mediaUrl)}`);
    console.log(`  - mediaAssets.filename:  ${JSON.stringify(cert.mediaFilename)}`);

    // Simulate the logic in MiscRepository
    const finalUrl = cert.imageUrlInCert || cert.mediaUrl || null;
    console.log(`  -> RESULTING URL:        ${JSON.stringify(finalUrl)}`);
  }

  console.log("\n--- DONE ---");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
