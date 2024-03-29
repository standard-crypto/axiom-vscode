import * as vscode from "vscode";
import { Circuit, CircuitSource } from "../models/circuit";
import { extractCircuitName, updateQueryOutput } from "../utils";
import { Query } from "../models/query";
import { CONFIG_KEYS } from "../config";

interface SerializedState {
  circuits: Array<{
    filePath: string;
    functionName: string;
    buildPath: string;
    queries: Array<SerializedQuery>;
  }>;
}

interface SerializedQuery {
  name: string;
  outputPath: string;
  inputPath?: string;
  callbackAddress?: `0x${string}`;
  callbackExtraData?: `0x${string}`;
  refundAddress?: `0x${string}`;
  // sendQueryArgs?: Awaited<ReturnType<typeof buildSendQuery>>;
  txId?: string;
}

export interface State {
  circuits: Circuit[];
}

export class StateStore {
  private static _STORAGE_KEY = "circuits";
  private _loaded: Promise<void>;

  constructor(private context: vscode.ExtensionContext) {
    // If there is no pre-existing state already stored, then it needs to be loaded in
    // from crawling the workspace's files
    if (
      this.context.workspaceState.get<SerializedState>(
        StateStore._STORAGE_KEY,
      ) === undefined
    ) {
      this._loaded = this.reloadFromExtensionSettings();
    } else {
      this._loaded = Promise.resolve();
    }
  }

  private _serializeState(state: State): SerializedState {
    const serialized: SerializedState = {
      circuits: [],
    };
    for (const circuit of state.circuits) {
      const serializedQueries = new Array<SerializedQuery>();
      for (const query of circuit.queries) {
        serializedQueries.push({
          name: query.name,
          outputPath: query.outputPath.path,
          callbackAddress: query.callbackAddress,
          inputPath: query.inputPath?.fsPath,
          callbackExtraData: query.callbackExtraData,
          refundAddress: query.refundAddress,
          txId: query.txId,
        });
      }
      serialized.circuits.push({
        buildPath: circuit.buildPath.toString(),
        filePath: circuit.source.filePath.toString(),
        functionName: circuit.source.functionName,
        queries: serializedQueries,
      });
    }
    return serialized;
  }

  private _deserializeState(state?: SerializedState): State {
    const deserialized: State = {
      circuits: [],
    };
    if (state === undefined) {
      return deserialized;
    }

    for (const circuit of state.circuits) {
      const newCircuit = new Circuit(
        new CircuitSource(
          vscode.Uri.parse(circuit.filePath),
          circuit.functionName,
        ),
        vscode.Uri.parse(circuit.buildPath),
      );
      const queries = new Array<Query>();
      for (const serializedQuery of circuit.queries) {
        const query = new Query({
          name: serializedQuery.name,
          circuit: newCircuit,
          outputPath: vscode.Uri.parse(serializedQuery.outputPath),
          callbackAddress: serializedQuery.callbackAddress,
          inputPath:
            serializedQuery.inputPath === undefined
              ? undefined
              : vscode.Uri.parse(serializedQuery.inputPath),
          refundAddress: serializedQuery.refundAddress,
        });
        query.callbackExtraData = serializedQuery.callbackExtraData;
        query.txId = serializedQuery.txId;
        queries.push(query);
      }
      newCircuit.queries = queries;
      deserialized.circuits.push(newCircuit);
    }
    return deserialized;
  }

  async reloadFromExtensionSettings(): Promise<void> {
    const config = vscode.workspace.getConfiguration("axiom");
    const buildDirectory =
      config.get<string>(CONFIG_KEYS.BuildDirectory) ?? "build/axiom";
    const circuitFilesPattern =
      config.get<string>(CONFIG_KEYS.CircuitFilesPattern) ?? "";

    const state: State = {
      circuits: [],
    };

    // check workspace for circuit files
    const circuitFiles = await vscode.workspace.findFiles(
      circuitFilesPattern,
      "**/node_modules/**",
    );
    state.circuits = this._loadCircuitsFromWorkspace(
      circuitFiles,
      buildDirectory,
    );

    // If there were existing queries already saved, then let's try to
    // re-attach them to this circuit.
    // If there's only one circuit in the workspace then it's reasonable
    // to assume that every query that's saved should be linked to that
    // circuit. If there's more than one circuit, then it will be difficult
    // to know which query should be assigned to which circuit if the
    // circuit definitions changed
    const previousState = this._deserializeState(
      this.context.workspaceState.get<SerializedState>(StateStore._STORAGE_KEY),
    );
    if (state.circuits.length === 1 && previousState.circuits.length === 1) {
      state.circuits[0].queries = previousState.circuits[0].queries;
      this.updateQueryOutputPaths(state.circuits[0].queries);
    }

    await this._saveState(state);
  }

  private _loadCircuitsFromWorkspace(
    circuitFiles: vscode.Uri[],
    buildDirectory: string,
  ): Circuit[] {
    const circuits = [];
    for (const circuitFileUri of circuitFiles) {
      const circuitName = extractCircuitName(circuitFileUri);
      if (circuitName === undefined) {
        throw new Error(
          `Unable to infer circuit name from ${circuitFileUri.fsPath}`,
        );
      }

      if (vscode.workspace.workspaceFolders === undefined) {
        throw new Error("Expected at least one open VSCode workspace");
      }

      const buildPath = vscode.Uri.joinPath(
        vscode.workspace.workspaceFolders[0].uri,
        buildDirectory,
        circuitName,
        "compiled.json",
      );

      const circuit = new Circuit(
        new CircuitSource(circuitFileUri, circuitName),
        buildPath,
      );
      circuits.push(circuit);
    }
    return circuits;
  }

  async updateState(circuit: Circuit): Promise<void> {
    const state = this._deserializeState(
      this.context.workspaceState.get<SerializedState>(StateStore._STORAGE_KEY),
    );
    for (const [index, existingCircuit] of state.circuits.entries()) {
      if (
        existingCircuit.source.filePath.path === circuit.source.filePath.path
      ) {
        state.circuits[index] = circuit;
      }
    }
    await this._saveState(state);
  }

  async getState(): Promise<State> {
    await this._loaded;

    const state = this._deserializeState(
      this.context.workspaceState.get<SerializedState>(StateStore._STORAGE_KEY),
    );
    return state;
  }

  private async _saveState(state: State) {
    await this.context.workspaceState.update(
      StateStore._STORAGE_KEY,
      this._serializeState(state),
    );
  }

  private updateQueryOutputPaths(queries: Query[]) {
    for (const query of queries) {
      updateQueryOutput(query);
    }
  }
}
