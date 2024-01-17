import * as vscode from "vscode";
import type { SetRequired } from "type-fest";
import { Query } from "../models/query";
import {
  COMMAND_ID_UPDATE_QUERY_CALLBACK,
  COMMAND_ID_UPDATE_QUERY_INPUT,
  COMMAND_ID_UPDATE_QUERY_REFUND,
} from "../commands/update-query";
import { Circuit } from "../models/circuit";
import { CONFIG_KEYS, CircuitInputsProvidedOpts } from "../config";

export async function getProviderOrShowError(): Promise<string | undefined> {
  const provider: string = vscode.workspace
    .getConfiguration()
    .get(`axiom.${CONFIG_KEYS.ProviderURI}`, "");
  if (provider.length === 0) {
    const choice = await vscode.window.showErrorMessage(
      "You must set a provider URI before running a Query",
      "Open Axiom settings",
    );
    if (choice === "Open Axiom settings") {
      vscode.commands.executeCommand(
        "workbench.action.openWorkspaceSettings",
        "axiom",
      );
    }
    return;
  }
  return provider;
}

export async function getPrivateKeyOrShowError(): Promise<string | undefined> {
  // TODO: https://github.com/standard-crypto/axiom-vscode/issues/27
  const privateKey: string = vscode.workspace
    .getConfiguration()
    .get(`axiom.${CONFIG_KEYS.PrivateKey}`, "");
  if (privateKey.length === 0) {
    const choice = await vscode.window.showErrorMessage(
      "You must provide a private key to use when submitting a Query",
      "Open Axiom settings",
    );
    if (choice === "Open Axiom settings") {
      vscode.commands.executeCommand(
        "workbench.action.openWorkspaceSettings",
        "axiom",
      );
    }
    return;
  }
  return privateKey;
}

export type QueryWithAllValuesSet = SetRequired<
  Query,
  "inputPath" | "callbackAddress" | "refundAddress"
>;

export function assertQueryIsValid(
  query: Query,
  allowUnsetCallbackAndRefundAddrs = true,
): query is QueryWithAllValuesSet {
  // validate query input path
  if (query.inputPath === undefined) {
    vscode.window
      .showErrorMessage(
        "You must first set the input file for this query",
        "Set input file path",
      )
      .then((choice) => {
        if (choice === "Set input file path") {
          vscode.commands.executeCommand(COMMAND_ID_UPDATE_QUERY_INPUT, {
            query,
          });
        }
      });
    return false;
  }

  // validate callback address
  if (
    query.callbackAddress === undefined &&
    !allowUnsetCallbackAndRefundAddrs
  ) {
    vscode.window
      .showErrorMessage(
        "You must set the callback address for this query",
        "Set callback address",
      )
      .then((choice) => {
        if (choice === "Set callback address") {
          vscode.commands.executeCommand(COMMAND_ID_UPDATE_QUERY_CALLBACK, {
            query,
          });
        }
      });
    return false;
  }

  // validate refund address
  if (query.refundAddress === undefined && !allowUnsetCallbackAndRefundAddrs) {
    vscode.window
      .showErrorMessage(
        "You must set the refund address for this query",
        "Set refund address",
      )
      .then((choice) => {
        if (choice === "Set refund address") {
          vscode.commands.executeCommand(COMMAND_ID_UPDATE_QUERY_REFUND, {
            query,
          });
        }
      });
    return false;
  }

  return true;
}

export function assertCircuitCanBeCompiled(circuit: Circuit): boolean {
  const config = vscode.workspace.getConfiguration("axiom");
  const circuitInputsProvided = config.get<CircuitInputsProvidedOpts>(
    CONFIG_KEYS.CircuitInputsProvided,
    "As separate input files",
  );

  if (
    circuitInputsProvided === "As separate input files" &&
    circuit.defaultInputs === undefined
  ) {
    vscode.window
      .showErrorMessage(
        "No default inputs found for this circuit",
        "Set default inputs",
        "Open Axiom settings",
      )
      .then((choice) => {
        if (choice === "Open Axiom settings") {
          vscode.commands.executeCommand(
            "workbench.action.openWorkspaceSettings",
            "axiom",
          );
        } else if (choice === "Set default inputs") {
          // TODO: invoke the command to open the file picker dialog
        }
      });
    return false;
  }
  return true;
}
