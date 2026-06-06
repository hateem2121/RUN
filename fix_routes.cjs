const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Only replace 'export function Component' at the start of a line
      content = content.replace(/^export function Component/gm, 'export default function Component');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'client/app/routes'));
console.log("Done fixing default exports.");
