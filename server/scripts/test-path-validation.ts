import { appStorageService } from "../app-storage-service.js";

/**
 * TEST: Path Validation Protection
 * Verifies that malformed paths are rejected before upload
 */

async function testPathValidation() {
  console.log("🧪 PATH VALIDATION SAFETY TEST");
  console.log("=" .repeat(80) + "\n");
  
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
  
  let passCount = 0;
  let failCount = 0;
  
  for (const [path, shouldPass, description] of testCases) {
    console.log(`Testing: ${description}`);
    console.log(`  Path: ${path}`);
    console.log(`  Expected: ${shouldPass ? "PASS ✅" : "FAIL ❌"}`);
    
    try {
      await appStorageService.uploadAsset(path, testBuffer);
      
      if (shouldPass) {
        console.log(`  Result: ✅ PASSED (upload accepted)`);
        passCount++;
        
        // Cleanup
        await appStorageService.deleteAsset(path).catch(() => {});
      } else {
        console.log(`  Result: ❌ FAILED (should have been rejected!)`);
        failCount++;
        
        // Cleanup in case it got through
        await appStorageService.deleteAsset(path).catch(() => {});
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (!shouldPass) {
        console.log(`  Result: ✅ PASSED (correctly rejected)`);
        console.log(`  Error: ${errorMsg}`);
        passCount++;
      } else {
        console.log(`  Result: ❌ FAILED (should have been accepted!)`);
        console.log(`  Error: ${errorMsg}`);
        failCount++;
      }
    }
    
    console.log("");
  }
  
  console.log("=" .repeat(80));
  console.log("📊 TEST SUMMARY:\n");
  console.log(`  Total tests:  ${testCases.length}`);
  console.log(`  Passed:       ${passCount} ✅`);
  console.log(`  Failed:       ${failCount} ❌`);
  
  if (failCount === 0) {
    console.log("\n🎉 SUCCESS: All path validation tests passed!");
    console.log("   Future uploads are protected from path bugs.");
  } else {
    console.log(`\n⚠️ WARNING: ${failCount} test(s) failed!`);
    console.log("   Path validation may need adjustment.");
  }
  
  console.log("\n" + "=".repeat(80));
}

testPathValidation()
  .then(() => {
    console.log("✅ Path validation test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
