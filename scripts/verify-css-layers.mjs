import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cssPath = path.resolve(__dirname, "../client/src/index.css");

if (!fs.existsSync(cssPath)) {
  console.error("❌ index.css not found at", cssPath);
  process.exit(1);
}

const css = fs.readFileSync(cssPath, "utf-8");

// Find indices of layer definitions
const baseIndex = css.indexOf("@layer base");
const componentsIndex = css.indexOf("@layer components");
const utilitiesIndex = css.indexOf("@layer utilities");

let hasError = false;

console.log("🔍 Verifying CSS Layer Order...");

if (baseIndex === -1) {
  console.error("❌ Missing @layer base");
  hasError = true;
}

if (componentsIndex === -1) {
  console.error("❌ Missing @layer components");
  hasError = true;
}

if (utilitiesIndex === -1) {
  console.error("❌ Missing @layer utilities");
  hasError = true;
}

if (!hasError) {
  if (baseIndex > componentsIndex) {
    console.error("❌ @layer base must come before @layer components");
    hasError = true;
  }

  if (componentsIndex > utilitiesIndex) {
    console.error("❌ @layer components must come before @layer utilities");
    hasError = true;
  }
}

if (hasError) {
  console.error("💥 CSS Layer verification failed!");
  process.exit(1);
} else {
  console.log("✅ CSS Layer order is correct.");
  process.exit(0);
}
