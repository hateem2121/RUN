import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyRoutes() {
  console.log("🔍 Verifying dynamic route imports...");

  const routesDir = path.resolve(__dirname, "../server/routes");
  const indexFile = path.join(routesDir, "index.ts");

  try {
    const content = await fs.readFile(indexFile, "utf-8");
    const importRegex = /importWithLog\("([^"]+)"\)/g;
    let match;
    let errors = 0;
    let checked = 0;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]!;
      const fullPath = path.resolve(routesDir, importPath.replace(/\.js$/, ".ts"));

      // Check .ts file existence (since we verify source)
      try {
        await fs.access(fullPath);
        checked++;
      } catch {
        console.error(`❌ Missing route module: ${importPath} (at ${fullPath})`);
        errors++;
      }
    }

    if (errors > 0) {
      console.error(`\nFound ${errors} missing route modules.`);
      process.exit(1);
    } else {
      console.log(`✅ Verified ${checked} route modules. All good.`);
    }
  } catch (error) {
    console.error("Failed to read routes index:", error);
    process.exit(1);
  }
}

verifyRoutes();
