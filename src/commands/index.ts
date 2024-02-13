import * as vscode from "vscode";
import { Compile, TriggerCompile } from "./compile";
import { Prove } from "./prove";
import { SendQuery } from "./send-query";
import { AddQuery } from "./add-query";
import { UpdateCircuitDefaultInput } from "./update-circuit";
import {
  DeleteQuery,
  RenameQuery,
  UpdateQueryCallback,
  UpdateQueryInput,
  UpdateQueryRefund,
  UpdateQueryCallbackExtraData,
} from "./update-query";
import { ConfigureParameters } from "./configure";
import { CircuitsTree } from "../views/circuits-tree";
import { StateStore } from "../state";
import { ShowSource } from "./show-source";

export * from "./compile";
export * from "./prove";
export * from "./send-query";
export * from "./add-query";
export * from "./show-source";
export * from "./update-circuit";

export function registerCommands(
  context: vscode.ExtensionContext,
  circuitsTree: CircuitsTree,
  stateStore: StateStore,
) {
  context.subscriptions.push(new Compile(context));
  context.subscriptions.push(new TriggerCompile(context));
  context.subscriptions.push(new Prove(context));
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
  context.subscriptions.push(
    new UpdateQueryCallbackExtraData(context, circuitsTree, stateStore),
  );
  context.subscriptions.push(new ShowSource(context));
  context.subscriptions.push(new ConfigureParameters(context));
}
