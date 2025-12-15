/**
 * Phase 5B Task 4: Object Storage Inventory
 * Lists all files in object storage to locate missing assets
 */

import { appStorageService } from '../app-storage-service.js';
import { logger } from '../lib/smart-logger.js';

async function listAllStorageFiles(): Promise<void> {
  logger.info('[Storage Inventory] Starting object storage enumeration...');

  try {
    // List all files in bucket (no prefix = all files)
    const allFiles = await appStorageService.listAssets();

    logger.info(`[Storage Inventory] Found ${allFiles.length} total files in object storage`);

    // Categorize by prefix
    const byPrefix: Record<string, string[]> = {
      'media/': [],
      'media/assets/': [],
      'media/thumbnails/': [],
      'public/': [],
      'private/': [],
      'other': []
    };

    allFiles.forEach(file => {
      if (file.startsWith('media/assets/')) {
        byPrefix['media/assets/']!.push(file);
      } else if (file.startsWith('media/thumbnails/')) {
        byPrefix['media/thumbnails/']!.push(file);
      } else if (file.startsWith('media/')) {
        byPrefix['media/']!.push(file);
      } else if (file.startsWith('public/')) {
        byPrefix['public/']!.push(file);
      } else if (file.startsWith('private/')) {
        byPrefix['private/']!.push(file);
      } else {
        byPrefix['other']!.push(file);
      }
    });

    // Print summary
    console.log('\n========== OBJECT STORAGE INVENTORY ==========');
    console.log(`Total Files: ${allFiles.length}\n`);

    console.log('By Prefix:');
    Object.entries(byPrefix).forEach(([prefix, files]) => {
      if (files.length > 0) {
        console.log(`  ${prefix}: ${files.length} files`);
      }
    });

    console.log('\n========== ALL FILES ==========');
    allFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    console.log('\n========== MEDIA ASSETS DETAIL ==========');
    if (byPrefix['media/assets/']!.length > 0) {
      byPrefix['media/assets/']!.forEach(file => {
        console.log(`  - ${file}`);
      });
    } else {
      console.log('  (none)');
    }

    console.log('\n========== POTENTIAL MATCHES FOR MISSING FILES ==========');
    // Check for files that might be the "missing" ones from Task 5B-3
    const missingPatterns = [
      'w-1759917313453',
      'w-1759917341696',
      'w-1759917340370',
      'w-1759917352462',
      'w-1759917362914',
      'w-1759917371995',
      'w-1759917373258',
      'w-1759917375445',
      'w-1759917382402',
      'w-1759917392416'
    ];

    const potentialMatches: string[] = [];
    missingPatterns.forEach(pattern => {
      const matches = allFiles.filter(file => file.includes(pattern));
      if (matches.length > 0) {
        potentialMatches.push(...matches);
        console.log(`  Pattern "${pattern}": ${matches.join(', ')}`);
      }
    });

    if (potentialMatches.length === 0) {
      console.log('  ❌ No matches found - files are truly missing from storage');
    }

    console.log('\n========== ANALYSIS ==========');
    console.log(`Files in media/assets/: ${byPrefix['media/assets/']!.length}`);
    console.log(`Expected from DB: 12`);
    console.log(`Files verified in Task 5B-3: 2`);
    console.log(`Files missing from Task 5B-3: 10`);

    if (byPrefix['media/assets/']!.length === 2) {
      console.log('\n✅ Storage inventory matches Task 5B-3 verification:');
      console.log('   - Only 2 files exist in storage');
      console.log('   - 10 files are TRULY MISSING (not just key mismatch)');
      console.log('   - Data loss confirmed');
    } else if (byPrefix['media/assets/']!.length > 2) {
      console.log('\n⚠️  More files found than expected:');
      console.log('   - May indicate orphaned files or different prefixes');
      console.log('   - Review full file list above');
    }

    console.log('==============================================\n');

  } catch (error) {
    logger.error('[Storage Inventory] Error listing files:', error);
    console.error('Error listing storage files:', error);
    process.exit(1);
  }
}

// Execute inventory
listAllStorageFiles()
  .then(() => {
    console.log('✅ Storage inventory complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
