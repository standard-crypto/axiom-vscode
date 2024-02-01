import * as vscode from "vscode";
import ts from "typescript";

export function extractCircuitName(
  circuitFileUri: vscode.Uri,
): string | undefined {
  // load the typescript program from its source file
  const program = ts.createProgram([circuitFileUri.fsPath], {});
  const sourceFile = program.getSourceFile(circuitFileUri.fsPath);
  if (sourceFile === undefined) {
    return;
  }
  const typeChecker = program.getTypeChecker();

  // fetch all exports from the circuit file
  const fileSymbol = typeChecker.getSymbolAtLocation(sourceFile);
  if (fileSymbol === undefined) {
    return;
  }
  const exports = program.getTypeChecker().getExportsOfModule(fileSymbol);

  // search exports for anything that looks like a function
  for (const exp of exports) {
    if (exp.declarations === undefined || exp.declarations.length === 0) {
      continue;
    }
    const declaration = exp.declarations[0];

    if (ts.isFunctionLike(declaration)) {
      /* found an export like:
       *     export async myCircuit(param1, param2) {
       *
       *     }
       */
      return (declaration.name as ts.Identifier).escapedText.toString();
    } else if (ts.isVariableDeclaration(declaration)) {
      if (ts.isFunctionLike(declaration.initializer)) {
        /* found an export like:
         *     export const myCircuit = async(param1, param2) => {
         *
         *     }
         */
        return (declaration.name as ts.Identifier).escapedText.toString();
      }
    }
  }
}
