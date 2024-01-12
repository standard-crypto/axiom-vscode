import * as vscode from "vscode";
import * as path from "path";
import { Circuit, CircuitSource } from "../models/circuit";
import { extractCircuitName } from "../utils";
import { Query } from "../models/query";

interface SerializedState {
  circuits: Array<{
    filePath: string;
    functionName: string;
    buildPath: string;
    defaultInputs: string;
    queries: Query[];
  }>;
}

export interface State {
  circuits: Circuit[];
}

interface QueryConfig {
  name: string;
  inputPath: string;
  outputPath: string;
  callbackAddress: string;
  refundAddress: string;
}

interface CircuitConfig {
  name: string;
  circuitPath: string;
  buildPath: string;
  defaultInputPath: string;
  queries: QueryConfig[];
}

export class StateStore {
  private static _STORAGE_KEY = "circuits";

  constructor(private context: vscode.ExtensionContext) {}

  private _serializeState(state: State): SerializedState {
    const serialized: SerializedState = {
      circuits: [],
    };
    for (const circuit of state.circuits) {
      serialized.circuits.push({
        buildPath: circuit.buildPath.toString(),
        filePath: circuit.source.filePath.toString(),
        functionName: circuit.source.functionName,
        defaultInputs: circuit.defaultInputs.path,
        queries: circuit.queries,
      });
    }
    return serialized;
  }

  private _deserializeState(state: SerializedState): State {
    const deserialized: State = {
      circuits: [],
    };
    for (const circuit of state.circuits) {
      const newCircuit = new Circuit(
        new CircuitSource(
          vscode.Uri.parse(circuit.filePath),
          circuit.functionName,
        ),
        vscode.Uri.parse(circuit.buildPath),
        vscode.Uri.parse(circuit.defaultInputs),
      );
      newCircuit.queries = circuit.queries;
      deserialized.circuits.push(newCircuit);
    }
    return deserialized;
  }

  async loadFromExtensionSettings(): Promise<State> {
    const config = vscode.workspace.getConfiguration("axiom");
    const buildDirectory =
      config.get<string>("buildDirectory") ?? "build/axiom";
    const circuitFilesPattern = config.get<string>("circuitFilesPattern") ?? "";

    const state: State = {
      circuits: [],
    };

    // first load circuits from settings.json
    const circuitsConfig = config.get<Array<CircuitConfig>>("circuits") ?? [];
    const savedCircuits = this.loadCircuitsFromSettingsJson(circuitsConfig);
    const existingCircuits: Set<string> = new Set();

    // add saved circuits to state
    state.circuits.push(...savedCircuits);
    savedCircuits.map((circuit) =>
      existingCircuits.add(circuit.source.filePath.path),
    );

    // then check workspace for circuit files
    const circuitFiles = await vscode.workspace.findFiles(
      circuitFilesPattern,
      "**​/node_modules/**",
    );
    const loadedCircuits = this.loadCircuitsFromWorkspace(
      existingCircuits,
      circuitFiles,
      buildDirectory,
    );

    // add loaded circuits to state
    state.circuits.push(...loadedCircuits);

    this.saveState(state);
    return state;
  }

  loadCircuitsFromSettingsJson(circuitsConfig: CircuitConfig[]): Circuit[] {
    const circuits = [];
    if (vscode.workspace.workspaceFolders) {
      const rootPath = vscode.workspace.workspaceFolders[0].uri;

      for (const circuit of circuitsConfig) {
        const savedCircuit = new Circuit(
          new CircuitSource(
            vscode.Uri.parse(path.join(rootPath.path, circuit.circuitPath)),
            circuit.name,
          ),
          vscode.Uri.parse(path.join(rootPath.path, circuit.buildPath)),
          circuit.defaultInputPath !== "/" && circuit.defaultInputPath !== ""
            ? vscode.Uri.parse(
                path.join(rootPath.path, circuit.defaultInputPath),
              )
            : vscode.Uri.parse("/"),
        );
        const queries = [];
        for (const query of circuit.queries) {
          queries.push(
            new Query({
              name: query.name,
              inputPath:
                query.inputPath !== "/" && query.inputPath !== ""
                  ? vscode.Uri.parse(path.join(rootPath.path, query.inputPath))
                  : vscode.Uri.parse("/"),
              outputPath: vscode.Uri.parse(
                path.join(rootPath.path, query.outputPath),
              ),
              callbackAddress: query.callbackAddress as `0x${string}`,
              refundAddress: query.refundAddress as `0x${string}`,
            }),
          );
        }
        savedCircuit.queries = queries;
        circuits.push(savedCircuit);
      }
    }
    return circuits;
  }

  loadCircuitsFromWorkspace(
    existingCircuitFiles: Set<string>,
    circuitFiles: vscode.Uri[],
    buildDirectory: string,
  ): Circuit[] {
    const circuits = [];
    for (const circuitFileUri of circuitFiles) {
      // exclude circuits loaded from settings.json
      if (existingCircuitFiles.has(circuitFileUri.path)) {
        continue;
      }
      const circuitName = extractCircuitName(circuitFileUri);
      if (circuitName === undefined) {
        throw new Error(
          `Unable to infer circuit name from ${circuitFileUri.fsPath}`,
        );
      }

      if (vscode.workspace.workspaceFolders) {
        const rootPath = vscode.workspace.workspaceFolders[0].uri;
        const buildPath = path.join(
          rootPath.path,
          buildDirectory,
          `${circuitName}.json`,
        );

        const circuit = new Circuit(
          new CircuitSource(circuitFileUri, circuitName),
          vscode.Uri.parse(buildPath),
          vscode.Uri.parse(""),
        );
        circuits.push(circuit);
      }
    }
    return circuits;
  }

  async updateState(circuit: Circuit): Promise<void> {
    const state = this.context.workspaceState.get<SerializedState>(
      StateStore._STORAGE_KEY,
    );
    if (state === undefined) {
      this.saveState({ circuits: [circuit] });
    } else {
      const deserializedState = this._deserializeState(state);
      for (const [
        index,
        existingCircuit,
      ] of deserializedState.circuits.entries()) {
        if (
          existingCircuit.source.filePath.path === circuit.source.filePath.path
        ) {
          deserializedState.circuits[index] = circuit;
        }
      }
      this.saveState(deserializedState);
    }
  }

  getState(): State {
    const state = this.context.workspaceState.get<SerializedState>(
      StateStore._STORAGE_KEY,
    );
    if (state === undefined) {
      return {
        circuits: [],
      };
    }
    const deserializedState = this._deserializeState(state);
    this.saveState(deserializedState);
    return deserializedState;
  }

  saveState(state: State) {
    const config = vscode.workspace.getConfiguration("axiom");
    const circuits = [];
    for (const circuit of state.circuits) {
      const queries = [];
      for (const query of circuit.queries) {
        queries.push({
          name: query.name,
          inputPath: vscode.workspace.asRelativePath(query.inputPath.path),
          outputPath: vscode.workspace.asRelativePath(query.outputPath.path),
          callbackAddress: query.callbackAddress,
          refundAddress: query.refundAddress,
        });
      }
      circuits.push({
        name: circuit.source.functionName,
        circuitPath: vscode.workspace.asRelativePath(
          circuit.source.filePath.path,
        ),
        buildPath: vscode.workspace.asRelativePath(circuit.buildPath.path),
        defaultInputPath: vscode.workspace.asRelativePath(
          circuit.defaultInputs.path,
        ),
        queries: queries,
      });
    }
    config.update("circuits", circuits);
    this.context.workspaceState.update(
      StateStore._STORAGE_KEY,
      this._serializeState(state),
    );
  }
}
