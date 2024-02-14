import * as vscode from "vscode";
import type { Query } from "./query";

export class Circuit {
  public queries: Query[] = [];

  constructor(
    public source: CircuitSource,
    public buildPath: vscode.Uri,
  ) {}

  get name(): string {
    return this.source.functionName;
  }
}

export class CircuitSource {
  // could replace this with ts.FunctionDeclaration, which has all this info.
  // getLineAndCharacterOfPosition converts from absolute position
  // fileName may have the full path, not sure
  constructor(
    public filePath: vscode.Uri,
    public functionName: string,
  ) {}
}
