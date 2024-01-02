import * as vscode from 'vscode';
import { CircuitsTree } from '../views/circuits-tree';

export const COMMAND_ID_CONFIGURE_PARAMS = 'axiom-crypto.configure-parameters';
export const COMMAND_ID_REFRESH_CONFIG = 'axiom-crypto.refresh-config';


export class ConfigureParameters implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_CONFIGURE_PARAMS, async () => {
                vscode.commands.executeCommand('workbench.action.openWorkspaceSettings', 'axiom');
            }),
        );
    }
    dispose() {}
}

export class RefreshConfig implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext, circuitsTree: CircuitsTree) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_REFRESH_CONFIG, async () => {
                circuitsTree.refresh();
            }),
        );
    }
    dispose() {}
}