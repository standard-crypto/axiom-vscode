import * as vscode from 'vscode';

export class Circuit {
    get name(): string {
        return this.source.functionName;
    }

    constructor(public source: CircuitSource) {}
}

export class CircuitSource {
    constructor(public file: vscode.Uri, public functionName: string) {};
}
