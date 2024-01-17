import * as vscode from "vscode";
import { Compile } from "./compile";
import { Run } from "./run";
import { SendQuery } from "./send-query";
import { AddQuery } from "./add-query";
import { UpdateCircuitDefaultInput } from "./update-circuit-default-input";
import {
  DeleteQuery,
  RenameQuery,
  UpdateQueryCallback,
  UpdateQueryInput,
  UpdateQueryRefund,
} from "./update-query";
import { ConfigureParameters } from "./configure";
import { CircuitsTree } from "../views/circuits-tree";
import { StateStore } from "../state";
import { ShowSource } from "./show-source";

export * from "./compile";
export * from "./run";
export * from "./send-query";
export * from "./add-query";
export * from "./show-source";
export * from "./update-circuit-default-input";

export function registerCommands(
  context: vscode.ExtensionContext,
  circuitsTree: CircuitsTree,
  stateStore: StateStore,
) {
  context.subscriptions.push(new Compile(context, stateStore));
  context.subscriptions.push(new Run(context));
  context.subscriptions.push(new SendQuery(context));
  context.subscriptions.push(new AddQuery(context, circuitsTree, stateStore));
  context.subscriptions.push(
    new UpdateCircuitDefaultInput(context, circuitsTree, stateStore),
  );
  context.subscriptions.push(
    new RenameQuery(context, circuitsTree, stateStore),
  );
  context.subscriptions.push(
    new DeleteQuery(context, circuitsTree, stateStore),
  );
  context.subscriptions.push(
    new UpdateQueryInput(context, circuitsTree, stateStore),
  );
  context.subscriptions.push(
    new UpdateQueryCallback(context, circuitsTree, stateStore),
  );
  context.subscriptions.push(
    new UpdateQueryRefund(context, circuitsTree, stateStore),
  );
  context.subscriptions.push(new ShowSource(context));
  context.subscriptions.push(new ConfigureParameters(context));
}
