import * as vscode from 'vscode';
import * as path from 'path';
import { COMMAND_ID_SHOW_CIRCUIT_SOURCE } from '../commands';
import { Circuit, CircuitSource } from '../models/circuit';
import { Query } from '../models/query';

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
    getTreeItem(element: TreeElem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element instanceof Circuit) {
            return new CircuitTreeItem(element);
        } else if ('address' in element) {
            return new CallbackAddrTreeItem(element.address);
        } else {
            return new QueryTreeItem(element);
        }
    }
    getChildren(element?: Circuit | Query | undefined): vscode.ProviderResult<Array<TreeElem>> {
        if (element === undefined) {
            const circuit = new Circuit(
                new CircuitSource(vscode.Uri.parse("/Users/gavi/StandardCrypto/axiom-quickstart/axiom/circuit.ts"), "nonceIncrementor"),
                vscode.Uri.parse("/Users/gavi/StandardCrypto/axiom-quickstart/data/build.json"),
                vscode.Uri.parse("/Users/gavi/StandardCrypto/axiom-quickstart/data/inputs/defaultInput.json"),
            );
            circuit.queries.push(new Query({
                circuit: circuit,
                inputPath: vscode.Uri.parse("/Users/gavi/StandardCrypto/axiom-quickstart/data/inputs/input.json"),
                outputPath: vscode.Uri.parse("/Users/gavi/StandardCrypto/axiom-quickstart/data/output.json"),
                refundAddress: '0xB6a6c32CCe5B5E963277A66019309EBf13f59F12',
                callbackAddress: '0xB6a6c32CCe5B5E963277A66019309EBf13f59F12'
            }));
            return Promise.resolve([
                circuit
            ]);
        } else if (element instanceof Circuit) {
            return element.queries;
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
