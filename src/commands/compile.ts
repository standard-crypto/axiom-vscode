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

          // make sure default inputs are set
          const config = vscode.workspace.getConfiguration("axiom");
          if (config.get('circuitInputsProvided') === 'As separate input files' && circuit.defaultInputs === undefined) {
            vscode.window.showErrorMessage(
              "You must set a default input file before compiling",
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
                  undefined,
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
