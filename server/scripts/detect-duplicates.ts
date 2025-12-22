// @ts-nocheck
import { createHash } from 'crypto';
import { mediaAssets } from '../../shared/schema.js';
import { appStorageService } from '../app-storage-service.js';
import { db } from '../db.js';

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
  console.log('='.repeat(80));
  console.log('PHASE 5B - TASK 5B-5: DUPLICATE DETECTION');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Get all files from object storage
  console.log('Step 1: Listing all files in object storage...');
  const filePaths = await appStorageService.listAssets();
  
  if (!Array.isArray(filePaths)) {
    console.error('Failed to list assets - unexpected format:', filePaths);
    return;
  }

  // Convert paths to file objects with key and name
  const files = filePaths.map(path => ({
    key: path,
    name: path.split('/').pop() || path
  }));
  
  console.log(`Found ${files.length} files in object storage\n`);

  // Step 2: Get all DB records for cross-reference
  console.log('Step 2: Loading database records...');
  const dbRecords = await db.select().from(mediaAssets);
  console.log(`Found ${dbRecords.length} database records\n`);

  // Step 3: Download each file and calculate hash
  console.log('Step 3: Calculating file hashes...');
  const fileInfoMap = new Map<string, FileInfo>();
  const hashGroups = new Map<string, FileInfo[]>();
  
  let processed = 0;
  let failed = 0;

  for (const file of files) {
    try {
      processed++;
      process.stdout.write(`\rProcessing ${processed}/${files.length}: ${file.name || file.key}`);

      const fileBuffer = await appStorageService.downloadAsset(file.key);
      
      if (!Buffer.isBuffer(fileBuffer)) {
        failed++;
        console.error(`\n  ✗ Failed to download ${file.key}: not a buffer`);
        continue;
      }

      // Calculate hash
      const hash = createHash('sha256').update(fileBuffer).digest('hex');
      const size = fileBuffer.length;

      // Find matching DB record
      const dbRecord = dbRecords.find(r => r.storage_path === file.key);

      const fileInfo: FileInfo = {
        path: file.key,
        hash,
        size,
        dbRecord
      };

      fileInfoMap.set(file.key, fileInfo);

      // Group by hash
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash)!.push(fileInfo);

    } catch (error) {
      failed++;
      console.error(`\n  ✗ Error processing ${file.key}:`, error);
    }
  }

  console.log(`\n\nProcessed: ${processed} files`);
  console.log(`Failed: ${failed} files\n`);

  // Step 4: Identify duplicates
  console.log('Step 4: Analyzing duplicates...');
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
        wastedSpace
      });

      totalWastedSpace += wastedSpace;
    }
  }

  // Step 5: Report findings
  console.log('\n' + '='.repeat(80));
  console.log('DUPLICATE DETECTION RESULTS');
  console.log('='.repeat(80));
  console.log();

  console.log('SUMMARY:');
  console.log(`  Total files analyzed: ${fileInfoMap.size}`);
  console.log(`  Unique files (by hash): ${hashGroups.size}`);
  console.log(`  Duplicate groups found: ${duplicateGroups.length}`);
  console.log(`  Total wasted space: ${formatBytes(totalWastedSpace)}`);
  console.log();

  if (duplicateGroups.length > 0) {
    console.log('DUPLICATE GROUPS:\n');

    duplicateGroups.sort((a, b) => b.wastedSpace - a.wastedSpace);

    for (let i = 0; i < duplicateGroups.length; i++) {
      const group = duplicateGroups[i];
      console.log(`Group ${i + 1}: ${group.files.length} duplicates (${formatBytes(group.wastedSpace)} wasted)`);
      console.log(`  Hash: ${group.hash.substring(0, 16)}...`);
      
      for (const file of group.files) {
        const dbInfo = file.dbRecord 
          ? `DB ID: ${file.dbRecord.id}, Type: ${file.dbRecord.file_type}`
          : 'No DB record';
        console.log(`    - ${file.path} (${formatBytes(file.size)}) [${dbInfo}]`);
      }
      console.log();
    }
  } else {
    console.log('✅ NO DUPLICATES FOUND - All files are unique!\n');
  }

  // Step 6: Thumbnail analysis
  console.log('='.repeat(80));
  console.log('THUMBNAIL ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  const thumbnails = Array.from(fileInfoMap.values()).filter(f => f.path.includes('thumb-'));
  const mainFiles = Array.from(fileInfoMap.values()).filter(f => !f.path.includes('thumb-') && !f.path.includes('health-probe'));

  console.log(`Main files: ${mainFiles.length}`);
  console.log(`Thumbnails: ${thumbnails.length}`);
  console.log();

  // Check for thumbnails without main files
  const orphanedThumbnails: FileInfo[] = [];
  for (const thumb of thumbnails) {
    const mainPath = thumb.path.replace('thumb-', '');
    if (!fileInfoMap.has(mainPath)) {
      orphanedThumbnails.push(thumb);
    }
  }

  if (orphanedThumbnails.length > 0) {
    console.log(`⚠️  ORPHANED THUMBNAILS (no corresponding main file):`);
    for (const thumb of orphanedThumbnails) {
      const expectedMain = thumb.path.replace('thumb-', '');
      console.log(`  - ${thumb.path} (expects: ${expectedMain})`);
    }
  } else {
    console.log(`✅ All thumbnails have corresponding main files`);
  }
  console.log();

  // Step 7: Storage efficiency
  console.log('='.repeat(80));
  console.log('STORAGE EFFICIENCY');
  console.log('='.repeat(80));
  console.log();

  const totalStorage = Array.from(fileInfoMap.values()).reduce((sum, f) => sum + f.size, 0);
  const uniqueStorage = totalStorage - totalWastedSpace;
  const efficiency = totalWastedSpace === 0 ? 100 : ((uniqueStorage / totalStorage) * 100).toFixed(2);

  console.log(`Total storage used: ${formatBytes(totalStorage)}`);
  console.log(`Unique data: ${formatBytes(uniqueStorage)}`);
  console.log(`Wasted (duplicates): ${formatBytes(totalWastedSpace)}`);
  console.log(`Storage efficiency: ${efficiency}%`);
  console.log();

  console.log('='.repeat(80));
  console.log('DUPLICATE DETECTION COMPLETE');
  console.log('='.repeat(80));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / k ** i) * 100) / 100 + ' ' + sizes[i];
}

// Run detection
detectDuplicates()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
