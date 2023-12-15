import * as vscode from 'vscode';
import { Compile } from './compile';
import { ShowCircuitSource } from './show-circuit-source';
import { CompileAll } from './compile-all';
import { Run } from './run';
import { SendQuery } from './send-query';
import { ConfigurePrivateKey, ConfigureProvider, ConfigureOutputFolder } from './configure';

export * from './compile';
export * from './compile-all';
export * from './run';
export * from './send-query';
export * from './show-circuit-source';

export function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(new Compile(context));
	context.subscriptions.push(new CompileAll(context));
	context.subscriptions.push(new Run(context));
	context.subscriptions.push(new SendQuery(context));
	context.subscriptions.push(new ShowCircuitSource(context));
	context.subscriptions.push(new ConfigureProvider(context));
	context.subscriptions.push(new ConfigurePrivateKey(context));
	context.subscriptions.push(new ConfigureOutputFolder(context));
}
