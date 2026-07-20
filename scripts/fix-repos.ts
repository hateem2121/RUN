import { Node, Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "server/tsconfig.json",
});

const sourceFiles = project.getSourceFiles("server/services/repositories/**/*.ts");

let changed = 0;

for (const sourceFile of sourceFiles) {
  let fileChanged = false;

  const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
  for (const method of methods) {
    const returns = method
      .getDescendantsOfKind(SyntaxKind.ReturnStatement)
      .filter(
        (node) =>
          node.getFirstAncestor(
            (n) => Node.isMethodDeclaration(n) || Node.isFunctionDeclaration(n),
          ) === method,
      );

    for (const ret of returns) {
      const expr = ret.getExpression();
      if (expr && Node.isCallExpression(expr)) {
        const callee = expr.getExpression();
        if (callee.getText() === "ok") {
          const args = expr.getArguments();
          if (args.length === 1) {
            const arg = args[0];
            const argText = arg.getText();
            if (!argText.startsWith("await ")) {
              ret.replaceWithText(`return ok(await ${argText});`);
              changed++;
              fileChanged = true;
            }
          }
        }
      }
    }
  }

  if (fileChanged) sourceFile.saveSync();
}

console.log(`Fixed ${changed} repo return statements.`);
