import * as vscode from "vscode";
import { Circuit } from "../models/circuit";
import { Query } from "../models/query";
import { CircuitsTree } from "../views/circuits-tree";
import * as path from "path";

export const COMMAND_ID_ADD_QUERY = "axiom-crypto.add-query";

export class AddQuery implements vscode.Disposable {
  constructor(
    private context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
  ) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_ADD_QUERY,
        async (treeItem: { circuit: Circuit }) => {
          console.log("add query");
          vscode.window.showInformationMessage("Add Query");
          const queryName =
            "query" + (treeItem.circuit.queries.length + 1).toString();
          const buildPathPrefix = treeItem.circuit.buildPath.path.substring(
            0,
            treeItem.circuit.buildPath.path.lastIndexOf("/"),
          );
          const outputPath = path.join(
            buildPathPrefix,
            treeItem.circuit.name,
            queryName,
            "output.json",
          );
          treeItem.circuit.queries.push(
            new Query({
              name: queryName,
              inputPath: vscode.Uri.parse(""),
              outputPath: vscode.Uri.parse(outputPath),
              refundAddress: "0x0" as `0x${string}`,
              callbackAddress: "0x0" as `0x${string}`,
            }),
          );
          circuitsTree.refresh();
        },
      ),
    );
  }
  dispose() {}
}
