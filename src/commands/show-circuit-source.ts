import * as vscode from 'vscode';
import { Circuit } from '../models/circuit';

export const COMMAND_ID_SHOW_CIRCUIT_SOURCE = 'axiom-crypto.show-circuit-source';

export class ShowCircuitSource implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_SHOW_CIRCUIT_SOURCE, async (circuit: Circuit) => {
                console.log('Show circuit source', circuit);
                vscode.window.showInformationMessage('Show source!');

                const document = await vscode.workspace.openTextDocument(circuit.source.filePath);
                const range = new vscode.Range(21, 0, 55, 0);
                const editor = await vscode.window.showTextDocument(document);
                editor.revealRange(range, vscode.TextEditorRevealType.Default);
            }),
        );
    }
    dispose() {}
}
