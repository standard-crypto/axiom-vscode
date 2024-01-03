import * as vscode from 'vscode';

export const COMMAND_ID_ADD_QUERY = 'axiom-crypto.add-query';

export class AddQuery implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_ADD_QUERY, async () => {
                console.log('add query');
                vscode.window.showInformationMessage('Add Query');
                // const inputFile = await vscode.window.showOpenDialog();
                // const webviewView = vscode.window.createWebviewPanel()
            }),
        );
    }
    dispose() {}
}