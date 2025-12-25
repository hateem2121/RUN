// @ts-nocheck
import { createHash } from "node:crypto";
import { mediaAssets } from "../../shared/schema.js";
import { appStorageService } from "../app-storage-service.js";
import { db } from "../db.js";

interface FileInfo {
  path: string;
  hash: string;
  size: number;
  dbRecord?: any;
}

interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  totalSize: number;
  wastedSpace: number;
}

async function detectDuplicates() {
  const filePaths = await appStorageService.listAssets();

  if (!Array.isArray(filePaths)) {
    return;
  }

  // Convert paths to file objects with key and name
  const files = filePaths.map((path) => ({
    key: path,
    name: path.split("/").pop() || path,
  }));
  const dbRecords = await db.select().from(mediaAssets);
  const fileInfoMap = new Map<string, FileInfo>();
  const hashGroups = new Map<string, FileInfo[]>();

  let processed = 0;
  let _failed = 0;

  for (const file of files) {
    try {
      processed++;
      process.stdout.write(`\rProcessing ${processed}/${files.length}: ${file.name || file.key}`);

      const fileBuffer = await appStorageService.downloadAsset(file.key);

      if (!Buffer.isBuffer(fileBuffer)) {
        _failed++;
        continue;
      }

      // Calculate hash
      const hash = createHash("sha256").update(fileBuffer).digest("hex");
      const size = fileBuffer.length;

      // Find matching DB record
      const dbRecord = dbRecords.find((r) => r.storage_path === file.key);

      const fileInfo: FileInfo = {
        path: file.key,
        hash,
        size,
        dbRecord,
      };

      fileInfoMap.set(file.key, fileInfo);

      // Group by hash
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash)?.push(fileInfo);
    } catch (_error) {
      _failed++;
    }
  }
  const duplicateGroups: DuplicateGroup[] = [];
  let totalWastedSpace = 0;

  for (const [hash, files] of hashGroups.entries()) {
    if (files.length > 1) {
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const wastedSpace = totalSize - files[0].size; // Keep one, others are waste

      duplicateGroups.push({
        hash,
        files,
        totalSize,
        wastedSpace,
      });

      totalWastedSpace += wastedSpace;
    }
  }

  if (duplicateGroups.length > 0) {
    duplicateGroups.sort((a, b) => b.wastedSpace - a.wastedSpace);

    for (let i = 0; i < duplicateGroups.length; i++) {
      const group = duplicateGroups[i];

      for (const file of group.files) {
        const _dbInfo = file.dbRecord
          ? `DB ID: ${file.dbRecord.id}, Type: ${file.dbRecord.file_type}`
          : "No DB record";
      }
    }
  } else {
  }

  const thumbnails = Array.from(fileInfoMap.values()).filter((f) => f.path.includes("thumb-"));
  const _mainFiles = Array.from(fileInfoMap.values()).filter(
    (f) => !f.path.includes("thumb-") && !f.path.includes("health-probe"),
  );

  // Check for thumbnails without main files
  const orphanedThumbnails: FileInfo[] = [];
  for (const thumb of thumbnails) {
    const mainPath = thumb.path.replace("thumb-", "");
    if (!fileInfoMap.has(mainPath)) {
      orphanedThumbnails.push(thumb);
    }
  }

  if (orphanedThumbnails.length > 0) {
    for (const thumb of orphanedThumbnails) {
      const _expectedMain = thumb.path.replace("thumb-", "");
    }
  } else {
  }

  const totalStorage = Array.from(fileInfoMap.values()).reduce((sum, f) => sum + f.size, 0);
  const uniqueStorage = totalStorage - totalWastedSpace;
  const _efficiency =
    totalWastedSpace === 0 ? 100 : ((uniqueStorage / totalStorage) * 100).toFixed(2);
}

function _formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

// Run detection
detectDuplicates()
  .then(() => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
