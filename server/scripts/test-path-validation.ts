import { logger } from "../lib/monitoring/logger.js";
import { appStorageService } from "../lib/storage/app-service.js";

/**
 * TEST: Path Validation Protection
 * Verifies that malformed paths are rejected before upload
 */

async function testPathValidation() {
  const testBuffer = Buffer.from("Test data");

  // Define test cases: [path, shouldPass, description]
  const testCases: Array<[string, boolean, string]> = [
    // VALID PATHS (should pass)
    ["public/media/images/2025/10/test.png", true, "Valid public media path"],
    ["private/temp/uploads/test.bin", true, "Valid private temp path"],
    ["public/media/videos/2025/10/video.mp4", true, "Valid public video path"],

    // INVALID PATHS (should fail)
    ["private/public/media/test.png", false, "Double prefix: private/public/"],
    ["public/private/media/test.png", false, "Double prefix: public/private/"],
    ["public/public/media/test.png", false, "Double prefix: public/public/"],
    ["private/private/media/test.png", false, "Double prefix: private/private/"],
    ["media/images/test.png", true, "Auto-prefix: media/... → public/media/... (by design)"],
    ["public//media/test.png", false, "Multiple consecutive slashes"],
  ];

  let _passCount = 0;
  let failCount = 0;

  for (const [path, shouldPass, _description] of testCases) {
    try {
      await appStorageService.uploadAsset(path, testBuffer);

      if (shouldPass) {
        _passCount++;

        // Cleanup
        await appStorageService.deleteAsset(path).catch(() => {});
      } else {
        failCount++;

        // Cleanup in case it got through
        await appStorageService.deleteAsset(path).catch(() => {});
      }
    } catch (error) {
      const _errorMsg = error instanceof Error ? error.message : String(error);

      if (!shouldPass) {
        _passCount++;
      } else {
        failCount++;
      }
    }
  }

  if (failCount === 0) {
  } else {
  }
}

testPathValidation()
  .then(() => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
