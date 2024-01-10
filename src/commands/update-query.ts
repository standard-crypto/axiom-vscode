import * as vscode from 'vscode';
import { Query } from '../models/query';
import { CircuitsTree } from '../views/circuits-tree';
import { Circuit } from '../models/circuit';
import { StateStore } from '../state';

export const COMMAND_ID_RENAME_QUERY = 'axiom-crypto.rename-query';
export const COMMAND_ID_DELETE_QUERY = 'axiom-crypto.delete-query';
export const COMMAND_ID_UPDATE_QUERY_INPUT = 'axiom-crypto.update-query-input';
export const COMMAND_ID_UPDATE_QUERY_CALLBACK = 'axiom-crypto.update-query-callback';
export const COMMAND_ID_UPDATE_QUERY_REFUND = 'axiom-crypto.update-query-refund';


export class RenameQuery implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext, circuitsTree: CircuitsTree) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_RENAME_QUERY, async (treeItem: {query: Query, circuit: Circuit}) => {
                console.log('Rename Query', treeItem);
                const updatedName = await vscode.window.showInputBox({value: treeItem.query.name});
                if (updatedName !== undefined) {
                    treeItem.query.name = updatedName;
                    const buildPathPrefix = treeItem.circuit.buildPath.path.substring(0, treeItem.circuit.buildPath.path.lastIndexOf('/'));
                    const outputPath = (buildPathPrefix + '/' + treeItem.circuit.name + '/' + updatedName + '/output.json').replaceAll('//', '/');
                    treeItem.query.outputPath = vscode.Uri.parse(outputPath);
                    circuitsTree.refresh();
                }
            }),
        );
    }
    dispose() {}
}

export class DeleteQuery implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext, circuitsTree: CircuitsTree, stateStore: StateStore) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_DELETE_QUERY, async (treeItem: {query: Query | undefined, circuit: Circuit}) => {
                console.log('Delete Query', treeItem);
                treeItem.circuit.queries = treeItem.circuit.queries.filter(query => query !== treeItem.query);
                treeItem.query = undefined;
                stateStore.updateState(treeItem.circuit);
                circuitsTree.refresh();
            }),
        );
    }
    dispose() {}
}

export class UpdateQueryInput implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext, circuitsTree: CircuitsTree) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_UPDATE_QUERY_INPUT, async (treeItem: {query: Query}) => {
                console.log('Update Query Input', treeItem);
                const updatedInput = await vscode.window.showOpenDialog();
                if (updatedInput !== undefined) {
                    const inputPath = updatedInput[0].path;
                    console.log(inputPath);
                    treeItem.query.inputPath = vscode.Uri.parse(inputPath);
                    circuitsTree.refresh();
                }
            }),
        );
    }
    dispose() {}
}

export class UpdateQueryCallback implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext, circuitsTree: CircuitsTree) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_UPDATE_QUERY_CALLBACK, async (treeItem: {query: Query}) => {
                console.log('Update Query Callback', treeItem);
                const updatedCallback = await vscode.window.showInputBox({value: treeItem.query.callbackAddress});
                if (updatedCallback !== undefined) {
                    treeItem.query.callbackAddress = updatedCallback as `0x${string}`;
                    console.log(`updated query callback - ${treeItem.query.callbackAddress}`);
                    circuitsTree.refresh();
                }
            }),
        );
    }
    dispose() {}
}

export class UpdateQueryRefund implements vscode.Disposable {
    constructor(private context: vscode.ExtensionContext, circuitsTree: CircuitsTree) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_ID_UPDATE_QUERY_REFUND, async (treeItem: {query: Query}) => {
                console.log('Update Query Refund', treeItem);
                const updatedRefund = await vscode.window.showInputBox({value: treeItem.query.refundAddress});
                if (updatedRefund !== undefined) {
                    treeItem.query.refundAddress = updatedRefund as `0x${string}`;
                    circuitsTree.refresh();
                }
            }),
        );
    }
    dispose() {}
}