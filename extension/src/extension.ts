// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import { authenticate } from "./authenticate";
import { ExtensionState } from "./ExtensionState";
import { SidebarProvider } from "./SidebarProvider";
import { getCurrentlyPlaying } from "./spotify";
import {
  refreshSpotifyAccessToken,
  updateCurrentlyPlaying,
} from "./vscodeTunesApi";

export function activate(context: vscode.ExtensionContext) {
  ExtensionState.state = context.globalState;

  const output = vscode.window.createOutputChannel("VSCode tunes");
  output.show();
  output.appendLine("Started extension.");
  // Create and register sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "vscode-tunes-sidebar",
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-tunes.authenticate", () => {
      authenticate();
    })
  );

  let currentlyPlaying: any;
  const intervalId = setInterval(async () => {
    try {
      const newCurrentlyPlaying = await getCurrentlyPlaying();
      if (currentlyPlaying?.uri !== newCurrentlyPlaying?.uri) {
        currentlyPlaying = newCurrentlyPlaying;
        sidebarProvider._view?.webview.postMessage({
          type: "currentUserCurrentlyPlaying",
          value: currentlyPlaying,
        });
        await updateCurrentlyPlaying(currentlyPlaying);
        output.appendLine(
          `Current user is now listening to ${currentlyPlaying.name}`
        );
      }
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
    }
  }, 5 * 1000); // every 30s
}

// this method is called when your extension is deactivated
export function deactivate() {}
