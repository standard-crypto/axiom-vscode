import * as vscode from 'vscode';
import { COMMAND_ID_SHOW_CIRCUIT_SOURCE } from '../commands';
import { Circuit } from '../models/circuit';
import { Query } from '../models/query';
import { StateStore } from '../state';

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
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
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

type TreeElem = Circuit | Query | {address: string};

class CircuitsDataProvider implements vscode.TreeDataProvider<TreeElem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeElem | undefined | null | void> = new vscode.EventEmitter<TreeElem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeElem | undefined | null | void> = this._onDidChangeTreeData.event;
  
    constructor(private stateStore: StateStore) {}

    refresh(): void {
      this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeElem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element instanceof Circuit) {
            return new CircuitTreeItem(element);
        } else if ('address' in element) {
            return new CallbackAddrTreeItem(element.address);
        } else {
            return new QueryTreeItem(element);
        }
    }

    getChildren(element?: Circuit | Query | undefined): Array<TreeElem> | undefined {
        if (element === undefined) {
            return this.stateStore.getState().circuits;
        } else if (element instanceof Circuit) {
            return element.queries;
        } else if (element instanceof Query) {
            return [{address: element.callbackAddress}];
        }
    }
}

export class CircuitsTree {
    private dataProvider: CircuitsDataProvider;

    constructor(stateStore: StateStore) {
        this.dataProvider = new CircuitsDataProvider(stateStore);
        vscode.window.registerTreeDataProvider('axiom-circuits', this.dataProvider);
        vscode.window.createTreeView('axiom-circuits', {treeDataProvider: this.dataProvider});
    }

    public refresh(): void {
        this.dataProvider.refresh();
    }
}
