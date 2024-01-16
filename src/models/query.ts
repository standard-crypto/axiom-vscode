import * as vscode from "vscode";
import type { Circuit } from "./circuit";

export class Query {
  name: string;
  circuit: Circuit;
  inputPath?: vscode.Uri;
  outputPath: vscode.Uri;

  callbackAddress?: `0x${string}`;
  callbackExtraData?: `0x${string}`;

  refundAddress?: `0x${string}`;

  // sendQueryArgs?: Awaited<ReturnType<typeof buildSendQuery>>;
  txId?: string;

  constructor(args: {
    name: string;
    circuit: Circuit;
    inputPath?: vscode.Uri;
    outputPath: vscode.Uri;
    callbackAddress?: `0x${string}`;
    refundAddress?: `0x${string}`;
  }) {
    this.name = args.name;
    this.circuit = args.circuit;
    this.inputPath = args.inputPath;
    this.outputPath = args.outputPath;
    this.callbackAddress = args.callbackAddress;
    this.refundAddress = args.refundAddress;
  }
}
