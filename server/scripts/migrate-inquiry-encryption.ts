/**
 * INQUIRY ENCRYPTION MIGRATION SCRIPT
 * Identifies and re-encrypts plain-text inquiries to rectify
 * fragmentation identified in Feb 2026 Audit.
 */

import { eq, isNull, or, sql } from "drizzle-orm";
import { inquiries } from "../../shared/schemas/content/common.js";
import { db } from "../db.js";
import { decrypt, encrypt, getBlindIndex } from "../lib/encryption.js";
import { logger } from "../lib/monitoring/logger.js";

async function runMigration() {
  logger.info("[Migration] Starting Inquiry Encryption Migration...");

  try {
    // 1. Fetch all inquiries that might be plain text or missing indices
    const records = await db
      .select()
      .from(inquiries)
      .where(or(sql`${inquiries.email} NOT LIKE '%:%'`, isNull(inquiries.emailIndex)));

    logger.info(`[Migration] Found ${records.length} records requiring attention.`);

    let updatedCount = 0;
    for (const record of records) {
      const needsEncryption = (val: string | null) => val && !val.includes(":");

      const updates: any = {};

      // Handle Name
      if (needsEncryption(record.name)) {
        updates.name = encrypt(record.name!);
      }

      // Handle Email and Blind Index
      if (record.email) {
        if (!record.email.includes(":")) {
          // It's plain text
          updates.email = encrypt(record.email);
          updates.emailIndex = getBlindIndex(record.email);
        } else if (!record.emailIndex) {
          // It's encrypted but missing index - decrypt to regenerate index
          try {
            const plainEmail = decrypt(record.email);
            updates.emailIndex = getBlindIndex(plainEmail);
          } catch (e) {
            logger.error(`[Migration] Failed to decrypt email for index on inquiry #${record.id}`);
          }
        }
      }

      // Handle Company
      if (needsEncryption(record.company)) {
        updates.company = encrypt(record.company!);
      }

      // Handle Phone
      if (needsEncryption(record.phone)) {
        updates.phone = encrypt(record.phone!);
      }

      // Handle Message
      if (needsEncryption(record.message)) {
        updates.message = encrypt(record.message);
      }

      if (Object.keys(updates).length > 0) {
        await db
          .update(inquiries)
          .set({
            ...updates,
          })
          .where(eq(inquiries.id, record.id));
        updatedCount++;
      }
    }

    logger.info(`[Migration] Successfully processed ${updatedCount} inquiries.`);
    logger.info("[Migration] ✅ Migration complete.");
  } catch (error) {
    logger.error("[Migration] ❌ Migration failed:", error);
    process.exit(1);
  }
}

// Check for required env vars
if (!process.env.DATABASE_URL || !process.env.ENCRYPTION_KEY) {
  logger.error("[Migration] Missing DATABASE_URL or ENCRYPTION_KEY");
  process.exit(1);
}

runMigration();
