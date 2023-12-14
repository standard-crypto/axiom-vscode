import * as vscode from 'vscode';
import { compile } from '@axiom-crypto/circuit';
import { Circuit } from '../models/circuit';

export const COMMAND_ID_COMPILE = 'axiom-crypto.compile';

export class Compile implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_COMPILE, async (circuit: Circuit) => {
                console.log('Compile', circuit);
                vscode.window.showInformationMessage('Compile');

                await compile(circuit.source.filePath.fsPath, {
                    stats: false,
                    function: circuit.source.functionName,
                    inputs: circuit.defaultInputs.fsPath,
                    output: circuit.buildPath.fsPath,
                });
            }),
        );
    }
    dispose() {}
}