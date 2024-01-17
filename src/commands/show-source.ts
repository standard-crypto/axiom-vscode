import * as vscode from "vscode";

export const COMMAND_ID_SHOW_SOURCE = "axiom-crypto.show-source";

export class ShowSource implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_SHOW_SOURCE,
        async ({ path }: { path: vscode.Uri | undefined }) => {
          console.log("Show source", path);
          if (path) {
            const document = await vscode.workspace.openTextDocument(path);
            const editor = await vscode.window.showTextDocument(document);
          }
        },
      ),
    );
  }
  dispose() {}
}
