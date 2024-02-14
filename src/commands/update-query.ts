import * as vscode from "vscode";
import { Query } from "../models/query";
import { CircuitsTree } from "../views/circuits-tree";
import { Circuit } from "../models/circuit";
import { StateStore } from "../state";
import * as path from "path";
import { ethers } from "ethers";

export const COMMAND_ID_RENAME_QUERY = "axiom-crypto.rename-query";
export const COMMAND_ID_DELETE_QUERY = "axiom-crypto.delete-query";
export const COMMAND_ID_UPDATE_QUERY_INPUT = "axiom-crypto.update-query-input";
export const COMMAND_ID_UPDATE_QUERY_CALLBACK =
  "axiom-crypto.update-query-callback";
export const COMMAND_ID_UPDATE_QUERY_REFUND =
  "axiom-crypto.update-query-refund";
export const COMMAND_ID_UPDATE_QUERY_CALLBACK_EXTRA_DATA =
  "axiom-crypto.update-query-callback-extra-data";

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

            const buildFolder = path.dirname(query.circuit.buildPath.fsPath);
            query.outputPath = vscode.Uri.parse(
              path.join(buildFolder, query.name, "proven.json"),
            );

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
            prompt:
              "Enter the the target contract address with the callback function to be invoked by Axiom",
            placeHolder: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            value: query.callbackAddress,
            validateInput: (input) => {
              if (!ethers.isAddress(input)) {
                return "Not a valid Ethereum address string";
              }
            },
            ignoreFocusOut: true,
          });
          if (updatedCallback !== undefined) {
            query.callbackAddress = ethers.getAddress(
              updatedCallback,
            ) as `0x${string}`;
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
            prompt: "Enter the address to refund excess payment to",
            placeHolder: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            validateInput: (input) => {
              if (!ethers.isAddress(input)) {
                return "Not a valid Ethereum address string";
              }
            },
            ignoreFocusOut: true,
          });
          if (updatedRefund !== undefined) {
            query.refundAddress = ethers.getAddress(
              updatedRefund,
            ) as `0x${string}`;
            await stateStore.updateState(query.circuit);
            circuitsTree.refresh();
          }
        },
      ),
    );
  }
  dispose() {}
}

export class UpdateQueryCallbackExtraData implements vscode.Disposable {
  constructor(
    context: vscode.ExtensionContext,
    circuitsTree: CircuitsTree,
    stateStore: StateStore,
  ) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_UPDATE_QUERY_CALLBACK_EXTRA_DATA,
        async ({ query }: { query: Query }) => {
          console.log("Update Query Callback Extra Data", query);
          const updatedCallbackExtraData = await vscode.window.showInputBox({
            prompt: "Enter the callback extra data",
            placeHolder: "0x",
            value: query.callbackExtraData,
            validateInput: (input) => {
              if (!ethers.isHexString(input)) {
                return "Not a valid hex string";
              }
            },
            ignoreFocusOut: true,
          });
          if (updatedCallbackExtraData !== undefined) {
            query.callbackExtraData = updatedCallbackExtraData as `0x${string}`;
            await stateStore.updateState(query.circuit);
            circuitsTree.refresh();
          }
        },
      ),
    );
  }
  dispose() {}
}
