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
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from 'fs';
import { COMMAND_ID_UPDATE_CIRCUIT_DEFAULT_INPUT } from "../commands";

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
  const config = vscode.workspace.getConfiguration("axiom");
  const privateKeyPath: string | undefined = config.get(CONFIG_KEYS.PrivateKeyPath);

  if (vscode.workspace.workspaceFolders === undefined) {
    throw new Error("Expected at least one open VSCode workspace");
  }

  const privateKeyFile = path.join(
    vscode.workspace.workspaceFolders[0].uri.path,
    privateKeyPath ?? ".env",
  );

  if (!fs.existsSync(privateKeyFile)) {
    vscode.window.showErrorMessage(
      `File ${privateKeyPath} not found in current workspace. Did you forget to create it?`,
      "Open Axiom settings",
    ).then(async (choice) => {
      if (choice === "Open Axiom settings") {
        vscode.commands.executeCommand(
          "workbench.action.openWorkspaceSettings",
          "axiom",
        );
      }
    });
    return undefined;
  }

  const privateKeyFileContent = fs.readFileSync(privateKeyFile, 'utf-8');
  const privateKeyFileParsed = dotenv.parse(privateKeyFileContent);
  const key = 'PRIVATE_KEY_GOERLI';
  const privateKey = privateKeyFileParsed[key];

  if (privateKey === undefined || privateKey === '') {
    vscode.window.showErrorMessage(
      `No value found for key ${key} in ${privateKeyPath}`,
      "Open Axiom settings",
      `Open ${privateKeyPath}`
    ).then(async (choice) => {
      if (choice === "Open Axiom settings") {
        vscode.commands.executeCommand(
          "workbench.action.openWorkspaceSettings",
          "axiom",
        );
      } else if (choice === `Open ${privateKeyPath}`) {
        const document = await vscode.workspace.openTextDocument(
          privateKeyFile,
        );
        await vscode.window.showTextDocument(document);
      }
    });
    return undefined;
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
          vscode.commands.executeCommand(COMMAND_ID_UPDATE_CIRCUIT_DEFAULT_INPUT, {
            circuit,
          });        
        }
      });
    return false;
  }
  return true;
}
