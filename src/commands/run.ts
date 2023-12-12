import * as vscode from 'vscode';
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

                const terminal = vscode.window.createTerminal({
                    name: "Axiom",
                });
                
                let cmd = `npx axiom run ${circuit.source.filePath.fsPath} --function ${circuit.source.functionName}`;
                if (args?.inputFilePath !== undefined) {
                    cmd += ` --inputs ${args.inputFilePath.fsPath}`;
                }
                if (args?.rpcProvider !== undefined) {
                    cmd += ` --provider ${args.rpcProvider}`;
                }
                terminal.sendText(cmd);
            }),
        );
    }
    dispose() {}
}
