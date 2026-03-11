import { desc } from "drizzle-orm";
import { inquiries } from "../shared/schemas/content/common.js";
import { db } from "./db.js";
import { decrypt } from "./lib/encryption.js";

async function runForensics() {
  console.log("--- Starting Database Forensics for Inquiries ---");

  try {
    const results = await db.select().from(inquiries).orderBy(desc(inquiries.submittedAt)).limit(5);

    console.log(`Found ${results.length} recent inquiries.`);

    for (const inq of results) {
      console.log(`\nInquiry ID: ${inq.id}`);
      console.log(`Status: ${inq.status}`);
      console.log(`Submitted At: ${inq.submittedAt}`);
      console.log(`Email (Encrypted): ${inq.email}`);
      console.log(`Email Index: ${inq.emailIndex}`);

      try {
        if (inq.email?.includes(":")) {
          const decryptedEmail = decrypt(inq.email);
          console.log(`Email (Decrypted): ${decryptedEmail}`);
        } else {
          console.log("Email appears to be unencrypted or legacy.");
        }
      } catch (err) {
        const error = err as Error;
        console.error(`Failed to decrypt email for inquiry ${inq.id}:`, error.message);
      }

      try {
        if (inq.name?.includes(":")) {
          const decryptedName = decrypt(inq.name);
          console.log(`Name (Decrypted): ${decryptedName}`);
        }
      } catch (_err) {}
    }
  } catch (error) {
    console.error("Forensics failed:", error);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

runForensics();
