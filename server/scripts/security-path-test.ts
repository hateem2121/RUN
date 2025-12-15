import { appStorageService } from "../app-storage-service.js";

/**
 * SECURITY & EDGE CASE PATH TEST
 * Tests malicious inputs, private uploads, and edge cases
 */

async function securityPathTest() {
  console.log("🔒 SECURITY & EDGE CASE PATH TEST");
  console.log("=".repeat(80) + "\n");
  
  const testBuffer = Buffer.from("Security test data");
  
  type TestCase = {
    description: string;
    path: string;
    isPublic?: boolean;
    shouldPass: boolean;
    expectedPath?: string;
  };
  
  const testCases: TestCase[] = [
    // === SECURITY TESTS (should FAIL) ===
    {
      description: "Path traversal attack with ../",
      path: "media/../../etc/passwd",
      isPublic: true,
      shouldPass: false,
    },
    {
      description: "Double prefix with isPublic:false (bypass attempt)",
      path: "public/media/test.png",
      isPublic: false,
      shouldPass: true, // Should PASS but force to private/media/test.png
      expectedPath: "private/media/test.png",
    },
    {
      description: "Path traversal in private upload",
      path: "private/../public/media/test.png",
      isPublic: false,
      shouldPass: false,
    },
    {
      description: "Absolute path attempt",
      path: "/etc/passwd",
      isPublic: true,
      shouldPass: false,
    },
    {
      description: "Protocol injection attempt",
      path: "http://evil.com/media/test.png",
      isPublic: true,
      shouldPass: false,
    },
    {
      description: "Multiple consecutive slashes",
      path: "media//images///test.png",
      isPublic: true,
      shouldPass: false,
    },
    
    // === PRIVATE UPLOAD TESTS (should PASS) ===
    {
      description: "Valid private upload",
      path: "temp/uploads/private-file.dat",
      isPublic: false,
      shouldPass: true,
      expectedPath: "private/temp/uploads/private-file.dat",
    },
    {
      description: "Private upload with media path",
      path: "media/private-images/secure.png",
      isPublic: false,
      shouldPass: true,
      expectedPath: "private/media/private-images/secure.png",
    },
    
    // === PUBLIC UPLOAD TESTS (should PASS) ===
    {
      description: "Valid public media upload",
      path: "media/images/2025/10/test.png",
      isPublic: true,
      shouldPass: true,
      expectedPath: "public/media/images/2025/10/test.png",
    },
    {
      description: "Public upload with explicit prefix (should strip and rebuild)",
      path: "public/media/test.png",
      isPublic: true,
      shouldPass: true,
      expectedPath: "public/media/test.png",
    },
    {
      description: "Media path defaults to public when isPublic undefined",
      path: "media/images/default.png",
      isPublic: undefined,
      shouldPass: true,
      expectedPath: "public/media/images/default.png",
    },
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  console.log(`📋 Running ${testCases.length} security and edge case tests...\n`);
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.description}`);
    console.log(`  Input path: ${testCase.path}`);
    console.log(`  isPublic: ${testCase.isPublic}`);
    console.log(`  Expected: ${testCase.shouldPass ? "PASS" : "FAIL (blocked)"}`);
    if (testCase.expectedPath) {
      console.log(`  Expected final path: ${testCase.expectedPath}`);
    }
    
    try {
      const url = await appStorageService.uploadAsset(
        testCase.path,
        testBuffer,
        { isPublic: testCase.isPublic }
      );
      
      // Extract actual path from URL
      const actualPath = url.replace("/api/media/proxy/", "");
      
      if (testCase.shouldPass) {
        if (testCase.expectedPath && actualPath !== testCase.expectedPath) {
          console.log(`  ❌ FAILED: Expected path '${testCase.expectedPath}' but got '${actualPath}'`);
          failCount++;
        } else {
          console.log(`  ✅ PASSED: Upload successful`);
          console.log(`     Final path: ${actualPath}`);
          passCount++;
          
          // Cleanup
          await appStorageService.deleteAsset(actualPath).catch(() => {});
        }
      } else {
        console.log(`  ❌ FAILED: Should have been blocked but upload succeeded!`);
        console.log(`     Actual path: ${actualPath}`);
        failCount++;
        
        // Cleanup
        await appStorageService.deleteAsset(actualPath).catch(() => {});
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (!testCase.shouldPass) {
        console.log(`  ✅ PASSED: Correctly blocked`);
        console.log(`     Error: ${errorMsg}`);
        passCount++;
      } else {
        console.log(`  ❌ FAILED: Should have succeeded but was blocked!`);
        console.log(`     Error: ${errorMsg}`);
        failCount++;
      }
    }
    
    console.log("");
  }
  
  // Summary
  console.log("=".repeat(80));
  console.log("📊 SECURITY TEST SUMMARY:\n");
  console.log(`  Total tests:  ${testCases.length}`);
  console.log(`  Passed:       ${passCount} ✅`);
  console.log(`  Failed:       ${failCount} ❌`);
  
  if (failCount === 0) {
    console.log("\n🎉 SUCCESS: All security tests passed!");
    console.log("   ✅ Path traversal blocked");
    console.log("   ✅ Double prefix bugs prevented");
    console.log("   ✅ Private uploads work correctly");
    console.log("   ✅ Public uploads work correctly");
    console.log("   ✅ isPublic flag enforced properly");
  } else {
    console.log(`\n⚠️ WARNING: ${failCount} test(s) failed!`);
    console.log("   Security vulnerabilities may exist.");
  }
  
  console.log("\n" + "=".repeat(80));
}

securityPathTest()
  .then(() => {
    console.log("✅ Security path test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
