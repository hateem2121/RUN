import { appStorageService } from "../app-storage-service.js";

async function listStorageDetailed() {
  console.log("🔍 Listing Object Storage contents using appStorageService...\n");
  
  try {
    // List public files
    console.log("📁 PUBLIC PARTITION:");
    const publicFiles = await appStorageService.listAssets("public/");
    console.log(`  Total: ${publicFiles.length} files`);
    publicFiles.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));
    
    console.log("\n📁 PRIVATE PARTITION:");
    const privateFiles = await appStorageService.listAssets("private/");
    console.log(`  Total: ${privateFiles.length} files`);
    
    // Group by directory
    const tempUploads = privateFiles.filter(f => f.includes('temp/uploads/'));
    const otherPrivate = privateFiles.filter(f => !f.includes('temp/uploads/'));
    
    console.log(`\n  🗂️ Temp Uploads (private/temp/uploads/): ${tempUploads.length}`);
    if (tempUploads.length > 0 && tempUploads.length <= 20) {
      tempUploads.forEach((file, i) => console.log(`    ${i + 1}. ${file}`));
    } else if (tempUploads.length > 20) {
      console.log(`    (Too many to list - ${tempUploads.length} files)`);
      console.log(`    First 5: ${tempUploads.slice(0, 5).join(', ')}`);
      console.log(`    Last 5: ${tempUploads.slice(-5).join(', ')}`);
    }
    
    console.log(`\n  📦 Other Private Files: ${otherPrivate.length}`);
    if (otherPrivate.length > 0) {
      otherPrivate.forEach((file, i) => console.log(`    ${i + 1}. ${file}`));
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

listStorageDetailed();
