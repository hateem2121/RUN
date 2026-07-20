import { type ArrowFunction, type CallExpression, Node, Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "server/tsconfig.json",
});

const sourceFiles = project.getSourceFiles("server/services/**/*.ts");

const totalThrowsChanged = 0;

for (const sourceFile of sourceFiles) {
  const fileChanged = false;

  // We will collect the replacements to avoid modifying AST while iterating
  const replacements: { node: CallExpression; newText: string }[] = [];

  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of calls) {
    const expression = call.getExpression();
    if (
      Node.isPropertyAccessExpression(expression) &&
      expression.getText() === "ResultAsync.fromPromise"
    ) {
      const args = call.getArguments();
      if (args.length > 0) {
        const firstArg = args[0];
        if (Node.isCallExpression(firstArg)) {
          const innerExpr = firstArg.getExpression();
          let targetArrow: ArrowFunction | undefined;
          if (Node.isParenthesizedExpression(innerExpr)) {
            const arrow = innerExpr.getExpression();
            if (Node.isArrowFunction(arrow)) {
              targetArrow = arrow;
            }
          } else if (Node.isArrowFunction(innerExpr)) {
            targetArrow = innerExpr;
          }

          if (targetArrow) {
            const returnTypeNode = targetArrow.getReturnTypeNode();
            if (returnTypeNode) {
              const returnTypeText = returnTypeNode.getText();
              if (
                !returnTypeText.startsWith("Promise<Result<") &&
                returnTypeText.startsWith("Promise<")
              ) {
                const innerType = returnTypeText.slice(8, -1);

                // We'll replace the text of the arrow function
                let arrowText = targetArrow.getText();

                // 1. replace return type
                arrowText = arrowText.replace(
                  `Promise<${innerType}>`,
                  `Promise<Result<${innerType}, AppError>>`,
                );

                // 2. replace throw new X(Y) with return err(new X(Y))
                const throws = targetArrow.getDescendantsOfKind(SyntaxKind.ThrowStatement);
                for (const throwStmt of throws) {
                  const expr = throwStmt.getExpression();
                  if (expr) {
                    // we can't reliably do string replace on arrowText because there might be multiple identical throws
                    // let's just do AST replace, but we do it bottom-up
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
