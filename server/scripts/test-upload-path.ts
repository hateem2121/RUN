import { appStorageService } from "../app-storage-service.js";

async function testUploadPath() {
  console.log("🧪 Testing upload path normalization fix...\n");
  
  // Create a test image buffer
  const testBuffer = Buffer.from("Test image data - path normalization fix test");
  const testPath = "public/media/images/2025/10/1760264400000-test-upload-fix.png";
  
  console.log("📤 Test 1: Uploading with full path (public/media/...)");
  console.log(`   Input path: ${testPath}`);
  
  try {
    await appStorageService.uploadAsset(testPath, testBuffer, {
      contentType: "image/png"
    });
    console.log("   ✅ Upload successful\n");
    
    // List public partition to verify
    console.log("📁 Verifying file location in Object Storage...");
    const publicFiles = await appStorageService.listAssets("public/media/");
    const testFile = publicFiles.find(f => f.includes("test-upload-fix"));
    
    if (testFile) {
      console.log(`   ✅ File found at: ${testFile}`);
      
      if (testFile === testPath) {
        console.log("   ✅ PATH MATCH: File uploaded to CORRECT location!");
        console.log(`   ✅ Expected: ${testPath}`);
        console.log(`   ✅ Actual:   ${testFile}`);
      } else {
        console.log(`   ❌ PATH MISMATCH: File uploaded to WRONG location!`);
        console.log(`   ❌ Expected: ${testPath}`);
        console.log(`   ❌ Actual:   ${testFile}`);
      }
    } else {
      console.log("   ❌ File NOT FOUND in public/media/ partition");
      
      // Check if it went to wrong location
      const privateFiles = await appStorageService.listAssets("private/public/");
      const wrongFile = privateFiles.find(f => f.includes("test-upload-fix"));
      
      if (wrongFile) {
        console.log(`   ❌ DOUBLE PREFIX BUG: File found at: ${wrongFile}`);
      }
    }
    
    // Cleanup
    await appStorageService.deleteAsset(testPath);
    console.log("\n🧹 Cleanup: Test file deleted");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testUploadPath();
