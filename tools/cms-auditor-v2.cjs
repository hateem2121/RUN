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

        const inputs = (
          content.match(
            /<(?:Input|Textarea|Switch|Select|Checkbox|RadioGroup)\b[^>]*name="([^"]+)"/g,
          ) || []
        )
          .map((m) => {
            const match = m.match(/name="([^"]+)"/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        const formFields = (content.match(/<FormField[^>]*name="([^"]+)"/g) || [])
          .map((m) => {
            const match = m.match(/name="([^"]+)"/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        const allFields = [...new Set([...inputs, ...formFields])];

        if (allFields.length > 0) {
          results.push({
            file: fullPath.replace(ADMIN_DIR, ""),
            fields: allFields,
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
