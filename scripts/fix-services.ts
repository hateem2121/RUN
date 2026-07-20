import { CallExpression, Node, Project, ReturnStatement, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "server/tsconfig.json",
});

const sourceFiles = project.getSourceFiles("server/services/**/*.ts");
// exclude repositories
const serviceFiles = sourceFiles.filter((f) => !f.getFilePath().includes("/repositories/"));

let changed = 0;

for (const sourceFile of serviceFiles) {
  let fileChanged = false;

  const returns = sourceFile.getDescendantsOfKind(SyntaxKind.ReturnStatement);
  for (const ret of returns) {
    const expr = ret.getExpression();
    if (expr && Node.isCallExpression(expr)) {
      const callee = expr.getExpression();
      if (callee.getText() === "ok") {
        const args = expr.getArguments();
        if (args.length === 1) {
          const arg = args[0];
          const type = arg.getType();
          const typeText = type.getText(arg);
          if (
            typeText.startsWith("Result<") ||
            typeText.startsWith("Err<") ||
            typeText.startsWith("Ok<")
          ) {
            // We are doing `return ok(result)`
            const argText = arg.getText();
            ret.replaceWithText(
              `if (${argText}.isErr()) return err(${argText}.error as any);\nreturn ok(${argText}.value);`,
            );
            changed++;
            fileChanged = true;
          }
        }
      }
    }
  }

  if (fileChanged) sourceFile.saveSync();
}

console.log(`Fixed ${changed} ok(Result) wrapping issues.`);
