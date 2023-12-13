import * as vscode from 'vscode';
import { run } from '@axiom-crypto/circuit';
import { Circuit } from '../models/circuit';

export const COMMAND_ID_RUN = 'axiom-crypto.run';

export interface RunArgs {
    inputFilePath?: vscode.Uri,
    rpcProvider?: string,
}

export class Run implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_RUN, async (circuit: Circuit, args?: RunArgs) => {
                console.log('Run', circuit);
                vscode.window.showInformationMessage('Run');

                await run(circuit.source.filePath.fsPath, {
                    stats: false,
                    function: circuit.source.functionName,
                    build: circuit.buildPath.fsPath,
                    output: circuit.outputPath.fsPath,
                    inputs: args?.inputFilePath?.fsPath,
                    provider: args?.rpcProvider,
                });
            }),
        );
    }
    dispose() {}
}
