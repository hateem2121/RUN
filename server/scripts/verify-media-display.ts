import { isNull } from "drizzle-orm";
import { mediaAssets } from "../../shared/schema.js";
import { db } from "../db.js";
import { appStorageService } from "../lib/storage/app-service.js";

async function verifyMediaDisplay() {
  // Get database records
  const dbRecords = await db
    .select()
    .from(mediaAssets)
    .where(isNull(mediaAssets.deletedAt))
    .limit(5);

  for (const record of dbRecords) {
    // Check if file exists at the path
    const exists = await (appStorageService as any).fileExists(record.storagePath);

    if (exists) {
    } else {
    }
  }
}

verifyMediaDisplay();
