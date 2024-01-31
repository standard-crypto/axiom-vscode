import * as vscode from "vscode";
import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";
import { execSync } from "child_process";

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

export async function getFunctionFromTs(
  relativePath: string,
  functionName: string,
) {
  const code = fs.readFileSync(path.resolve(relativePath), "utf8");
  const result = ts.transpileModule(code, {
    compilerOptions: {
      preserveConstEnums: true,
      keepFunctionNames: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
    },
  });
  const script = new vm.Script(result.outputText);
  const customRequire = (moduleName: string) => {
    try {
      if (moduleName === "@axiom-crypto/halo2-lib-js") {
        return require("@axiom-crypto/halo2-lib-js");
      } else if (moduleName === "@axiom-crypto/client") {
        return require("@axiom-crypto/client");
      } else {
        const npmRoot = execSync("npm root").toString().trim();
        return require(`${npmRoot}/${moduleName}`);
      }
    } catch (e) {
      throw new Error(
        `Cannot find module '${moduleName}'.\n Try installing it globally with 'npm install -g ${moduleName}'`,
      );
    }
  };
  const context = vm.createContext({
    exports: {},
    require: customRequire,
    module: module,
    console: console,
    __filename: __filename,
    __dirname: __dirname,
  });
  script.runInContext(context);
  if (!context.exports[functionName]) {
    throw new Error(
      `File does not export a function called \`${functionName}\`!`,
    );
  }
  return context.exports[functionName];
}
