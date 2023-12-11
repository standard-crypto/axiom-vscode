import * as vscode from 'vscode';
import { COMMAND_ID_SHOW_CIRCUIT_SOURCE } from '../commands';
import { Circuit, CircuitSource } from '../models/circuit';

export class CircuitTreeItem extends vscode.TreeItem {
    constructor(private circuit: Circuit) {
        super("Test Circuit");
        this.command = {
            "title": "Show Source",
            "command": COMMAND_ID_SHOW_CIRCUIT_SOURCE,
            "arguments": [circuit],
        };
    }
}

class CircuitsDataProvider implements vscode.TreeDataProvider<Circuit> {
    getTreeItem(element: Circuit): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return new CircuitTreeItem(element);
    }
    getChildren(element?: Circuit | undefined): vscode.ProviderResult<Circuit[]> {
        return Promise.resolve([
            new Circuit(new CircuitSource(vscode.Uri.parse("/Users/gavi/Downloads/axiom-repl-starter/src/components/axiom/circuit/circuit.ts"), "circuit")),
        ]);
    }
}

export class CircuitsTree {
    constructor(context: vscode.ExtensionContext) {
        const dataProvider = new CircuitsDataProvider();
        vscode.window.registerTreeDataProvider('axiom-circuits', dataProvider);
        vscode.window.createTreeView('axiom-circuits', {treeDataProvider: dataProvider});
    }
}
