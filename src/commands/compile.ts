import * as vscode from 'vscode';
import { Circuit } from '../models/circuit';

export const COMMAND_ID_COMPILE = 'axiom-crypto.compile';

export class Compile implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_COMPILE, async (circuit: Circuit) => {
                console.log('Compile', circuit);
                vscode.window.showInformationMessage('Compile');

                const terminal = vscode.window.createTerminal({
                    name: "Axiom",
                });
                terminal.sendText(`npx axiom compile ${circuit.source.filePath.fsPath} --function ${circuit.source.functionName}`);
            }),
        );
    }
    dispose() {}
}