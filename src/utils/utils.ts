import * as path from "path";
import * as fs from "fs";
import { Query } from "../models/query";
import * as vscode from "vscode";

export function readJsonFromFile(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(relativePath), "utf8"));
}

export function abbreviateAddr(address: string): string {
  return address.slice(0, 6) + "..." + address.slice(38);
}

export function updateQueryOutput(query: Query, isSendQuery: boolean = false) {
  const buildFolder = path.dirname(query.circuit.buildPath.fsPath);
  const outputPath = vscode.Uri.parse(
    path.join(
      buildFolder,
      query.name,
      isSendQuery ? "sendQuery.json" : "proven.json",
    ),
  );
  query.outputPath = outputPath;
}
