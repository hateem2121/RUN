const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match import/export ... from "./foo" or "../foo"
      // Replace with .js extension if not already present
      content = content.replace(/(import\s+.*?from\s+["'])((\.\/|\.\.\/).*?)(["'])/g, (match, prefix, specifier, p3, suffix) => {
        if (!specifier.endsWith('.js') && !specifier.endsWith('.ts')) {
          return prefix + specifier + '.js' + suffix;
        }
        return match;
      });
      
      content = content.replace(/(export\s+.*?from\s+["'])((\.\/|\.\.\/).*?)(["'])/g, (match, prefix, specifier, p3, suffix) => {
        if (!specifier.endsWith('.js') && !specifier.endsWith('.ts')) {
          return prefix + specifier + '.js' + suffix;
        }
        return match;
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'shared'));
console.log("Done adding .js extensions.");
