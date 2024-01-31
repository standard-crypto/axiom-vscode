import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { Axiom } from "@axiom-crypto/client";
import type { Query } from "../models/query";
import {
  assertCircuitCanBeCompiled,
  assertQueryIsValid,
  getConfigValueOrShowError,
} from "../utils/validation";
import { CONFIG_KEYS, axiomExplorerUrl } from "../config";
import { getFunctionFromTs } from "../utils";

export const COMMAND_ID_SEND_QUERY = "axiom-crypto.send-query";

function readJsonFromFile(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(relativePath), "utf8"));
}

function abbreviateAddr(address: string): string {
  return address.slice(0, 6) + "..." + address.slice(38);
}

export class SendQuery implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_SEND_QUERY,
        async ({ query }: { query: Query }) => {
          console.log("Send Query", query);

          // make sure the Circuit can compile
          if (!assertCircuitCanBeCompiled(query.circuit)) {
            return;
          }

          // make sure the Query has all its values set
          if (!assertQueryIsValid(query, false)) {
            return;
          }

          // make sure provider is set
          const provider = await getConfigValueOrShowError(
            CONFIG_KEYS.ProviderUriSepolia,
          );
          if (provider === undefined) {
            return;
          }

          // make sure private key is set
          const privateKey = await getConfigValueOrShowError(
            CONFIG_KEYS.PrivateKeySepolia,
          );
          if (privateKey === undefined) {
            return;
          }

          const chainId = "11155111"; // sepolia

          // import circuit from circuitFile
          const circuit = await getFunctionFromTs(
            query.circuit.source.filePath.fsPath,
            query.circuit.source.functionName,
          );

          // import compiled circuit
          const compiledCircuit = readJsonFromFile(
            query.circuit.buildPath.fsPath,
          );

          // import inputs
          const inputs = readJsonFromFile(query.inputPath.fsPath);

          // import input schema
          if (!query.circuit.inputSchema) {
            return;
          }
          const inputSchema = readJsonFromFile(
            query.circuit.inputSchema.fsPath,
          );

          const axiom = new Axiom({
            circuit: circuit,
            compiledCircuit: compiledCircuit,
            inputSchema: inputSchema,
            chainId: chainId,
            provider: provider,
            privateKey: privateKey,
            version: "v2", // TODO: receive from config
            callback: { target: query.callbackAddress },
          });
          await axiom.init();

          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Axiom",
              cancellable: false,
            },
            async (progress) => {
              // run the query
              progress.report({ increment: 0, message: "Running query..." });
              const args = await axiom.prove(inputs);

              progress.report({
                increment: 33,
                message: "Generating query args...",
              });

              // prompt user to confirm transaction value before sending
              const choice = await vscode.window.showInformationMessage(
                "Broadcast This Transaction?",
                {
                  modal: true,
                  detail: [
                    `Network: Sepolia`,
                    "",
                    `Address: ${abbreviateAddr(args.address)}`,
                    `Callback Address: ${abbreviateAddr(
                      query.callbackAddress,
                    )}`,
                    "",
                  ].join("\n"),
                },
                "Confirm",
              );
              if (choice !== "Confirm") {
                progress.report({
                  increment: 100,
                  message: "Cancelled",
                });
                await new Promise((resolve) => {
                  setTimeout(resolve, 2000);
                });
                return;
              }

              // submit the query
              progress.report({
                increment: 33,
                message: "Sending query...",
              });

              const receipt = await axiom.sendQuery(args);

              if (receipt.status === "success") {
                // done
                progress.report({
                  increment: 100,
                  message: `Success`,
                });

                vscode.window
                  .showInformationMessage(
                    `Query submitted successfully`,
                    "View Transaction on Axiom Explorer",
                  )
                  .then(async (choice) => {
                    if (choice === "View Transaction on Axiom Explorer") {
                      vscode.env.openExternal(
                        vscode.Uri.parse(axiomExplorerUrl + args.queryId),
                      );
                    }
                  });
              } else {
                progress.report({
                  increment: 100,
                  message: `Reverted`,
                });

                vscode.window
                  .showErrorMessage(
                    `Query transaction reverted`,
                    "View Transaction on Axiom Explorer",
                  )
                  .then(async (choice) => {
                    if (choice === "View Transaction on Axiom Explorer") {
                      vscode.env.openExternal(
                        vscode.Uri.parse(axiomExplorerUrl + args.queryId),
                      );
                    }
                  });
              }
            },
          );
        },
      ),
    );
  }
  dispose() {}
}
