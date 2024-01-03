import * as vscode from 'vscode';
import { CircuitsTree } from '../views/circuits-tree';
import { StateStore } from '../state';

export function registerCustomListeners(context: vscode.ExtensionContext, stateStore: StateStore, circuitsTree: CircuitsTree) {
	// Register a file system watcher that will refresh extension state whenever
	// a file in the `circuitFilesPattern` glob changes
	const circuitFilesWatcher = new CircuitsPatternFsWatcher(stateStore, context, circuitsTree);
	circuitFilesWatcher.createOrUpdateWatcherFromSettings();
	
	// Another listener needed for handling changes to the extension's settings
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async (e) => {
		if (e.affectsConfiguration('axiom')) {
			// update local state from the new settings
			await stateStore.loadFromExtensionSettings();
			
			// re-draw the circuits tree view
			circuitsTree.refresh();
			
			// edit the filesystem watcher, since `circuitFilesPattern` may have changed
			circuitFilesWatcher.createOrUpdateWatcherFromSettings();
		}
	}));	
}

class CircuitsPatternFsWatcher {
	private watcher?: vscode.FileSystemWatcher;

	constructor(private stateStore: StateStore, private context: vscode.ExtensionContext, private circuitsTree: CircuitsTree) {}
	
	createOrUpdateWatcherFromSettings() {
		// remove any existing filesystem watcher
		if (this.watcher !== undefined) {
			this.watcher.dispose();
		}
		
		// register a new watcher for the glob specified in the extension's settings
		const circuitFilesPattern = vscode.workspace.getConfiguration('axiom').get<string>('circuitFilesPattern');
		if (circuitFilesPattern === undefined) {
			return;
		}

		this.watcher = vscode.workspace.createFileSystemWatcher(circuitFilesPattern);
		this.context.subscriptions.push(this.watcher);
		this.watcher.onDidChange(this.onChange.bind(this));
		this.watcher.onDidCreate(this.onChange.bind(this));
		this.watcher.onDidDelete(this.onChange.bind(this));
	}

	async onChange(uri: vscode.Uri) {
		console.log(`${uri.fsPath} changed, refreshing state`);

		// update local state from the new settings
		await this.stateStore.loadFromExtensionSettings();
			
		// re-draw the circuits tree view
		this.circuitsTree.refresh();
	}
}
