import * as vscode from 'vscode';
import type { buildSendQuery } from '@axiom-crypto/client';
import type { Circuit } from "./circuit";

export class Query {
    circuit: Circuit;
    name: string;
    inputPath: vscode.Uri;
    outputPath: vscode.Uri;

    callbackAddress: `0x${string}`;
    callbackExtraData?: `0x${string}`;

    refundAddress: `0x${string}`;

    sendQueryArgs?: Awaited<ReturnType<typeof buildSendQuery>>;
    txId?: string;

    constructor(args: {
        circuit: Circuit, 
        name: string,
        inputPath: vscode.Uri, 
        outputPath: vscode.Uri, 
        callbackAddress: `0x${string}`
        refundAddress: `0x${string}`
    }) {
        this.circuit = args.circuit;
        this.name = args.name;
        this.inputPath = args.inputPath;
        this.outputPath = args.outputPath;
        this.callbackAddress = args.callbackAddress;
        this.refundAddress = args.refundAddress;
    }
}
