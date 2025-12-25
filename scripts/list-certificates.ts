import { db } from "../server/db.js";
import { certificates } from "../shared/schema.js";

async function listCertificates() {
  try {
    const allCerts = await db.select().from(certificates);
    allCerts.forEach((cert) => {});
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

listCertificates();
