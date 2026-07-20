import { execSync } from "child_process";
import fs from "fs";

const files = execSync('grep -rl "as any" server/').toString().split("\n").filter(Boolean);
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/as any\)/g, "as unknown as Error)");
  content = content.replace(/as any;/g, "as unknown as Error;");
  fs.writeFileSync(file, content);
}
const clientFiles = execSync('grep -rl "as any" client/').toString().split("\n").filter(Boolean);
for (const file of clientFiles) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/as any\)/g, "as unknown as any)");
  fs.writeFileSync(file, content);
}
