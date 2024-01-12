import * as vscode from "vscode";
import { CircuitsTree } from "./views/circuits-tree";
import { registerCommands } from "./commands";
import { StateStore } from "./state";
import { registerCustomListeners } from "./listeners";

export async function activate(context: vscode.ExtensionContext) {
  // create and populate local state store
  const stateStore = new StateStore(context);
  await stateStore.loadFromExtensionSettings();

  // create the tree view
  const circuitsTree = new CircuitsTree(stateStore);

  registerCommands(context, circuitsTree, stateStore);

  registerCustomListeners(context, stateStore, circuitsTree);
}

// This method is called when your extension is deactivated
export function deactivate() {}
