import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyRoutes() {
  const routesDir = path.resolve(__dirname, "../server/routes");
  const indexFile = path.join(routesDir, "index.ts");

  try {
    const content = await fs.readFile(indexFile, "utf-8");
    const importRegex = /importWithLog\("([^"]+)"\)/g;
    let match: RegExpExecArray | null;
    let errors = 0;
    let _checked = 0;

    match = importRegex.exec(content);
    while (match !== null) {
      const importPath = match[1]!;
      const fullPath = path.resolve(routesDir, importPath.replace(/\.js$/, ".ts"));

      // Check .ts file existence (since we verify source)
      try {
        await fs.access(fullPath);
        _checked++;
      } catch {
        errors++;
      }
      match = importRegex.exec(content);
    }

    if (errors > 0) {
      process.exit(1);
    } else {
    }
  } catch (_error) {
    process.exit(1);
  }
}

verifyRoutes();
