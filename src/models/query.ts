import * as vscode from 'vscode';
import * as path from 'path';
import type { buildSendQuery } from '@axiom-crypto/client';
import type { Circuit } from "./circuit";

export class Query {
    circuit: Circuit;
    inputPath: vscode.Uri;
    outputPath: vscode.Uri;

    callbackAddress: `0x${string}`;
    callbackExtraData?: `0x${string}`;

    refundAddress: `0x${string}`;

    sendQueryArgs?: Awaited<ReturnType<typeof buildSendQuery>>;
    txId?: string;

    constructor(args: {
        circuit: Circuit, 
        inputPath: vscode.Uri, 
        outputPath: vscode.Uri, 
        callbackAddress: `0x${string}`
        refundAddress: `0x${string}`
    }) {
        this.circuit = args.circuit;
        this.inputPath = args.inputPath;
        this.outputPath = args.outputPath;
        this.callbackAddress = args.callbackAddress;
        this.refundAddress = args.refundAddress;
    }

    get name(): string {
        return path.basename(this.inputPath.fsPath, path.extname(this.inputPath.fsPath));
    }
}
