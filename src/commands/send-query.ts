import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { buildSendQuery } from '@axiom-crypto/client';
import { Axiom } from "@axiom-crypto/core";
import type { Query } from '../models/query';
import { JsonRpcProvider, Transaction } from 'ethers';

export const COMMAND_ID_SEND_QUERY = 'axiom-crypto.send-query';

function readJsonFromFile(relativePath: string) {
    return JSON.parse(fs.readFileSync(path.resolve(relativePath), 'utf8'));
}

export class SendQuery implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_SEND_QUERY, async (query: Query) => {
                console.log('Send Query', query);
                vscode.window.showInformationMessage('Send Query');

                // make sure provider is set
                const provider:string = vscode.workspace.getConfiguration().get('axiomProviderUri') ?? '';
                if (provider.length === 0){
                    vscode.window.showErrorMessage('You must set a provider URI before compiling');
                    return;
                }

                const chainId = 5; // TODO: receive from config

                const axiom = new Axiom({
                    providerUri: provider,
                    chainId, 
                    version: "v2", // TODO: receive from config
                });

                // TODO: should run if output file does not exist
                const outputJson = readJsonFromFile(query.outputPath.fsPath);

                const sendQuery = await buildSendQuery({
                    axiom,
                    dataQuery: outputJson.dataQuery,
                    computeQuery: outputJson.computeQuery,
                    callback: {
                      target: query.callbackAddress,
                      extraData: query.callbackExtraData ?? "0x",
                    },
                    options: {
                      refundee: query.refundAddress,
                    //   maxFeePerGas: options.maxFeePerGas,
                    //   callbackGasLimit: options.callbackGasLimit,
                    },
                    caller: query.refundAddress,
                });

                const rpcProvider = new JsonRpcProvider(provider, chainId);
                const tx = new Transaction();
                tx.chainId = chainId;
                tx.to = sendQuery.address;
                tx.data = sendQuery.calldata;
                tx.value = sendQuery.value;
                

            }),
        );
    }
    dispose() {}
}