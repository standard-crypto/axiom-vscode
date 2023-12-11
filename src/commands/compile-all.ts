import * as vscode from 'vscode';

export const COMMAND_ID_COMPILE_ALL = 'axiom-crypto.compile-all';

export class CompileAll implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_COMPILE_ALL, async () => {
                console.log('Compile all');
                vscode.window.showInformationMessage('Compile All');
            }),
        );
    }
    dispose() {}
}