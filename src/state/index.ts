import * as vscode from 'vscode';
import * as path from 'path';
import { Circuit, CircuitSource } from '../models/circuit';
import { extractCircuitName } from '../utils';

interface SerializedState {
    circuits: Array<{
        filePath: string,
        functionName: string,
        buildPath: string
    }>
}

export interface State {
    circuits: Circuit[];
}

export class StateStore {
    private static _STORAGE_KEY = "circuits";

    constructor(private context: vscode.ExtensionContext) {}

    private _serializeState(state: State): SerializedState {
        const serialized: SerializedState = {
            circuits: []
        };
        for (const circuit of state.circuits) {
            serialized.circuits.push({
                buildPath: circuit.buildPath.toString(),
                filePath: circuit.source.filePath.toString(),
                functionName: circuit.source.functionName,
            });
        }
        return serialized;
    }

    private _deserializeState(state: SerializedState): State {
        const deserialized: State = {
            circuits: []
        };
        for (const circuit of state.circuits) {
            deserialized.circuits.push(new Circuit(
                new CircuitSource(vscode.Uri.parse(circuit.filePath), circuit.functionName),
                vscode.Uri.parse(circuit.buildPath),
                undefined,
            ));
        }
        return deserialized;
    }

    async loadFromExtensionSettings(): Promise<State> {
        const config = vscode.workspace.getConfiguration('axiom');
        const buildDirectory = config.get<string>("buildDirectory") ?? 'build/axiom';
        const circuitFilesPattern = config.get<string>('circuitFilesPattern') ?? '';

        const state: State = {
            circuits: [],
        };

        const circuitFiles = await vscode.workspace.findFiles(circuitFilesPattern, "**​/node_modules/**");

        for (const circuitFileUri of circuitFiles) {
            const circuitName = extractCircuitName(circuitFileUri);
            if (circuitName === undefined) {
                throw new Error(`Unable to infer circuit name from ${circuitFileUri.fsPath}`);
            }

            const buildPath = path.join(this.context.asAbsolutePath(buildDirectory), `${circuitName}.json`);

            const circuit = new Circuit(
                new CircuitSource(circuitFileUri, circuitName),
                vscode.Uri.parse(buildPath),
                undefined
            );
            state.circuits.push(circuit);
        }

        this.context.workspaceState.update(StateStore._STORAGE_KEY, this._serializeState(state));
        return state;
    }

    getState(): State {
        const state = this.context.workspaceState.get<SerializedState>(StateStore._STORAGE_KEY);
        if (state === undefined) {
            return {
                circuits: [],
            };
        }
        return this._deserializeState(state);
    }
}
