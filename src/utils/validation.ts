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
  COMMAND_ID_SHOW_SOURCE,
  COMMAND_ID_TRIGGER_COMPILE,
} from "../commands";
import { exportsDefaultInputs } from "./tsCompiler";

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

  if (!fs.existsSync(configFile)) {
    vscode.window
      .showErrorMessage(
        `Config file not found at ${configFilePath}`,
        "Open Axiom settings",
        `Create ${configFilePath}`,
      )
      .then(async (choice) => {
        if (choice === "Open Axiom settings") {
          vscode.commands.executeCommand(
            "workbench.action.openWorkspaceSettings",
            "axiom",
          );
        } else if (choice === `Create ${configFilePath}`) {
          await fs.promises.writeFile(
            configFile,
            'PROVIDER_URI_SEPOLIA=""\nPRIVATE_KEY_SEPOLIA=""',
          );
          const document = await vscode.workspace.openTextDocument(configFile);
          await vscode.window.showTextDocument(document);
        }
      });
    return undefined;
  }

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
  const circuitPath = circuit.source.filePath;
  if (!exportsDefaultInputs(circuit.source.filePath)) {
    vscode.window
      .showErrorMessage(
        "No default inputs found in the circuit file",
        "Set default inputs",
      )
      .then((choice) => {
        if (choice === "Set default inputs") {
          vscode.commands.executeCommand(COMMAND_ID_SHOW_SOURCE, {
            circuitPath,
          });
        }
      });
    return false;
  }
  return true;
}
