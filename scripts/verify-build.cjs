const fs = require("fs");
const path = require("path");

const distServer = path.join(__dirname, "../dist/server/entry-server.js");
const distPublicAssets = path.join(__dirname, "../dist/public/assets");

console.log("🔍 Verifying build artifacts...");

// 1. Check SSR Entry
if (!fs.existsSync(distServer)) {
  console.error("❌ CRITICAL: SSR entry bundle missing!");
  console.error(`   Expected at: ${distServer}`);
  console.error('   Running "npm run build" should invoke "vite build --ssr".');
  process.exit(1);
}
console.log("✅ SSR entry bundle found.");

// 2. Check CSS Assets
let cssFound = false;
if (fs.existsSync(distPublicAssets)) {
  const files = fs.readdirSync(distPublicAssets);
  const cssFiles = files.filter((f) => f.endsWith(".css") && f.startsWith("index-"));
  if (cssFiles.length > 0) {
    console.log(`✅ Main CSS asset found: ${cssFiles[0]}`);
    cssFound = true;
  }
}

if (!cssFound) {
  console.error("❌ CRITICAL: Main CSS asset missing in dist/public/assets!");
  process.exit(1);
}

console.log("🎉 Build verification passed!");
process.exit(0);
