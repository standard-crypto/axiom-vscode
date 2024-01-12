import * as vscode from "vscode";
import { CircuitsTree } from "../views/circuits-tree";
import { StateStore } from "../state";

export function registerCustomListeners(
  context: vscode.ExtensionContext,
  stateStore: StateStore,
  circuitsTree: CircuitsTree,
) {
  // Register a file system watcher that will refresh extension state whenever
  // a file in the `circuitFilesPattern` glob changes
  const circuitFilesWatcher = new CircuitsPatternFsWatcher(
    stateStore,
    context,
    circuitsTree,
  );
  circuitFilesWatcher.createOrUpdateWatcherFromSettings();

  // Another listener needed for handling changes to the extension's settings
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration("axiom")) {
        // update local state from the new settings
        await stateStore.loadFromExtensionSettings();

        // re-draw the circuits tree view
        circuitsTree.refresh();

        // edit the filesystem watcher, since `circuitFilesPattern` may have changed
        circuitFilesWatcher.createOrUpdateWatcherFromSettings();
      }
    }),
  );
}

class CircuitsPatternFsWatcher {
  private _watcher?: vscode.FileSystemWatcher;

  constructor(
    private _stateStore: StateStore,
    private _context: vscode.ExtensionContext,
    private _circuitsTree: CircuitsTree,
  ) {}

  createOrUpdateWatcherFromSettings() {
    // remove any existing filesystem watcher
    if (this._watcher !== undefined) {
      this._watcher.dispose();
    }

    // register a new watcher for the glob specified in the extension's settings
    const circuitFilesPattern = vscode.workspace
      .getConfiguration("axiom")
      .get<string>("circuitFilesPattern");
    if (circuitFilesPattern === undefined) {
      return;
    }

    this._watcher =
      vscode.workspace.createFileSystemWatcher(circuitFilesPattern);
    this._context.subscriptions.push(this._watcher);
    this._watcher.onDidChange(this._onChange.bind(this));
    this._watcher.onDidCreate(this._onChange.bind(this));
    this._watcher.onDidDelete(this._onChange.bind(this));
  }

  private async _onChange(uri: vscode.Uri) {
    console.log(`${uri.fsPath} changed, refreshing state`);

    // update local state from the new settings
    await this._stateStore.loadFromExtensionSettings();

    // re-draw the circuits tree view
    this._circuitsTree.refresh();
  }
}
