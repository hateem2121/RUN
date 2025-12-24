import { mediaAssets } from '../../shared/schema.js';
import { appStorageService } from '../app-storage-service.js';
import { db } from '../db.js';

interface FileUsage {
  path: string;
  size: number;
  type: string;
  category: 'main' | 'thumbnail' | 'health-probe' | 'other';
  extension: string;
  hasDBRecord: boolean;
  dbId?: number;
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
  console.log('='.repeat(80));
  console.log('PHASE 5B - TASK 5B-6: STORAGE USAGE ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // Step 1: List all files
  console.log('Step 1: Loading file inventory...');
  const filePaths = await appStorageService.listAssets();
  const dbRecords = await db.select().from(mediaAssets);
  console.log(`Found ${filePaths.length} files in storage`);
  console.log(`Found ${dbRecords.length} database records\n`);

  // Step 2: Get size for each file
  console.log('Step 2: Calculating file sizes...');
  const fileUsages: FileUsage[] = [];
  let processed = 0;

  for (const path of filePaths) {
    try {
      processed++;
      process.stdout.write(`\rProcessing ${processed}/${filePaths.length}: ${path.split('/').pop()}`);

      const buffer = await appStorageService.downloadAsset(path);
      const size = buffer.length;
      const extension = path.split('.').pop()?.toLowerCase() || 'unknown';

      // Categorize file
      let category: FileUsage['category'] = 'other';
      if (path.includes('thumb-')) {
        category = 'thumbnail';
      } else if (path.includes('health-probe') || path.includes('.health-check')) {
        category = 'health-probe';
      } else if (extension === 'png' || extension === 'jpg' || extension === 'jpeg' || extension === 'glb' || extension === 'gltf') {
        category = 'main';
      }

      // Check DB record (use storagePath - camelCase from schema)
      const dbRecord = dbRecords.find(r => r.storagePath === path);

      fileUsages.push({
        path,
        size,
        type: extension,
        category,
        extension,
        hasDBRecord: !!dbRecord,
        dbId: dbRecord?.id
      });

    } catch (error) {
      console.error(`\n  ✗ Failed to process ${path}:`, error);
    }
  }

  console.log(`\n\nProcessed ${fileUsages.length} files\n`);

  // Step 3: Calculate statistics
  console.log('Step 3: Analyzing usage patterns...\n');

  const totalSize = fileUsages.reduce((sum, f) => sum + f.size, 0);

  // Group by category
  const categoryStats: Record<string, CategoryStats> = {};
  for (const file of fileUsages) {
    if (!categoryStats[file.category]) {
      categoryStats[file.category] = { count: 0, totalSize: 0, files: [] };
    }
    categoryStats[file.category]!.count++;
    categoryStats[file.category]!.totalSize += file.size;
    categoryStats[file.category]!.files.push(file);
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
      percentage: (stats.totalSize / totalSize) * 100
    }))
    .sort((a, b) => b.totalSize - a.totalSize);

  // Step 4: Report findings
  console.log('='.repeat(80));
  console.log('STORAGE USAGE ANALYSIS RESULTS');
  console.log('='.repeat(80));
  console.log();

  console.log('OVERALL SUMMARY:');
  console.log(`  Total files: ${fileUsages.length}`);
  console.log(`  Total storage: ${formatBytes(totalSize)}`);
  console.log(`  Average file size: ${formatBytes(totalSize / fileUsages.length)}`);
  console.log();

  // Category breakdown
  console.log('BREAKDOWN BY CATEGORY:');
  console.log();

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1].totalSize - a[1].totalSize);

  for (const [category, stats] of sortedCategories) {
    const percentage = ((stats.totalSize / totalSize) * 100).toFixed(2);
    console.log(`${category.toUpperCase()}:`);
    console.log(`  Files: ${stats.count}`);
    console.log(`  Size: ${formatBytes(stats.totalSize)} (${percentage}%)`);
    console.log(`  Avg: ${formatBytes(stats.totalSize / stats.count)}`);
    console.log();
  }

  // File type breakdown
  console.log('BREAKDOWN BY FILE TYPE:');
  console.log();
  console.log('Extension | Count | Total Size  | % of Storage');
  console.log('-'.repeat(55));

  for (const type of typesArray) {
    const ext = type.extension.padEnd(9);
    const count = type.count.toString().padStart(5);
    const size = formatBytes(type.totalSize).padStart(11);
    const pct = type.percentage.toFixed(2).padStart(6);
    console.log(`${ext} | ${count} | ${size} | ${pct}%`);
  }
  console.log();

  // Largest files
  console.log('TOP 10 LARGEST FILES:');
  console.log();
  const sortedBySize = [...fileUsages].sort((a, b) => b.size - a.size).slice(0, 10);

  for (let i = 0; i < sortedBySize.length; i++) {
    const file = sortedBySize[i];
    if (!file) continue;
    const dbInfo = file.hasDBRecord ? `DB ID: ${file.dbId}` : 'No DB record';
    console.log(`${i + 1}. ${file.path}`);
    console.log(`   Size: ${formatBytes(file.size)} | Type: ${file.extension} | Category: ${file.category} | ${dbInfo}`);
    console.log();
  }

  // Database tracking analysis
  console.log('='.repeat(80));
  console.log('DATABASE TRACKING ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  const trackedFiles = fileUsages.filter(f => f.hasDBRecord);
  const untrackedFiles = fileUsages.filter(f => !f.hasDBRecord);
  const trackedSize = trackedFiles.reduce((sum, f) => sum + f.size, 0);
  const untrackedSize = untrackedFiles.reduce((sum, f) => sum + f.size, 0);

  console.log(`Files WITH DB records: ${trackedFiles.length} (${formatBytes(trackedSize)}, ${((trackedSize / totalSize) * 100).toFixed(2)}%)`);
  console.log(`Files WITHOUT DB records: ${untrackedFiles.length} (${formatBytes(untrackedSize)}, ${((untrackedSize / totalSize) * 100).toFixed(2)}%)`);
  console.log();

  if (untrackedFiles.length > 0) {
    console.log('UNTRACKED FILES:');
    for (const file of untrackedFiles) {
      console.log(`  - ${file.path} (${formatBytes(file.size)})`);
    }
    console.log();
  }

  // Storage efficiency
  console.log('='.repeat(80));
  console.log('STORAGE EFFICIENCY METRICS');
  console.log('='.repeat(80));
  console.log();

  const mainFileSize = categoryStats['main']?.totalSize || 0;
  const thumbnailSize = categoryStats['thumbnail']?.totalSize || 0;
  const healthProbeSize = categoryStats['health-probe']?.totalSize || 0;
  const otherSize = categoryStats['other']?.totalSize || 0;

  console.log(`Main content: ${formatBytes(mainFileSize)} (${((mainFileSize / totalSize) * 100).toFixed(2)}%)`);
  console.log(`Thumbnails: ${formatBytes(thumbnailSize)} (${((thumbnailSize / totalSize) * 100).toFixed(2)}%)`);
  console.log(`Health probes: ${formatBytes(healthProbeSize)} (${((healthProbeSize / totalSize) * 100).toFixed(2)}%)`);
  console.log(`Other: ${formatBytes(otherSize)} (${((otherSize / totalSize) * 100).toFixed(2)}%)`);
  console.log();

  const thumbnailOverhead = (thumbnailSize / mainFileSize) * 100;
  console.log(`Thumbnail overhead: ${thumbnailOverhead.toFixed(2)}% of main content`);
  console.log(`Health probe overhead: ${formatBytes(healthProbeSize)} (negligible)`);
  console.log();

  console.log('='.repeat(80));
  console.log('STORAGE USAGE ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / k ** i) * 100) / 100 + ' ' + sizes[i];
}

// Run analysis
analyzeStorageUsage()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
