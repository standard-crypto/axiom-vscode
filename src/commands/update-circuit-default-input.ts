import * as vscode from "vscode";
import { CircuitsTree } from "../views/circuits-tree";
import { Circuit } from "../models/circuit";
import { StateStore } from "../state";

export const COMMAND_ID_UPDATE_CIRCUIT_DEFAULT_INPUT =
  "axiom-crypto.update-circuit-default-input";

export class UpdateCircuitDefaultInput implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_UPDATE_CIRCUIT_DEFAULT_INPUT,
        async ({ circuit }: { circuit: Circuit }) => {
          console.log("Update Circuit Default Input", { circuit });
          const updatedInput = await vscode.window.showOpenDialog({
            canSelectFolders: false,
            canSelectMany: false,
            filters: { JSON: ["json"] },
            openLabel: "Select as Input",
            title: "Select File for Circuit Default Input",
          });
          if (updatedInput !== undefined) {
            const inputPath = updatedInput[0].path;
            circuit.defaultInputs = vscode.Uri.parse(inputPath);
            await stateStore.updateState(circuit);
            circuitsTree.refresh();
          }
        },
      ),
    );
  }
  dispose() {}
}
