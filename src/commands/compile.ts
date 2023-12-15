import * as vscode from 'vscode';
import { compile } from '@axiom-crypto/circuit';
import { Circuit } from '../models/circuit';
import * as fs from 'fs';
import { setBuildPathForCircuit } from '../utils';

export const COMMAND_ID_COMPILE = 'axiom-crypto.compile';

export class Compile implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_COMPILE, async (circuit: Circuit) => {
                console.log('Compile', circuit);

                // make sure provider is set
                const provider:string = vscode.workspace.getConfiguration().get('axiomProviderUri') ?? '';
                if (provider.length === 0){
                    vscode.window.showErrorMessage('You must set a provider URI before compiling');
                    return;
                }

                vscode.window.showInformationMessage('Compile');

                setBuildPathForCircuit(circuit);

                await compile(circuit.source.filePath.fsPath, {
                    stats: false,
                    function: circuit.source.functionName,
                    inputs: circuit.defaultInputs.fsPath,
                    output: circuit.buildPath.fsPath,
                    provider: provider,
                });
            }),
        );
    }
    dispose() {}
}