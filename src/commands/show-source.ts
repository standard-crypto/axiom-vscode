import * as vscode from "vscode";
import { Circuit } from "../models/circuit";
import { Query } from "../models/query";

export const COMMAND_ID_SHOW_DEFAULT_INPUT_SOURCE =
  "axiom-crypto.show-default-input-source";

  export const COMMAND_ID_SHOW_INPUT_SOURCE =
  "axiom-crypto.show-input-source";

  export const COMMAND_ID_SHOW_CIRCUIT_SOURCE =
  "axiom-crypto.show-circuit-source";

export class ShowCircuitSource implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_SHOW_CIRCUIT_SOURCE,
        async (circuit: Circuit) => {
          console.log("Show circuit source", circuit);

          const document = await vscode.workspace.openTextDocument(
            circuit.source.filePath,
          );
          const editor = await vscode.window.showTextDocument(document);

          // const range = new vscode.Range(21, 0, 55, 0);
          // editor.revealRange(range, vscode.TextEditorRevealType.Default);
        },
      ),
    );
  }
  dispose() {}
}

export class ShowDefaultInputSource implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_SHOW_DEFAULT_INPUT_SOURCE,
        async ({inputPath} :{inputPath: vscode.Uri | undefined}) => {
          console.log("Show input source", inputPath);
          if (inputPath) {
            const document = await vscode.workspace.openTextDocument(
              inputPath,
            );
            const editor = await vscode.window.showTextDocument(document);
          }
        },
      ),
    );
  }
  dispose() {}
}

export class ShowInputSource implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_SHOW_INPUT_SOURCE,
        async ({query} :{query: Query}) => {
          console.log("Show input source", query);
          if (query.inputPath) {
            const document = await vscode.workspace.openTextDocument(
              query.inputPath,
            );
            const editor = await vscode.window.showTextDocument(document);
          }
        },
      ),
    );
  }
  dispose() {}
}