import * as vscode from 'vscode';
import { Compile } from './compile';
import { ShowCircuitSource } from './show-circuit-source';

export * from './compile';
export * from './show-circuit-source';

export function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(new Compile(context));
	context.subscriptions.push(new ShowCircuitSource(context));
}
