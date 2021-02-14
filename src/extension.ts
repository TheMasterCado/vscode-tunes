// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
	// Create and register sidebar provider
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"vscode-tunes-sidebar",
			sidebarProvider
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-tunes.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from vscode-tunes!');
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
