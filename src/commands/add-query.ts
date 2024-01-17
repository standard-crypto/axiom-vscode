import * as vscode from "vscode";
import * as path from "path";
import { Circuit } from "../models/circuit";
import { Query } from "../models/query";
import { CircuitsTree } from "../views/circuits-tree";
import { COMMAND_ID_UPDATE_QUERY_INPUT } from "./update-query";
import { StateStore } from "../state";

export const COMMAND_ID_ADD_QUERY = "axiom-crypto.add-query";

export class AddQuery implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_ADD_QUERY,
        async ({ circuit }: { circuit: Circuit }) => {
          console.log("add query");

          const queryName = "query" + (circuit.queries.length + 1).toString();

          const buildFolder = path.dirname(circuit.buildPath.fsPath);
          const outputPath = vscode.Uri.parse(
            path.join(buildFolder, queryName, "output.json"),
          );

          const query = new Query({
            name: queryName,
            circuit: circuit,
            outputPath: outputPath,
          });
          circuit.queries.push(query);
          stateStore.updateState(circuit);

          vscode.window
            .showInformationMessage(
              `Added new query named '${queryName}'`,
              "Set query input",
            )
            .then((choice) => {
              if (choice === "Set query input") {
                vscode.commands.executeCommand(COMMAND_ID_UPDATE_QUERY_INPUT, {
                  query,
                });
              }
            });

          circuitsTree.refresh();
        },
      ),
    );
  }
  dispose() {}
}
