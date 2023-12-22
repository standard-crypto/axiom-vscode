import * as vscode from 'vscode';
import * as fs from 'fs';
import { Circuit, CircuitSource } from './models/circuit';
import { Query } from './models/query';

export type QueryConfig = {
    name: string,
    inputPath: string,
    outputPath: string,
    callbackAddress: string,
    refundAddress: string
}

export type CircuitConfig = {
    name: string,
    circuitPath: string,
    buildPath: string,
    defaultInputPath: string,
    queries: QueryConfig[]
}

export function getCwd(): string {
    const workspaces = vscode.workspace.workspaceFolders;
    if (workspaces !== undefined) {
        const cwdUri = workspaces[0].uri.toString();
        return cwdUri.replace('file://', '');
    }
    return '';
}

export function listFiles(dir: string): string[] {
    const cleanedDir = dir.replaceAll('//', '/');
    return fs.readdirSync(cleanedDir);
}

export function fileExists(path: string): boolean {
    return fs.existsSync(path);
}

export function getFullFilePath(relativePath: string): string {
    const cwd = getCwd();
    const fullPath = cwd + '/' + relativePath;
    return fullPath.replaceAll('//', '/');
}

function getRawCircuitsConfig(): CircuitConfig[] {
    return vscode.workspace.getConfiguration().get('axiom.circuits') ?? [];
}

function getCircuitsConfig(): CircuitConfig[] {
    const circuitsConfig = getRawCircuitsConfig();
    for (let config of circuitsConfig) {
        config.circuitPath = getFullFilePath(config.circuitPath);
        config.buildPath = getFullFilePath(config.buildPath);
        config.defaultInputPath = getFullFilePath(config.defaultInputPath);
        for (let queryConfig of config.queries) {
            queryConfig.inputPath = getFullFilePath(queryConfig.inputPath);
            queryConfig.outputPath = getFullFilePath(queryConfig.outputPath);
        }
    }
    return circuitsConfig;
}

export function createCircuits(): Circuit[] {
    const circuits = [];
    const circuitsConfig = getCircuitsConfig();
    for (let circuitDef of circuitsConfig) {
        if (fileExists(circuitDef.circuitPath) && fileExists(circuitDef.buildPath)) {
            const circuit = new Circuit(
                new CircuitSource(vscode.Uri.parse(circuitDef.circuitPath), circuitDef.circuitPath),
                vscode.Uri.parse(circuitDef.buildPath),
                vscode.Uri.parse(circuitDef.defaultInputPath),
            );
            for (let queryDef of circuitDef.queries) {
                if (fileExists(queryDef.inputPath)) {
                    circuit.queries.push(new Query({
                        circuit: circuit,
                        name: queryDef.name,
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