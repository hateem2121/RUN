import { FunctionDeclaration, MethodDeclaration, Node, Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "server/tsconfig.json",
});

const sourceFiles = project.getSourceFiles("server/services/repositories/**/*.ts");

let changed = 0;

for (const sourceFile of sourceFiles) {
  let fileChanged = false;

  const importDecls = sourceFile.getImportDeclarations();
  const neverthrowImport = importDecls.find((i) => i.getModuleSpecifierValue() === "neverthrow");
  if (!neverthrowImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "neverthrow",
      namedImports: ["Result", "ok", "err"],
    });
    fileChanged = true;
  } else {
    const namedImports = neverthrowImport.getNamedImports().map((ni) => ni.getName());
    const missing = [];
    if (!namedImports.includes("err")) missing.push("err");
    if (!namedImports.includes("ok")) missing.push("ok");
    if (!namedImports.includes("Result")) missing.push("Result");
    if (missing.length > 0) {
      neverthrowImport.addNamedImports(missing);
      fileChanged = true;
    }
  }

  // Find all methods and functions in the repository
  const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);

  for (const method of methods) {
    const returnTypeNode = method.getReturnTypeNode();
    if (returnTypeNode) {
      const returnText = returnTypeNode.getText();
      // Only modify methods that return a Promise<T> but not Promise<Result<...>>
      if (returnText.startsWith("Promise<") && !returnText.startsWith("Promise<Result<")) {
        const innerType = returnText.slice(8, -1);

        // Check if the method has any throws
        const throws = method
          .getDescendantsOfKind(SyntaxKind.ThrowStatement)
          .filter(
            (node) =>
              node.getFirstAncestor(
                (n) => Node.isMethodDeclaration(n) || Node.isFunctionDeclaration(n),
              ) === method,
          );

        if (throws.length > 0) {
          method.setReturnType(`Promise<Result<${innerType}, Error>>`);

          for (let j = throws.length - 1; j >= 0; j--) {
            const throwStmt = throws[j];
            const throwExpr = throwStmt.getExpression();
            if (throwExpr) {
              throwStmt.replaceWithText(`return err(${throwExpr.getText()});`);
              changed++;
            }
          }

          const returns = method
            .getDescendantsOfKind(SyntaxKind.ReturnStatement)
            .filter(
              (node) =>
                node.getFirstAncestor(
                  (n) => Node.isMethodDeclaration(n) || Node.isFunctionDeclaration(n),
                ) === method,
            );

          for (let k = returns.length - 1; k >= 0; k--) {
            const retStmt = returns[k];
            const retExpr = retStmt.getExpression();
            if (retExpr) {
              const text = retExpr.getText();
              if (!text.startsWith("err(") && !text.startsWith("ok(")) {
                retStmt.replaceWithText(`return ok(${text});`);
              }
            } else {
              if (innerType === "void" || innerType === "undefined") {
                retStmt.replaceWithText(`return ok(undefined);`);
              }
            }
          }

          fileChanged = true;
        }
      }
    }
  }

  if (fileChanged) sourceFile.saveSync();
}

console.log(`Changed ${changed} throw statements in repositories.`);
