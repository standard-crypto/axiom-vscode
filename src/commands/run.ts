import * as vscode from "vscode";
import { prove } from "@axiom-crypto/circuit/cliHandler";
import type { Query } from "../models/query";
import {
  getConfigValueOrShowError,
  assertQueryIsValid,
  updateQueryOutput,
} from "../utils";
import { CONFIG_KEYS } from "../config";

export const COMMAND_ID_RUN = "axiom-crypto.run";

export interface RunArgs {
  inputFilePath?: vscode.Uri;
  rpcProvider?: string;
}

export class Run implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_RUN,
        async ({ query }: { query: Query }) => {
          console.log("Run", query);

          updateQueryOutput(query);

          // make sure the Circuit has compiled and the Query has all its values set
          if (!assertQueryIsValid(query)) {
            return;
          }

          // make sure provider is set
          const provider = await getConfigValueOrShowError(
            CONFIG_KEYS.ProviderUriSepolia,
          );
          if (provider === undefined) {
            return;
          }

          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Axiom",
              cancellable: false,
            },
            async (progress) => {
              // run the query
              progress.report({ increment: 0, message: "Running query..." });
              await prove(query.circuit.source.filePath.fsPath, {
                stats: false,
                function: query.circuit.source.functionName,
                compiled: query.circuit.buildPath.fsPath,
                outputs: query.outputPath.fsPath,
                inputs: query.inputPath.fsPath,
                provider: provider,
              });

              // done
              progress.report({
                increment: 100,
                message: `Success`,
              });
            },
          );

          vscode.window
            .showInformationMessage(
              `Run result saved to ${vscode.workspace.asRelativePath(
                query.outputPath,
              )}`,
              "Go to result",
            )
            .then(async (choice) => {
              if (choice === "Go to result") {
                const document = await vscode.workspace.openTextDocument(
                  query.outputPath,
                );
                await vscode.window.showTextDocument(document);
              }
            });
        },
      ),
    );
  }
  dispose() {}
}
