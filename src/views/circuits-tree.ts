import * as vscode from "vscode";
import { COMMAND_ID_SHOW_SOURCE } from "../commands";
import { Circuit } from "../models/circuit";
import { Query } from "../models/query";
import { StateStore } from "../state";

class CircuitTreeItem extends vscode.TreeItem {
  constructor(private circuit: Circuit) {
    super(circuit.name);
    this.command = {
      title: "Show Source",
      command: COMMAND_ID_SHOW_SOURCE,
      arguments: [{ path: circuit.source.filePath }],
    };
    this.contextValue = "circuit";
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    this.description = vscode.workspace.asRelativePath(circuit.source.filePath);
    this.tooltip =
      "An Axiom circuit. See extension settings to update the file pattern for discovering circuit files.";
  }
}

class QueryHeaderItem extends vscode.TreeItem {
  constructor(
    private queries: Query[],
    private circuit: Circuit,
  ) {
    super("Queries");
    this.queries = queries;
    this.contextValue = "queryHeader";
    if (queries.length > 0) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }
    this.tooltip =
      "Queries represent separate invocations of a circuit, each with distinct inputs and callback addresses.";
  }
}

class QueryTreeItem extends vscode.TreeItem {
  constructor(
    private query: Query,
    circuit: Circuit,
  ) {
    super(query.name);
    this.contextValue = "query";
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    this.tooltip =
      "A single Axiom query. Its input file, callback address, and refund address must be set before a query may be submitted.";
  }
}

class InputFileTreeItem extends vscode.TreeItem {
  constructor(inputPath?: vscode.Uri) {
    super("Input: ");
    this.command = {
      title: "Show Source",
      command: COMMAND_ID_SHOW_SOURCE,
      arguments: [{ path: inputPath }],
    };
    this.contextValue = "inputFile";
    if (inputPath === undefined) {
      this.description = "[unset]";
    } else {
      this.description = vscode.workspace.asRelativePath(inputPath.path);
    }
    this.tooltip =
      "A JSON file containing the circuit input values to use for this query";
  }
}

class CallbackAddrTreeItem extends vscode.TreeItem {
  constructor(callbackAddress?: string) {
    super("Callback: ");
    this.contextValue = "callbackAddress";
    this.description = callbackAddress ?? "[unset]";
    this.tooltip =
      "The address of an on-chain contract that will be called by Axiom when the query completes";
  }
}

class RefundAddrTreeItem extends vscode.TreeItem {
  constructor(refundAddress?: string) {
    super("Refund Address: ");
    this.contextValue = "refundAddress";
    this.description = refundAddress || "[unset]";
    this.tooltip =
      "An address to receive any gas refund from executing the query";
  }
}

class CallbackExtraDataTreeItem extends vscode.TreeItem {
  constructor(extraData?: string) {
    super("Callback Extra Data: ");
    this.contextValue = "extraData";
    this.description = extraData || "[unset]";
    this.tooltip = "Extra data for the query callback";
  }
}

type TreeElem =
  | Circuit
  | { query: Query; circuit: Circuit }
  | { queries: Query[]; circuit: Circuit }
  | {
      query: Query;
      type: "inputFile" | "callbackAddress" | "refundAddress" | "extraData";
    };

class CircuitsDataProvider implements vscode.TreeDataProvider<TreeElem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeElem | undefined | null | void
  > = new vscode.EventEmitter<TreeElem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TreeElem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private stateStore: StateStore) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeElem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    if (element instanceof Circuit) {
      return new CircuitTreeItem(element);
    } else if ("type" in element) {
      if (element.type === "inputFile") {
        return new InputFileTreeItem(element.query.inputPath);
      } else if (element.type === "callbackAddress") {
        return new CallbackAddrTreeItem(element.query.callbackAddress);
      } else if (element.type === "refundAddress") {
        return new RefundAddrTreeItem(element.query.refundAddress);
      } else {
        return new CallbackExtraDataTreeItem(element.query.callbackExtraData);
      }
    } else if ("queries" in element && "circuit" in element) {
      return new QueryHeaderItem(
        element.queries as Query[],
        element.circuit as Circuit,
      );
    } else {
      return new QueryTreeItem(element.query, element.circuit);
    }
  }

  async getChildren(
    parent?: TreeElem | undefined,
  ): Promise<Array<TreeElem> | undefined> {
    // No parent -> return list of Circuits
    if (parent === undefined) {
      const state = await this.stateStore.getState();
      return state.circuits;
    }

    // Parent is a Circuit -> return and Queries
    else if (parent instanceof Circuit) {
      const config = vscode.workspace.getConfiguration("axiom");
      return [{ queries: parent.queries, circuit: parent }];
    }

    // Parent is a list of Queries -> return a single Query
    else if ("queries" in parent) {
      const children = [];
      for (const query of parent.queries) {
        children.push({ query: query, circuit: parent.circuit });
      }
      return children;
    }

    // Parent is a single Query -> return a set of widgets for configuring the Query
    else if ("query" in parent) {
      return [
        { query: parent.query, type: "inputFile" },
        { query: parent.query, type: "callbackAddress" },
        { query: parent.query, type: "refundAddress" },
        { query: parent.query, type: "extraData" },
      ];
    }
  }
}

export class CircuitsTree {
  private dataProvider: CircuitsDataProvider;

  constructor(stateStore: StateStore) {
    this.dataProvider = new CircuitsDataProvider(stateStore);
    vscode.window.registerTreeDataProvider("axiom-circuits", this.dataProvider);
    vscode.window.createTreeView("axiom-circuits", {
      treeDataProvider: this.dataProvider,
    });
  }

  public refresh(): void {
    this.dataProvider.refresh();
  }
}
