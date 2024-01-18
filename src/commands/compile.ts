import * as vscode from "vscode";
import { compile } from "@axiom-crypto/circuit";
import { Circuit } from "../models/circuit";
import { CONFIG_KEYS } from "../config";
import { assertCircuitCanBeCompiled } from "../utils/validation";

export const COMMAND_ID_COMPILE = "axiom-crypto.compile";

export class Compile implements vscode.Disposable {
  constructor(
    private context: vscode.ExtensionContext
  ) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_COMPILE,
        async (circuit: Circuit) => {
          console.log("Compile", circuit);

          // make sure provider is set
          const provider: string =
            vscode.workspace
              .getConfiguration()
              .get(`axiom.${CONFIG_KEYS.ProviderURI}`) ?? "";
          if (provider.length === 0) {
            vscode.window
              .showErrorMessage(
                "You must set a provider URI before compiling",
                "Open Axiom settings",
              )
              .then((choice) => {
                if (choice === "Open Axiom settings") {
                  vscode.commands.executeCommand(
                    "workbench.action.openWorkspaceSettings",
                    "axiom",
                  );
                }
              });
            return;
          }

          // make sure the Circuit can compile
          if (!assertCircuitCanBeCompiled(circuit)) {
            return;
          }

          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Axiom",
              cancellable: false,
            },
            async (progress) => {
              progress.report({
                increment: 0,
                message: "Compiling circuit...",
              });

              await rawCompile(provider, circuit);

              progress.report({
                increment: 100,
                message: `Compiled successfully`,
              });
            },
          );

          vscode.window
            .showInformationMessage(
              `Compiled to ${vscode.workspace.asRelativePath(
                circuit.buildPath,
              )}`,
              "Go to output",
            )
            .then(async (choice) => {
              if (choice === "Go to output") {
                const document = await vscode.workspace.openTextDocument(
                  circuit.buildPath,
                );
                const editor = await vscode.window.showTextDocument(document);
              }
            });
        },
      ),
    );
  }
  dispose() {}
}

export async function rawCompile(provider: string, circuit: Circuit) {
  await compile(circuit.source.filePath.fsPath, {
    stats: false,
    function: circuit.source.functionName,
    inputs: circuit.defaultInputs?.fsPath,
    output: circuit.buildPath.fsPath,
    provider: provider,
  });
}
