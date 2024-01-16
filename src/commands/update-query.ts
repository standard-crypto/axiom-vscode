import * as vscode from "vscode";
import { Query } from "../models/query";
import { CircuitsTree } from "../views/circuits-tree";
import { Circuit } from "../models/circuit";
import { StateStore } from "../state";
import * as path from "path";

export const COMMAND_ID_RENAME_QUERY = "axiom-crypto.rename-query";
export const COMMAND_ID_DELETE_QUERY = "axiom-crypto.delete-query";
export const COMMAND_ID_UPDATE_QUERY_INPUT = "axiom-crypto.update-query-input";
export const COMMAND_ID_UPDATE_QUERY_CALLBACK =
  "axiom-crypto.update-query-callback";
export const COMMAND_ID_UPDATE_QUERY_REFUND =
  "axiom-crypto.update-query-refund";

export class RenameQuery implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_RENAME_QUERY,
        async ({ query }: { query: Query }) => {
          console.log("Rename Query", query);
          const updatedName = await vscode.window.showInputBox({
            value: query.name,
          });
          if (updatedName !== undefined) {
            query.name = updatedName;
            const buildPathPrefix = query.circuit.buildPath.path.substring(
              0,
              query.circuit.buildPath.path.lastIndexOf("/"),
            );
            const outputPath = path.join(
              buildPathPrefix,
              query.circuit.name,
              updatedName,
              "output.json",
            );
            query.outputPath = vscode.Uri.parse(outputPath);
            stateStore.updateState(query.circuit);
            circuitsTree.refresh();
          }
        },
      ),
    );
  }
  dispose() {}
}

export class DeleteQuery implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_DELETE_QUERY,
        async (treeItem: { query: Query | undefined; circuit: Circuit }) => {
          console.log("Delete Query", treeItem);
          treeItem.circuit.queries = treeItem.circuit.queries.filter(
            (query) => query !== treeItem.query,
          );
          treeItem.query = undefined;
          await stateStore.updateState(treeItem.circuit);
          circuitsTree.refresh();
        },
      ),
    );
  }
  dispose() {}
}

export class UpdateQueryInput implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_UPDATE_QUERY_INPUT,
        async ({ query }: { query: Query }) => {
          console.log("Update Query Input", { query });
          const updatedInput = await vscode.window.showOpenDialog({
            canSelectFolders: false,
            canSelectMany: false,
            filters: { JSON: ["json"] },
            openLabel: "Select as Input",
            title: "Select File for Query Input",
          });
          if (updatedInput !== undefined) {
            const inputPath = updatedInput[0].path;
            query.inputPath = vscode.Uri.parse(inputPath);
            await stateStore.updateState(query.circuit);
            circuitsTree.refresh();
          }
        },
      ),
    );
  }
  dispose() {}
}

export class UpdateQueryCallback implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_UPDATE_QUERY_CALLBACK,
        async ({ query }: { query: Query }) => {
          console.log("Update Query Callback", query);
          const updatedCallback = await vscode.window.showInputBox({
            value: query.callbackAddress,
          });
          if (updatedCallback !== undefined) {
            query.callbackAddress = updatedCallback as `0x${string}`;
            console.log(`updated query callback - ${query.callbackAddress}`);
            await stateStore.updateState(query.circuit);
            circuitsTree.refresh();
          }
        },
      ),
    );
  }
  dispose() {}
}

export class UpdateQueryRefund implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_UPDATE_QUERY_REFUND,
        async ({ query }: { query: Query }) => {
          console.log("Update Query Refund", query);
          const updatedRefund = await vscode.window.showInputBox({
            value: query.refundAddress,
          });
          if (updatedRefund !== undefined) {
            query.refundAddress = updatedRefund as `0x${string}`;
            await stateStore.updateState(query.circuit);
            circuitsTree.refresh();
          }
        },
      ),
    );
  }
  dispose() {}
}
