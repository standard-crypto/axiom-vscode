import * as vscode from 'vscode';
import * as fs from 'fs';
import { Circuit, CircuitSource } from './models/circuit';
import { Query } from './models/query';

export type QueryConfig = {
    inputPath: string,
    outputPath: string,
    callbackAddress: string,
    refundAddress: string
};

export type CircuitConfig = {
    name: string,
    circuitPath: string,
    buildPath: string,
    defaultInputPath: string,
    queries: QueryConfig[]
};

export function getCwd(): vscode.Uri {
    const workspaces = vscode.workspace.workspaceFolders;
    if (workspaces !== undefined) {
        return workspaces[0].uri;
    }
    return vscode.Uri.parse('');
}

export function fileExists(path: string): boolean {
    return fs.existsSync(path);
}

export function getFullFilePath(relativePath: string): vscode.Uri {
    const cwd = getCwd();
    return vscode.Uri.joinPath(cwd, relativePath);
}

function getRawCircuitsConfig(): CircuitConfig[] {
    return vscode.workspace.getConfiguration().get('axiom.circuits') ?? [];
}

function getCircuitsConfig(): CircuitConfig[] {
    const circuitsConfig = getRawCircuitsConfig();
    for (let config of circuitsConfig) {
        config.circuitPath = getFullFilePath(config.circuitPath).fsPath;
        config.buildPath = getFullFilePath(config.buildPath).fsPath;
        config.defaultInputPath = getFullFilePath(config.defaultInputPath).fsPath;
        for (let queryConfig of config.queries) {
            queryConfig.inputPath = getFullFilePath(queryConfig.inputPath).fsPath;
            queryConfig.outputPath = getFullFilePath(queryConfig.outputPath).fsPath;
        }
    }
    return circuitsConfig;
}

export function createCircuits(): Circuit[] {
    const circuits = [];
    const circuitsConfig = getCircuitsConfig();
    for (let circuitDef of circuitsConfig) {
        console.log(circuitDef);
        if (fileExists(circuitDef.circuitPath) && fileExists(circuitDef.buildPath)) {
            const circuit = new Circuit(
                new CircuitSource(vscode.Uri.parse(circuitDef.circuitPath), circuitDef.name),
                vscode.Uri.parse(circuitDef.buildPath),
                vscode.Uri.parse(circuitDef.defaultInputPath),
            );
            for (let queryDef of circuitDef.queries) {
                if (fileExists(queryDef.inputPath)) {
                    circuit.queries.push(new Query({
                        circuit: circuit,
                        inputPath: vscode.Uri.parse(queryDef.inputPath),
                        outputPath: vscode.Uri.parse(queryDef.outputPath),
                        refundAddress: queryDef.refundAddress as `0x${string}`,
                        callbackAddress: queryDef.callbackAddress as `0x${string}`
                    }));
                }
            }
            circuits.push(circuit);
        }
    }
    return circuits;
}