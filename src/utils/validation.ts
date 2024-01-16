import * as vscode from "vscode";
import type { SetRequired } from "type-fest";
import { Query } from "../models/query";
import { COMMAND_ID_UPDATE_QUERY_INPUT } from "../commands/update-query";

export async function getProviderOrShowError(): Promise<string | undefined> {
  const provider: string =
    vscode.workspace.getConfiguration().get("axiom.providerURI") ?? "";
  if (provider.length === 0) {
    const choice = await vscode.window.showErrorMessage(
      "You must set a provider URI before running a Query",
      "Open Axiom settings...",
    );
    if (choice === "Open Axiom settings...") {
      vscode.commands.executeCommand(
        "workbench.action.openWorkspaceSettings",
        "axiom",
      );
    }
    return;
  }
}

export type QueryWithAllValuesSet = SetRequired<
  Query,
  "inputPath" | "callbackAddress" | "refundAddress"
>;

export function assertQueryIsValid(
  query: Query,
): query is QueryWithAllValuesSet {
  if (query.inputPath === undefined) {
    vscode.window
      .showErrorMessage(
        "You must first set the input file for this query",
        "Set input file path...",
      )
      .then((choice) => {
        if (choice === "Set input file path...") {
          vscode.commands.executeCommand(COMMAND_ID_UPDATE_QUERY_INPUT, {
            query,
          });
        }
      });
    return false;
  }
  return true;
}
