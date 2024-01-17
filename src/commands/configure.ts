import * as vscode from "vscode";

export const COMMAND_ID_CONFIGURE_PARAMS = "axiom-crypto.configure-parameters";

export class ConfigureParameters implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMAND_ID_CONFIGURE_PARAMS, async () => {
        vscode.commands.executeCommand(
          "workbench.action.openWorkspaceSettings",
          "axiom",
        );
      }),
    );
  }
  dispose() {}
}
