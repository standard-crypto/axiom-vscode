import * as vscode from "vscode";
import { prove } from "@axiom-crypto/circuit/cliHandler";
import type { Query } from "../models/query";
import {
  getConfigValueOrShowError,
  assertQueryIsValid,
  updateQueryOutput,
  assertQueryWasProven,
} from "../utils";
import { CONFIG_KEYS } from "../config";

export const COMMAND_ID_PROVE = "axiom-crypto.prove";

export interface ProveArgs {
  inputFilePath?: vscode.Uri;
  rpcProvider?: string;
}

export class Prove implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_PROVE,
        async ({ query }: { query: Query }) => {
          console.log("Prove", query);

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
          let success = false;
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Axiom",
              cancellable: false,
            },
            async (progress) => {
              // prove
              progress.report({ increment: 0, message: "Proving..." });
              success = await proveAndCheck(provider, query);

              // done
              progress.report({
                increment: 100,
                message: success ? "Success" : "Failed",
              });
            },
          );

          if (!success) {
            return;
          }

          vscode.window
            .showInformationMessage(
              `Proof result saved to ${vscode.workspace.asRelativePath(
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

export async function proveAndCheck(
  provider: string,
  query: Query,
): Promise<boolean> {
  if (query.inputPath === undefined) {
    throw new Error("Query input is undefined");
  }
  await prove(query.circuit.buildPath.fsPath, query.inputPath.fsPath, {
    stats: false,
    outputs: query.outputPath.fsPath,
    provider: provider,
  });
  return assertQueryWasProven(query);
}
