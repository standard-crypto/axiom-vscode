import * as vscode from "vscode";
import { compile } from "@axiom-crypto/circuit";
import { Circuit } from "../models/circuit";
import { StateStore } from "../state";
import { CONFIG_KEYS } from "../config";

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
            vscode.workspace
              .getConfiguration()
              .get(`axiom.${CONFIG_KEYS.ProviderURI}`) ?? "";
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
  // set default inputs
  if (circuit.defaultInputs === undefined) {
    for (const query of circuit.queries) {
      if (query.inputPath !== undefined) {
        circuit.defaultInputs = query.inputPath;
      }
    }
  }

  // make sure default inputs are set
  // TODO: this is a bit clunky, the user should be able to use
  // an input that isn't part of a query, or they should be able
  // to use typescript exports to define the default inputs
  if (circuit.defaultInputs === undefined) {
    vscode.window.showErrorMessage(
      "You must add a query and set an input file before compiling",
    );
    return;
  }

  await compile(circuit.source.filePath.fsPath, {
    stats: false,
    function: circuit.source.functionName,
    inputs: circuit.defaultInputs?.fsPath ?? undefined,
    output: circuit.buildPath.fsPath,
    provider: provider,
  });
}
