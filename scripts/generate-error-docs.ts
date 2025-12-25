import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERROR_FILE_PATH = path.resolve(__dirname, "../server/errors/AppError.ts");
const OUTPUT_FILE_PATH = path.resolve(__dirname, "../docs/ERROR_CODES.md");

async function generateDocs() {
  const content = fs.readFileSync(ERROR_FILE_PATH, "utf-8");

  // Regex to match class definitions and super calls
  // Matches: export class [ClassName] ... super(..., [StatusCode], "[ErrorCode]" ...)
  const errorRegex = /export class (\w+) extends AppError \{[\s\S]*?super\(\s*.*?, (\d+), "(\w+)"/g;

  const errors = [];
  let match;

  while ((match = errorRegex.exec(content)) !== null) {
    errors.push({
      className: match[1],
      statusCode: match[2],
      errorCode: match[3],
      description: getDescription(content, match.index),
    });
  }

  // Add InternalError manually if regex misses the boolean arg structure or simple match
  // logic above covers standard pattern. InternalError has `false` at end, so it matches.

  const markdown = `# System Error Codes

> Auto-generated from source code. Do not edit manually.

| Error Code | Status | Class Name | Description |
| :--- | :--- | :--- | :--- |
${errors
  .map((e) => `| **${e.errorCode}** | ${e.statusCode} | \`${e.className}\` | ${e.description} |`)
  .join("\n")}

## Implementation Guide

Use these error classes in your controllers:

\`\`\`typescript
import { NotFoundError, ValidationError } from '../errors/AppError';

// throw new NotFoundError("Product not found");
\`\`\`
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE_PATH, markdown);
}

function getDescription(content: string, startIndex: number): string {
  // Try to extract default message from constructor
  // constructor(message: string = "Validation Failed"
  const constructorSlice = content.slice(startIndex, content.indexOf("}", startIndex));
  const messageMatch = /message: string = "(.*?)"/.exec(constructorSlice);
  return messageMatch?.[1] || "Application Error";
}

generateDocs().catch(console.error);
