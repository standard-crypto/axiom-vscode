import * as vscode from 'vscode';
import { compile } from '@axiom-crypto/circuit';
import { Circuit } from '../models/circuit';

export const COMMAND_ID_COMPILE = 'axiom-crypto.compile';

export class Compile implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_COMPILE, async (circuit: Circuit) => {
                console.log('Compile', circuit);

                // make sure provider is set
                const provider:string = vscode.workspace.getConfiguration().get('axiom.providerURI') ?? '';
                if (provider.length === 0){
                    vscode.window.showErrorMessage('You must set a provider URI before compiling');
                    return;
                }

                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Axiom",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0, message: "Compiling circuit..." });       
        
                    await compile(circuit.source.filePath.fsPath, {
                        stats: false,
                        function: circuit.source.functionName,
                        inputs: circuit.defaultInputs.fsPath,
                        output: circuit.buildPath.fsPath,
                        provider: provider,
                    });

                    progress.report({increment: 100, message: `Saved to ${vscode.workspace.asRelativePath(circuit.buildPath)}`});
                    await new Promise((resolve) => {
                        setTimeout(resolve, 5000);
                    });
                });                
            }),
        );
    }
    dispose() {}
}