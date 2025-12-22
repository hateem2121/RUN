import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const templatePath = path.resolve(root, "client/index.html");

console.log(`[SSR Verify] Checking template at: ${templatePath}`);

if (!fs.existsSync(templatePath)) {
  console.error("[SSR Verify] \u274C Error: client/index.html not found!");
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf-8");
const errors: string[] = [];

if (!template.includes("<!--app-head-->")) {
  errors.push("Missing <!--app-head--> marker");
}

if (!template.includes("<!--app-html-->")) {
  errors.push("Missing <!--app-html--> marker inside #root");
}

if (errors.length > 0) {
  console.error("[SSR Verify] \u274C SSR Template Verification Failed:");
  errors.forEach((err) => console.error(`  - ${err}`));
  console.error("\nPlease restore markers in client/index.html to ensure correct SSR.");
  process.exit(1);
}

console.log("[SSR Verify] \u2705 Template verification passed (all markers present).");
process.exit(0);
