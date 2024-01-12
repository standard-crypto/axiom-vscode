import * as vscode from "vscode";
import { compile } from "@axiom-crypto/circuit";
import { Circuit } from "../models/circuit";
import { StateStore } from "../state";

export const COMMAND_ID_COMPILE = "axiom-crypto.compile";

export class Compile implements vscode.Disposable {
  constructor(
    private context: vscode.ExtensionContext,
    stateStore: StateStore,
  ) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_COMPILE,
        async (circuit: Circuit) => {
          console.log("Compile", circuit);

          // make sure provider is set
          const provider: string =
            vscode.workspace.getConfiguration().get("axiom.providerURI") ?? "";
          if (provider.length === 0) {
            vscode.window.showErrorMessage(
              "You must set a provider URI before compiling",
            );
            return;
          }

          // set default inputs
          if (circuit.defaultInputs.path === "/") {
            for (const query of circuit.queries) {
              if (query.inputPath.path !== "/") {
                circuit.defaultInputs = query.inputPath;
              }
            }
          }

          // make sure default inputs are set
          if (circuit.defaultInputs.path === "/") {
            vscode.window.showErrorMessage(
              "You must add a query and set an input file before compiling",
            );
            return;
          }

          await stateStore.updateState(circuit);

          vscode.window.withProgress(
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

              await compile(circuit.source.filePath.fsPath, {
                stats: false,
                function: circuit.source.functionName,
                inputs:
                  circuit.defaultInputs?.fsPath ??
                  "TODO ---------------------------",
                output: circuit.buildPath.fsPath,
                provider: provider,
              });

              progress.report({
                increment: 100,
                message: `Saved to ${vscode.workspace.asRelativePath(
                  circuit.buildPath,
                )}`,
              });
              await new Promise((resolve) => {
                setTimeout(resolve, 5000);
              });
            },
          );
        },
      ),
    );
  }
  dispose() {}
}
