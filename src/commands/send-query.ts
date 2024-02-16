import * as vscode from "vscode";
import { buildSendQuery } from "@axiom-crypto/client";
import { AxiomSdkCore } from "@axiom-crypto/core";
import { prove } from "@axiom-crypto/circuit/cliHandler";
import type { Query } from "../models/query";
import { JsonRpcProvider, Transaction, Wallet, ethers } from "ethers";
import {
  assertCircuitCanBeCompiled,
  assertQueryIsValid,
  getConfigValueOrShowError,
} from "../utils/validation";
import { CONFIG_KEYS, axiomExplorerUrl } from "../config";
import { readJsonFromFile, abbreviateAddr, updateQueryOutput } from "../utils";
import { proveAndCheck } from "./prove";

export const COMMAND_ID_SEND_QUERY = "axiom-crypto.send-query";

export class SendQuery implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_SEND_QUERY,
        async ({ query }: { query: Query }) => {
          console.log("Send Query", query);

          updateQueryOutput(query, true);

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

          const chainId = 11155111; // sepolia

          const axiom = new AxiomSdkCore({
            providerUri: provider,
            chainId: chainId.toString(),
            version: "v2", // TODO: receive from config
          });

          let queryId: string | undefined;

          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Axiom",
              cancellable: false,
            },
            async (progress) => {
              // run the query
              progress.report({ increment: 0, message: "Proving circuit..." });
              if (!(await proveAndCheck(provider, query))) {
                return;
              }

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
                  caller: sender,
                  privateKey: privateKey,
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
                return;
              }

              const transactionResponse =
                await signer.sendTransaction(populatedTx);

              // wait for tx confirmation
              progress.report({ increment: 33, message: "Sending Query..." });
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

              // done
              progress.report({
                increment: 100,
                message: `Query sent successfully`,
              });
              queryId = sendQuery.queryId;
            },
          );
          if (queryId !== undefined) {
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Axiom",
                cancellable: false,
              },
              async (progress) => {
                // wait 10s to display explorer link
                for (let i = 0; i < 99; i++) {
                  await new Promise((resolve) => {
                    setTimeout(resolve, 100);
                    progress.report({
                      increment: 1,
                      message: "Fetching Explorer link...",
                    });
                  });
                }
                // done
                progress.report({
                  increment: 100,
                  message: `Explorer Link is ready`,
                });

                vscode.window
                  .showInformationMessage(
                    `Explorer Link is ready`,
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
          }
        },
      ),
    );
  }
  dispose() {}
}
