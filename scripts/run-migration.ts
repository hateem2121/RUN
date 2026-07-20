import {
  type ArrowFunction,
  Node,
  Project,
  ReturnStatement,
  SyntaxKind,
  ThrowStatement,
} from "ts-morph";

const project = new Project({
  tsConfigFilePath: "server/tsconfig.json",
});

const sourceFiles = project.getSourceFiles([
  "server/services/**/*.ts",
  "server/services/repositories/**/*.ts",
]);

let totalThrowsChanged = 0;
let totalBlocksChanged = 0;

for (const sourceFile of sourceFiles) {
  let fileChanged = false;

  // 1. Make sure err and ok are imported from neverthrow
  const importDecls = sourceFile.getImportDeclarations();
  const neverthrowImport = importDecls.find((i) => i.getModuleSpecifierValue() === "neverthrow");
  if (neverthrowImport) {
    const namedImports = neverthrowImport.getNamedImports().map((ni) => ni.getName());
    const missing = [];
    if (!namedImports.includes("err")) missing.push("err");
    if (!namedImports.includes("ok")) missing.push("ok");
    if (!namedImports.includes("ResultAsync") && sourceFile.getFullText().includes("ResultAsync")) {
      missing.push("ResultAsync");
    }
    if (missing.length > 0) {
      neverthrowImport.addNamedImports(missing);
      fileChanged = true;
    }
  }

  // Find all ResultAsync.fromPromise calls
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  // Iterate in reverse
  for (let i = calls.length - 1; i >= 0; i--) {
    const call = calls[i];
    const expression = call.getExpression();
    if (
      Node.isPropertyAccessExpression(expression) &&
      expression.getText() === "ResultAsync.fromPromise"
    ) {
      const args = call.getArguments();
      if (args.length === 2) {
        const firstArg = args[0];
        const secondArg = args[1];

        let targetArrow: ArrowFunction | undefined;

        if (Node.isCallExpression(firstArg)) {
          const innerExpr = firstArg.getExpression();
          if (Node.isParenthesizedExpression(innerExpr)) {
            const arrow = innerExpr.getExpression();
            if (Node.isArrowFunction(arrow)) targetArrow = arrow;
          } else if (Node.isArrowFunction(innerExpr)) {
            targetArrow = innerExpr;
          }
        }

        if (targetArrow) {
          const returnTypeNode = targetArrow.getReturnTypeNode();
          if (returnTypeNode) {
            const returnTypeText = returnTypeNode.getText();
            if (
              !returnTypeText.startsWith("Result<") &&
              returnTypeText.startsWith("Promise<") &&
              !returnTypeText.startsWith("Promise<Result<")
            ) {
              const innerType = returnTypeText.slice(8, -1);

              targetArrow.setReturnType(`Promise<Result<${innerType}, AppError>>`);

              const throws = targetArrow
                .getDescendantsOfKind(SyntaxKind.ThrowStatement)
                .filter(
                  (node) =>
                    node.getFirstAncestor((n) => Node.isFunctionLikeDeclaration(n)) === targetArrow,
                );

              for (let j = throws.length - 1; j >= 0; j--) {
                const throwStmt = throws[j];
                const throwExpr = throwStmt.getExpression();
                if (throwExpr) {
                  throwStmt.replaceWithText(`return err(${throwExpr.getText()});`);
                  totalThrowsChanged++;
                }
              }

              const returns = targetArrow
                .getDescendantsOfKind(SyntaxKind.ReturnStatement)
                .filter(
                  (node) =>
                    node.getFirstAncestor((n) => Node.isFunctionLikeDeclaration(n)) === targetArrow,
                );

              for (let k = returns.length - 1; k >= 0; k--) {
                const retStmt = returns[k];
                const retExpr = retStmt.getExpression();
                if (retExpr) {
                  const text = retExpr.getText();
                  if (
                    !text.startsWith("err(") &&
                    !text.startsWith("ok(") &&
                    !text.startsWith("ResultAsync")
                  ) {
                    retStmt.replaceWithText(`return ok(${text});`);
                  }
                } else {
                  if (innerType === "void" || innerType === "undefined") {
                    retStmt.replaceWithText(`return ok(undefined);`);
                  }
                }
              }

              const handlerText = secondArg.getText();
              const arrowText = targetArrow.getText();

              call.replaceWithText(`new ResultAsync((${arrowText})().catch(${handlerText}))`);

              totalBlocksChanged++;
              fileChanged = true;
            }
          }
        }
      }
    }
  }

  // Second pass: fix catch blocks that return raw AppErrors instead of err(AppError)
  const catchCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
    const expr = call.getExpression();
    return Node.isPropertyAccessExpression(expr) && expr.getName() === "catch";
  });

  for (const catchCall of catchCalls) {
    const propAccess = catchCall.getExpression();
    if (Node.isPropertyAccessExpression(propAccess)) {
      const baseExpr = propAccess.getExpression();
      if (Node.isCallExpression(baseExpr)) {
        const callee = baseExpr.getExpression();
        // Since we wrapped it in new ResultAsync(), the callee is now inside the new ResultAsync() argument.
        // Wait, if it's `new ResultAsync( (async () => {})().catch() )`, then `catchCall` is inside `NewExpression`.
        if (
          Node.isParenthesizedExpression(callee) ||
          Node.isArrowFunction(callee) ||
          Node.isCallExpression(callee)
        ) {
          const args = catchCall.getArguments();
          if (args.length === 1 && Node.isArrowFunction(args[0])) {
            const catchArrow = args[0];
            const returns = catchArrow
              .getDescendantsOfKind(SyntaxKind.ReturnStatement)
              .filter(
                (node) =>
                  node.getFirstAncestor((n) => Node.isFunctionLikeDeclaration(n)) === catchArrow,
              );
            for (const ret of returns) {
              const expr = ret.getExpression();
              if (expr && !expr.getText().startsWith("err(")) {
                ret.replaceWithText(`return err(${expr.getText()});`);
                fileChanged = true;
              }
            }
          }
        }
      }
    }
  }

  if (fileChanged) {
    sourceFile.saveSync();
  }
}

console.log(`Changed ${totalThrowsChanged} throw statements across ${totalBlocksChanged} blocks.`);
