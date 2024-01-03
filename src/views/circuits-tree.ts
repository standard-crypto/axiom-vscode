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

class QueryHeaderItem extends vscode.TreeItem {
    constructor(private queries: Query[]) {
        super('Queries');
        this.queries = queries;
        this.contextValue = "queryHeader";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.description = 'circuit queries';
    }
}

class QueryTreeItem extends vscode.TreeItem {
    constructor(private query: Query) {
        super(query.name);
        this.contextValue = "query";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.description = vscode.workspace.asRelativePath(query.inputPath);
    }
}

class CallbackAddrTreeItem extends vscode.TreeItem {
    constructor(private address: string) {
        super("Callback: ");
        this.contextValue = "callbackAddress";
        this.description = address;
    }
}

type TreeElem = Circuit | Query | {address: string} | {queries: Query[]};

class CircuitsDataProvider implements vscode.TreeDataProvider<TreeElem> {
    getTreeItem(element: TreeElem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element instanceof Circuit) {
            return new CircuitTreeItem(element);
        } else if ('address' in element) {
            return new CallbackAddrTreeItem(element.address);
        } else if ('queries' in element) {
            return new QueryHeaderItem(element.queries as Query[]);
        } else {
            return new QueryTreeItem(element);
        }
    }
    getChildren(element?: Circuit | Query | undefined): vscode.ProviderResult<Array<TreeElem>> {
        if (element === undefined) {
            const circuits = createCircuits();
            return circuits;
        } else if (element instanceof Circuit) {
            return [{queries: element.queries}];
        } else if ('queries' in element) {
            return element.queries as Query[];
        } else if (element instanceof Query) {
            return [{address: element.callbackAddress}];
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
