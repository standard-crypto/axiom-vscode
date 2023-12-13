import * as vscode from 'vscode';

export class Circuit {
    get name(): string {
        return this.source.functionName;
    }

    constructor(
        public source: CircuitSource,
        public buildPath: vscode.Uri,
        public outputPath: vscode.Uri,
    ) {}
}

export class CircuitSource {
    // could replace this with ts.FunctionDeclaration, which has all this info.
    // getLineAndCharacterOfPosition converts from absolute position
    // fileName may have the full path, not sure
    constructor(public filePath: vscode.Uri, public functionName: string) {};
}
