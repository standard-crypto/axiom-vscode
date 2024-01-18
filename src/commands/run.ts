import * as vscode from "vscode";
import { run } from "@axiom-crypto/circuit";
import type { Query } from "../models/query";
import {
  getProviderOrShowError,
  assertQueryIsValid,
  assertCircuitCanBeCompiled,
} from "../utils/validation";
import { rawCompile } from "./compile";

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

          // make sure the Circuit can compile
          if (!assertCircuitCanBeCompiled(query.circuit)) {
            return;
          }

          // make sure the Query has all its values set
          if (!assertQueryIsValid(query)) {
            return;
          }

          // make sure provider is set
          const provider = await getProviderOrShowError();
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
              // compile the circuit
              progress.report({
                increment: 0,
                message: "Compiling circuit...",
              });
              await rawCompile(provider, query.circuit);

              // run the query
              progress.report({ increment: 50, message: "Running query..." });
              await run(query.circuit.source.filePath.fsPath, {
                stats: false,
                function: query.circuit.source.functionName,
                build: query.circuit.buildPath.fsPath,
                output: query.outputPath.fsPath,
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
