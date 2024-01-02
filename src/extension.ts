// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CircuitsTree } from './views/circuits-tree';
import { registerCommands } from './commands';
import { StateStore } from './state';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const stateStore = new StateStore(context);
	await stateStore.loadFromExtensionSettings();

	const circuitsTree = new CircuitsTree(stateStore);

	registerCommands(context, circuitsTree);

	subscribeToConfigChanges(context, stateStore, circuitsTree);
}

function subscribeToConfigChanges(context: vscode.ExtensionContext, stateStore: StateStore,circuitsTree: CircuitsTree) {
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async (e) => {
		if (e.affectsConfiguration('axiom')) {
			await stateStore.loadFromExtensionSettings();
			circuitsTree.refresh();
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}
