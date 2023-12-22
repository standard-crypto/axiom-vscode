import * as vscode from 'vscode';
import { COMMAND_ID_SHOW_CIRCUIT_SOURCE } from '../commands';
import { Circuit } from '../models/circuit';
import { Query } from '../models/query';
import { createCircuits } from '../utils';

class CircuitTreeItem extends vscode.TreeItem {
    constructor(private circuit: Circuit) {
        super(circuit.name);
        this.command = {
            "title": "Show Source",
            "command": COMMAND_ID_SHOW_CIRCUIT_SOURCE,
            "arguments": [circuit],
        };
        this.contextValue = "circuit";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.description = vscode.workspace.asRelativePath(circuit.source.filePath);
    }
}

class QueryTreeItem extends vscode.TreeItem {
    constructor(private query: Query) {
        super(query.name);
        this.contextValue = "query";
        this.description = vscode.workspace.asRelativePath(query.inputPath);
    }
}

class CircuitsDataProvider implements vscode.TreeDataProvider<Circuit | Query> {
    getTreeItem(element: Circuit | Query): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element instanceof Circuit) {
            return new CircuitTreeItem(element);
        } else {
            return new QueryTreeItem(element);
        }
    }
    getChildren(element?: Circuit | Query | undefined): vscode.ProviderResult<Array<Circuit | Query>> {
        if (element === undefined) {
            const circuits = createCircuits();
            return circuits;
        } else if (element instanceof Circuit) {
            return element.queries;
        } else if (element instanceof Query) {
            return [];
        }
    }
}

export class CircuitsTree {
    constructor(context: vscode.ExtensionContext) {
        const dataProvider = new CircuitsDataProvider();
        vscode.window.registerTreeDataProvider('axiom-circuits', dataProvider);
        vscode.window.createTreeView('axiom-circuits', {treeDataProvider: dataProvider});
    }
}
