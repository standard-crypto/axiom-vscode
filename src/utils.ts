import * as vscode from 'vscode';
import * as fs from 'fs';
import { Circuit } from './models/circuit';
import { Query } from './models/query';

export function setBuildPathForCircuit(circuit: Circuit): void {
    let buildPathPrefix:string = vscode.workspace.getConfiguration().get('axiomOutputFolder') ?? '';
    let buildPath: string;

    if (!buildPathPrefix.startsWith('/')) {
        buildPath = getCwd();
        if (!buildPath.endsWith('/')) {
            buildPath += '/';
        }
        buildPath += buildPathPrefix;
    } else {
        buildPath = buildPathPrefix;
    }

    if (!buildPath.endsWith('/')) {
        buildPath += '/';
    }
    circuit.buildPath = vscode.Uri.parse(buildPath  + 'build.json');
}

export function setOutputPathForQuery(query: Query): void {
    let outputPathPrefix:string = vscode.workspace.getConfiguration().get('axiomOutputFolder') ?? '';
    let outputPath:string;

    if (!outputPathPrefix.startsWith('/')) {
        outputPath = getCwd();
        if (!outputPath.endsWith('/')) {
            outputPath += '/';
        }
        outputPath += outputPathPrefix;
    } else {
        outputPath = outputPathPrefix;
    }

    if (!outputPath.endsWith('/')) {
        outputPath += '/';
    }
    query.outputPath = vscode.Uri.parse(outputPath  + 'output.json');
}

function getCwd(): string {
    const workspaces = vscode.workspace.workspaceFolders;
    if (workspaces !== undefined) {
        const cwdUri = workspaces[0].uri.toString();
        return cwdUri.replace('file://', '');
    }
    return '';
}