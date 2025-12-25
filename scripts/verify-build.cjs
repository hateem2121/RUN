const fs = require("node:fs");
const path = require("node:path");

const distServer = path.join(__dirname, "../dist/server/entry-server.js");
const distPublicAssets = path.join(__dirname, "../dist/public/assets");

// 1. Check SSR Entry
if (!fs.existsSync(distServer)) {
  process.exit(1);
}

// 2. Check CSS Assets
let cssFound = false;
if (fs.existsSync(distPublicAssets)) {
  const files = fs.readdirSync(distPublicAssets);
  const cssFiles = files.filter((f) => f.endsWith(".css") && f.startsWith("index-"));
  if (cssFiles.length > 0) {
    cssFound = true;
  }
}

if (!cssFound) {
  process.exit(1);
}
process.exit(0);
