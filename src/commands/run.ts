import * as vscode from 'vscode';
import { run } from '@axiom-crypto/circuit';
import type { Query } from '../models/query';

export const COMMAND_ID_RUN = 'axiom-crypto.run';

export interface RunArgs {
    inputFilePath?: vscode.Uri,
    rpcProvider?: string,
}

export class Run implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_RUN, async (query: Query) => {
                console.log('Run', query);

                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Axiom",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0, message: "Running query..." });        
        
                    await run(query.circuit.source.filePath.fsPath, {
                        stats: false,
                        function: query.circuit.source.functionName,
                        build: query.circuit.buildPath.fsPath,
                        output: query.outputPath.fsPath,
                        inputs: query.inputPath.fsPath,
                        // provider: args?.rpcProvider,
                    });

                    progress.report({increment: 100, message: `Output written to ${vscode.workspace.asRelativePath(query.outputPath)}`});
                    await new Promise((resolve) => {
                        setTimeout(resolve, 5000);
                    });
                });


            }),
        );
    }
    dispose() {}
}
