import { mediaAssets } from "../../shared/schema.js";
import { db } from "../db.js";
import { appStorageService } from "../lib/storage/app-service.js";

interface FileUsage {
  path: string;
  size: number;
  type: string;
  category: "main" | "thumbnail" | "health-probe" | "other";
  extension: string;
  hasDBRecord: boolean;
  dbId?: number | undefined;
}

interface CategoryStats {
  count: number;
  totalSize: number;
  files: FileUsage[];
}

interface TypeStats {
  extension: string;
  count: number;
  totalSize: number;
  percentage: number;
}

async function analyzeStorageUsage() {
  const filePaths = await appStorageService.listAssets();
  const dbRecords = await db.select().from(mediaAssets);
  const fileUsages: FileUsage[] = [];
  let processed = 0;

  for (const path of filePaths) {
    try {
      processed++;
      process.stdout.write(
        `\rProcessing ${processed}/${filePaths.length}: ${path.split("/").pop()}`,
      );

      const buffer = await appStorageService.downloadAsset(path);
      const size = buffer.length;
      const extension = path.split(".").pop()?.toLowerCase() || "unknown";

      // Categorize file
      let category: FileUsage["category"] = "other";
      if (path.includes("thumb-")) {
        category = "thumbnail";
      } else if (path.includes("health-probe") || path.includes(".health-check")) {
        category = "health-probe";
      } else if (
        extension === "png" ||
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "glb" ||
        extension === "gltf"
      ) {
        category = "main";
      }

      // Check DB record (use storagePath - camelCase from schema)
      const dbRecord = dbRecords.find((r) => r.storagePath === path);

      fileUsages.push({
        path,
        size,
        type: extension,
        category,
        extension,
        hasDBRecord: !!dbRecord,
        dbId: dbRecord?.id,
      });
    } catch (_error) {}
  }

  const totalSize = fileUsages.reduce((sum, f) => sum + f.size, 0);

  // Group by category
  const categoryStats: Record<string, CategoryStats> = {};
  for (const file of fileUsages) {
    if (!categoryStats[file.category]) {
      categoryStats[file.category] = { count: 0, totalSize: 0, files: [] };
    }
    categoryStats[file.category]!.count++;
    categoryStats[file.category]!.totalSize += file.size;
    categoryStats[file.category]?.files.push(file);
  }

  // Group by file type
  const typeStats: Record<string, { count: number; totalSize: number }> = {};
  for (const file of fileUsages) {
    if (!typeStats[file.extension]) {
      typeStats[file.extension] = { count: 0, totalSize: 0 };
    }
    typeStats[file.extension]!.count++;
    typeStats[file.extension]!.totalSize += file.size;
  }

  // Convert to sorted array
  const typesArray: TypeStats[] = Object.entries(typeStats)
    .map(([extension, stats]) => ({
      extension,
      count: stats.count,
      totalSize: stats.totalSize,
      percentage: (stats.totalSize / totalSize) * 100,
    }))
    .sort((a, b) => b.totalSize - a.totalSize);

  const sortedCategories = Object.entries(categoryStats).sort(
    (a, b) => b[1].totalSize - a[1].totalSize,
  );

  for (const [_category, stats] of sortedCategories) {
    const _percentage = ((stats.totalSize / totalSize) * 100).toFixed(2);
  }

  for (const type of typesArray) {
    const _ext = type.extension.padEnd(9);
    const _count = type.count.toString().padStart(5);
    const _size = formatBytes(type.totalSize).padStart(11);
    const _pct = type.percentage.toFixed(2).padStart(6);
  }
  const sortedBySize = [...fileUsages].sort((a, b) => b.size - a.size).slice(0, 10);

  for (let i = 0; i < sortedBySize.length; i++) {
    const file = sortedBySize[i];
    if (!file) {
      continue;
    }
    const _dbInfo = file.hasDBRecord ? `DB ID: ${file.dbId}` : "No DB record";
  }

  const trackedFiles = fileUsages.filter((f) => f.hasDBRecord);
  const untrackedFiles = fileUsages.filter((f) => !f.hasDBRecord);
  const _trackedSize = trackedFiles.reduce((sum, f) => sum + f.size, 0);
  const _untrackedSize = untrackedFiles.reduce((sum, f) => sum + f.size, 0);

  if (untrackedFiles.length > 0) {
    for (const _file of untrackedFiles) {
    }
  }

  const mainFileSize = categoryStats.main?.totalSize || 0;
  const thumbnailSize = categoryStats.thumbnail?.totalSize || 0;
  const _healthProbeSize = categoryStats["health-probe"]?.totalSize || 0;
  const _otherSize = categoryStats.other?.totalSize || 0;

  const _thumbnailOverhead = (thumbnailSize / mainFileSize) * 100;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

// Run analysis
analyzeStorageUsage()
  .then(() => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
