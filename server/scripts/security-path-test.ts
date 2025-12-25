import { appStorageService } from "../app-storage-service.js";

/**
 * SECURITY & EDGE CASE PATH TEST
 * Tests malicious inputs, private uploads, and edge cases
 */

async function securityPathTest() {
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

  for (const testCase of testCases) {
    if (testCase.expectedPath) {
    }

    try {
      const url = await appStorageService.uploadAsset(testCase.path, testBuffer, {
        isPublic: testCase.isPublic,
      });

      // Extract actual path from URL
      const actualPath = url.replace("/api/media/proxy/", "");

      if (testCase.shouldPass) {
        if (testCase.expectedPath && actualPath !== testCase.expectedPath) {
          failCount++;
        } else {
          passCount++;

          // Cleanup
          await appStorageService.deleteAsset(actualPath).catch(() => {});
        }
      } else {
        failCount++;

        // Cleanup
        await appStorageService.deleteAsset(actualPath).catch(() => {});
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (!testCase.shouldPass) {
        passCount++;
      } else {
        failCount++;
      }
    }
  }

  if (failCount === 0) {
  } else {
  }
}

securityPathTest()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
