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

class QueryHeaderItem extends vscode.TreeItem {
    constructor(private queries: Query[], private circuit: Circuit) {
        super('Queries');
        this.queries = queries;
        this.contextValue = "queryHeader";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.description = 'circuit queries';
    }
}

class QueryTreeItem extends vscode.TreeItem {
    constructor(private query: Query, private circuit: Circuit) {
        super(query.name);
        this.contextValue = "query";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }
}

class InputFileTreeItem extends vscode.TreeItem {
    constructor(private inputFile: string) {
        super("file: ");
        this.contextValue = "inputFile";
        this.description = inputFile;
    }
}

class CallbackAddrTreeItem extends vscode.TreeItem {
    constructor(private callbackAddress: string) {
        super("Callback: ");
        this.contextValue = "callbackAddress";
        this.description = callbackAddress;
    }
}

class RefundAddrTreeItem extends vscode.TreeItem {
    constructor(private refundAddress: string) {
        super("Refund Address: ");
        this.contextValue = "refundAddress";
        this.description = refundAddress;
    }
}

type TreeElem = Circuit | {query: Query, circuit: Circuit} | {queries: Query[], circuit: Circuit} | {query: Query, type: 'inputFile' | 'callbackAddress' | 'refundAddress'};

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
        } else if ('type' in element) {
            if (element.type === 'inputFile') {
                return new InputFileTreeItem(vscode.workspace.asRelativePath(element.query.inputPath.path));
            } else if (element.type === 'callbackAddress') {
                return new CallbackAddrTreeItem(element.query.callbackAddress);
            } else {
                return new RefundAddrTreeItem(element.query.refundAddress);
            }
        } else if ('queries' in element && 'circuit' in element) {
            return new QueryHeaderItem(element.queries as Query[], element.circuit as Circuit);
        } else {
            return new QueryTreeItem(element.query, element.circuit);
        }
    }

    getChildren(element?: TreeElem | undefined): Array<TreeElem> | undefined {
        if (element === undefined) {
            return this.stateStore.getState().circuits;
        } else if (element instanceof Circuit) {
            return [{queries: element.queries, circuit: element}];
        } else if ('queries' in element) {
            const children = [];
            for (const query of element.queries) {
                children.push({query: query, circuit: element.circuit});
            }
            return children;
        } else if ('query' in element) {
            return [{query: element.query, type: 'inputFile'},{query: element.query, type: 'callbackAddress'}, {query: element.query, type: 'refundAddress'}];
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
