const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const files = execSync('grep -rl "as any" server/services/').toString().split("\n").filter(Boolean);

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/as any\);/g, "as unknown as AppError);");
  content = content.replace(/as any\)/g, "as unknown as AppError)");
  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
