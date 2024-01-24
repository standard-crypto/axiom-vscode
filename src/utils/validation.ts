import * as vscode from "vscode";
import type { SetRequired } from "type-fest";
import { Query } from "../models/query";
import {
  COMMAND_ID_UPDATE_QUERY_CALLBACK,
  COMMAND_ID_UPDATE_QUERY_INPUT,
} from "../commands/update-query";
import { Circuit } from "../models/circuit";
import { CONFIG_KEYS } from "../config";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import {
  COMMAND_ID_TRIGGER_COMPILE,
  COMMAND_ID_UPDATE_CIRCUIT_DEFAULT_INPUT,
} from "../commands";
import { TransactionReceipt, toBigInt } from "ethers";
import { createExplorerLink } from "@metamask/etherscan-link";

export async function getConfigValueOrShowError(
  keyName: string,
): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration("axiom");
  const configFilePath: string | undefined = config.get(
    CONFIG_KEYS.ConfigFilePath,
  );

  if (vscode.workspace.workspaceFolders === undefined) {
    throw new Error("Expected at least one open VSCode workspace");
  }

  const configFile = path.join(
    vscode.workspace.workspaceFolders[0].uri.path,
    configFilePath ?? ".env",
  );

  const configFileContent = fs.readFileSync(configFile, "utf-8");
  const configFileParsed = dotenv.parse(configFileContent);
  const value = configFileParsed[keyName];

  if (value === undefined || value === "") {
    vscode.window
      .showErrorMessage(
        `No value found for key ${keyName} in ${configFilePath}`,
        "Open Axiom settings",
        `Open ${configFilePath}`,
      )
      .then(async (choice) => {
        if (choice === "Open Axiom settings") {
          vscode.commands.executeCommand(
            "workbench.action.openWorkspaceSettings",
            "axiom",
          );
        } else if (choice === `Open ${configFilePath}`) {
          const document = await vscode.workspace.openTextDocument(configFile);
          await vscode.window.showTextDocument(document);
        }
      });
    return undefined;
  }

  return value;
}

export function getQueryIdOrShowError(
  transactionReceipt: TransactionReceipt,
  chainId: number,
): string | undefined {
  if (transactionReceipt?.logs && transactionReceipt.logs[1].topics[1]) {
    const queryIdHex = transactionReceipt.logs[1].topics[1];
    const queryId = toBigInt(queryIdHex);
    return queryId.toString();
  }
  vscode.window
    .showErrorMessage(
      `No queryId found for transaction ${transactionReceipt?.hash}`,
      "View Transaction on Etherscan",
    )
    .then(async (choice) => {
      if (choice === "View Transaction on Etherscan") {
        vscode.env.openExternal(
          vscode.Uri.parse(
            createExplorerLink(transactionReceipt.hash, `${chainId}`),
          ),
        );
      }
    });
  return undefined;
}

export type QueryWithRequiredValuesSet = SetRequired<
  Query,
  "inputPath" | "callbackAddress"
>;

export function assertQueryIsValid(
  query: Query,
  allowUnsetCallbackAddr = true,
): query is QueryWithRequiredValuesSet {
  // validate that circuit has been compiled
  if (!fs.existsSync(query.circuit.buildPath.fsPath)) {
    vscode.window
      .showErrorMessage(
        "You must compile the circuit before running a query",
        "Compile circuit",
      )
      .then((choice) => {
        if (choice === "Compile circuit") {
          vscode.commands.executeCommand(COMMAND_ID_TRIGGER_COMPILE, {
            query,
          });
        }
      });
    return false;
  }
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
  if (query.callbackAddress === undefined && !allowUnsetCallbackAddr) {
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

  return true;
}

export function assertCircuitCanBeCompiled(circuit: Circuit): boolean {
  if (circuit.defaultInputs === undefined) {
    vscode.window
      .showErrorMessage(
        "No default inputs found for this circuit",
        "Set default inputs",
      )
      .then((choice) => {
        if (choice === "Set default inputs") {
          vscode.commands.executeCommand(
            COMMAND_ID_UPDATE_CIRCUIT_DEFAULT_INPUT,
            {
              circuit,
            },
          );
        }
      });
    return false;
  }
  return true;
}
