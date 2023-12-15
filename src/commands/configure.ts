import * as vscode from 'vscode';

export const COMMAND_ID_CONFIGURE_PROVIDER = 'axiom-crypto.set-provider-uri';
export const COMMAND_ID_CONFIGURE_KEY = 'axiom-crypto.set-private-key';
export const COMMAND_ID_CONFIGURE_OUTPUT = 'axiom-crypto.set-output-folder';


export class ConfigureProvider implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_CONFIGURE_PROVIDER, async () => {
                const value = await vscode.window.showInputBox({title: 'Axiom Provider URI', prompt: 'Enter your Axiom Provider URI'});
                await vscode.workspace.getConfiguration().update('axiomProviderUri', value, vscode.ConfigurationTarget.Global);
            }),
        );
    }
    dispose() {}
}

export class ConfigurePrivateKey implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_CONFIGURE_KEY, async () => {
                const value = await vscode.window.showInputBox({title: 'Private Key', prompt: 'Enter your private key'});
                await vscode.workspace.getConfiguration().update('axiomPrivateKey', value, vscode.ConfigurationTarget.Global);
            }),
        );
    }
    dispose() {}
}

export class ConfigureOutputFolder implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_CONFIGURE_OUTPUT, async () => {
                const value = await vscode.window.showInputBox({title: 'Output Folder', prompt: 'Enter the output folder'});
                await vscode.workspace.getConfiguration().update('axiomOutputFolder', value, vscode.ConfigurationTarget.Workspace);
            }),
        );
    }
    dispose() {}
}