import { isNull } from "drizzle-orm";
import { mediaAssets } from "../../shared/schema.js";
import { appStorageService } from "../app-storage-service.js";
import { db } from "../db.js";

async function verifyMediaDisplay() {
  console.log("🔍 MEDIA DISPLAY VERIFICATION");
  console.log("=".repeat(80) + "\n");

  // Get database records
  const dbRecords = await db
    .select()
    .from(mediaAssets)
    .where(isNull(mediaAssets.deletedAt))
    .limit(5);

  console.log(`📋 Testing ${dbRecords.length} database records...\n`);

  for (const record of dbRecords) {
    console.log(`Testing Record #${record.id}:`);
    console.log(`  Filename: ${record.filename}`);
    console.log(`  Storage Path (DB): ${record.storagePath}`);

    // Check if file exists at the path
    const exists = await (appStorageService as any).fileExists(record.storagePath);

    if (exists) {
      console.log(`  ✅ File EXISTS at storage path`);
      console.log(`  ✅ Should display at: /api/media/${record.id}/content`);
    } else {
      console.log(`  ❌ File NOT FOUND at storage path`);
    }
    console.log("");
  }

  console.log("=".repeat(80));
  console.log("✅ Verification complete - check admin UI to confirm images display");
}

verifyMediaDisplay();
