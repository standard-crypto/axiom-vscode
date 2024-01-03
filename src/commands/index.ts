import * as vscode from 'vscode';
import { Compile } from './compile';
import { ShowCircuitSource } from './show-circuit-source';
import { CompileAll } from './compile-all';
import { Run } from './run';
import { SendQuery } from './send-query';
import { AddQuery } from './add-query';
import { ConfigureParameters, RefreshConfig } from './configure';

export * from './compile';
export * from './compile-all';
export * from './run';
export * from './send-query';
export * from './add-query';
export * from './show-circuit-source';

export function registerCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(new Compile(context));
	context.subscriptions.push(new CompileAll(context));
	context.subscriptions.push(new Run(context));
	context.subscriptions.push(new SendQuery(context));
	context.subscriptions.push(new AddQuery(context));
	context.subscriptions.push(new ShowCircuitSource(context));
	context.subscriptions.push(new ConfigureParameters(context));
	context.subscriptions.push(new RefreshConfig(context));
}
