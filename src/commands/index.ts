import * as vscode from 'vscode';
import { Compile } from './compile';
import { ShowCircuitSource } from './show-circuit-source';
import { CompileAll } from './compile-all';
import { Run } from './run';

export * from './compile';
export * from './show-circuit-source';

export function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(new Compile(context));
	context.subscriptions.push(new CompileAll(context));
	context.subscriptions.push(new Run(context));
	context.subscriptions.push(new ShowCircuitSource(context));
}
