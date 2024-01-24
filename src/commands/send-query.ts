import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { buildSendQuery } from "@axiom-crypto/client";
import { Axiom } from "@axiom-crypto/core";
import { run } from "@axiom-crypto/circuit";
import type { Query } from "../models/query";
import { JsonRpcProvider, Transaction, Wallet, ethers } from "ethers";
import {
  assertCircuitCanBeCompiled,
  assertQueryIsValid,
  getConfigValueOrShowError,
  getQueryIdOrShowError,
} from "../utils/validation";
import { CONFIG_KEYS, axiomExplorerUrl } from "../config";

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

          const chainId = 5; // TODO: replace with sepolia 11155111

          const axiom = new Axiom({
            providerUri: provider,
            chainId,
            version: "v2", // TODO: receive from config
          });

          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Axiom",
              cancellable: false,
            },
            async (progress) => {
              // run the query
              progress.report({ increment: 0, message: "Running query..." });
              await run(query.circuit.source.filePath.fsPath, {
                stats: false,
                function: query.circuit.source.functionName,
                build: query.circuit.buildPath.fsPath,
                output: query.outputPath.fsPath,
                inputs: query.inputPath.fsPath,
                provider: provider,
              });

              // submit the query
              progress.report({
                increment: 33,
                message: "Building and signing Ethereum transaction...",
              });
              const outputJson = readJsonFromFile(query.outputPath.fsPath);

              const rpcProvider = new JsonRpcProvider(provider, chainId);
              const signer = new Wallet(privateKey, rpcProvider);
              const sender = await signer.getAddress();

              const sendQuery = await buildSendQuery({
                axiom,
                dataQuery: outputJson.dataQuery,
                computeQuery: outputJson.computeQuery,
                callback: {
                  target: query.callbackAddress,
                  extraData: query.callbackExtraData ?? "0x",
                },
                options: {
                  refundee: query.refundAddress ?? sender,
                  //   maxFeePerGas: options.maxFeePerGas,
                  //   callbackGasLimit: options.callbackGasLimit,
                },
                caller: sender,
              });

              const tx = new Transaction();
              tx.chainId = chainId;
              tx.to = sendQuery.address;
              tx.data = sendQuery.calldata;
              tx.value = sendQuery.value;
              tx.nonce = await signer.getNonce();
              tx.gasLimit = await signer.estimateGas(tx);
              const populatedTx = await signer.populateTransaction(tx);

              const maxFeePerGas =
                (populatedTx.maxFeePerGas as bigint) +
                (populatedTx.maxPriorityFeePerGas as bigint);
              const maxFee = (populatedTx.gasLimit as bigint) * maxFeePerGas;

              // prompt user to confirm transaction value before sending
              const choice = await vscode.window.showInformationMessage(
                "Broadcast This Transaction?",
                {
                  modal: true,
                  detail: [
                    `Network: ${rpcProvider._network.name}`,
                    "",
                    `Callback Address: ${abbreviateAddr(
                      query.callbackAddress,
                    )}`,
                    `Refund Address: ${abbreviateAddr(
                      query.refundAddress ?? sender,
                    )}`,
                    "",
                    `Tx From: ${abbreviateAddr(populatedTx.from!)}`,
                    `Tx Value: ${ethers.formatEther(populatedTx.value!)} ETH`,
                    `Max Fee: ${ethers.formatEther(maxFee)} ETH`,
                    `Total Cost Max: ${ethers.formatEther(
                      maxFee + (populatedTx.value as bigint),
                    )} ETH`,
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
                  setTimeout(resolve, 5000);
                });
              }

              const transactionResponse =
                await signer.sendTransaction(populatedTx);

              // wait for tx confirmation
              progress.report({ increment: 33, message: "Broadcasting..." });
              const transactionReceipt = await transactionResponse.wait();

              if (transactionReceipt === null) {
                progress.report({
                  increment: 100,
                  message: `Error submitting transaction`,
                });
                vscode.window.showErrorMessage(
                  `Error broadcasting transaction`,
                );
                return;
              }

              // get query id
              const queryId = getQueryIdOrShowError(
                transactionReceipt,
                chainId,
              );

              if (queryId === undefined) {
                progress.report({
                  increment: 100,
                  message: `Error`,
                });
                return;
              }

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
                      vscode.Uri.parse(axiomExplorerUrl + queryId),
                    );
                  }
                });
            },
          );
        },
      ),
    );
  }
  dispose() {}
}
