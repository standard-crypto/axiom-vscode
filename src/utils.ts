import * as vscode from 'vscode';
import * as fs from 'fs';
import { Circuit } from './models/circuit';
import { Query } from './models/query';

export function setBuildPathForCircuit(circuit: Circuit): void {
    let buildPathPrefix:string = vscode.workspace.getConfiguration().get('axiomOutputFolder') ?? '';

    if (buildPathPrefix.length === 0) {
        return;
    }

    if (!buildPathPrefix.endsWith('/')) {
        buildPathPrefix += '/';
    }
    circuit.buildPath = vscode.Uri.parse(buildPathPrefix  + 'build.json');
}

export function setOutputPathForQuery(query: Query): void {
    let outputPathPrefix:string = vscode.workspace.getConfiguration().get('axiomOutputFolder') ?? '';

    if (outputPathPrefix.length === 0) {
        return;
    }

    if (!outputPathPrefix.endsWith('/')) {
        outputPathPrefix += '/';
    }
    query.outputPath = vscode.Uri.parse(outputPathPrefix  + 'output.json');
}