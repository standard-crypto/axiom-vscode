import * as vscode from "vscode";
import { compile } from "@axiom-crypto/circuit/cliHandler";
import { Circuit } from "../models/circuit";
import {
  assertCircuitCanBeCompiled,
  getConfigValueOrShowError,
} from "../utils";
import { Query } from "../models/query";
import { CONFIG_KEYS } from "../config";

export const COMMAND_ID_COMPILE = "axiom-crypto.compile";
export const COMMAND_ID_TRIGGER_COMPILE = "axiom-crypto.trigger-compile";

export class Compile implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_COMPILE,
        async (circuit: Circuit) => {
          compileCircuit(circuit);
        },
      ),
    );
  }
  dispose() {}
}

export class TriggerCompile implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_ID_TRIGGER_COMPILE,
        async ({ query }: { query: Query }) => {
          await compileCircuit(query.circuit);
        },
      ),
    );
  }
  dispose() {}
}

export async function compileCircuit(circuit: Circuit) {
  console.log("Compile", circuit);

  // make sure provider is set
  const provider = await getConfigValueOrShowError(
    CONFIG_KEYS.ProviderUriSepolia,
  );
  if (provider === undefined) {
    return;
  }

  // make sure the Circuit can compile
  if (!assertCircuitCanBeCompiled(circuit)) {
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Axiom",
      cancellable: false,
    },
    async (progress) => {
      progress.report({
        increment: 0,
        message: "Compiling circuit...",
      });

      await rawCompile(provider, circuit);

      progress.report({
        increment: 100,
        message: `Compiled successfully`,
      });
    },
  );

  vscode.window
    .showInformationMessage(
      `Compiled to ${vscode.workspace.asRelativePath(circuit.buildPath)}`,
      "Go to output",
    )
    .then(async (choice) => {
      if (choice === "Go to output") {
        const document = await vscode.workspace.openTextDocument(
          circuit.buildPath,
        );
        const editor = await vscode.window.showTextDocument(document);
      }
    });
}

export async function rawCompile(provider: string, circuit: Circuit) {
  await compile(circuit.source.filePath.fsPath, {
    stats: false,
    function: circuit.source.functionName,
    outputs: circuit.buildPath.fsPath,
    provider: provider,
  });
}
