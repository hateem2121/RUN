const fs = require("node:fs");
const path = require("node:path");

const ADMIN_DIR = path.join(__dirname, "../client/app/components/admin");

function scanDir(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat?.isDirectory()) {
        results = results.concat(scanDir(fullPath));
      } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        const content = fs.readFileSync(fullPath, "utf8");

        const tabs = [];
        const matches = content.matchAll(tabRegex);
        for (const match of matches) {
          tabs.push({ value: match[1], label: match[2].trim().replace(/<[^>]+>/g, "") });
        }

        const modals = (content.match(/<(?:DialogContent|SheetContent|Modal)(?:\s|>)/g) || [])
          .length;
        const schemas = (content.match(/const\s+(\w+Schema)\s*=\s*z\.object/g) || []).map(
          (m) => m.split(" ")[1],
        );
        const forms = (content.match(/<Form\s/g) || []).length;

        if (tabs.length || modals > 0 || schemas.length || forms > 0) {
          results.push({
            file: fullPath.replace(ADMIN_DIR, ""),
            tabs,
            modals,
            schemas,
            forms,
          });
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  return results;
}

const audit = scanDir(ADMIN_DIR);
console.log(JSON.stringify(audit, null, 2));
