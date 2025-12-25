import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const templatePath = path.resolve(root, "client/index.html");

if (!fs.existsSync(templatePath)) {
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
  errors.forEach((_err) => {});
  process.exit(1);
}
process.exit(0);
