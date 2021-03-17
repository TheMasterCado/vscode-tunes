// The module 'vscode' contains the VS Code extensibility API
import { stat } from "fs";
import * as vscode from "vscode";
import { authenticate } from "./authenticate";
import { __prod__ } from "./constants";
import { ExtensionState } from "./ExtensionState";
import { SidebarProvider } from "./SidebarProvider";
import { getCurrentlyPlaying, togglePlayback } from "./spotify";
import { updateCurrentlyPlaying } from "./vscodeTunesApi";

let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  ExtensionState.state = context.globalState;

  outputChannel = vscode.window.createOutputChannel("VSCode tunes");
  outputChannel.appendLine("Started extension.");
  // Create and register sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "vscode-tunes-sidebar",
      sidebarProvider
    )
  );

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );
  statusBarItem.command = "vscode-tunes.toggle-playback";
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-tunes.authenticate", async () => {
      await authenticate(context.extensionUri);
      await sidebarProvider.sendAccessTokenToView();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-tunes.reset", async () => {
      await ExtensionState.reset();
      await sidebarProvider.sendAccessTokenToView();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-tunes.toggle-playback",
      async () => {
        const currentlyPlaying = await togglePlayback();
        updateStatusBarItem(currentlyPlaying);
      }
    )
  );

  let currentlyPlaying: any;
  const intervalId = setInterval(async () => {
    try {
      if (ExtensionState.getAccessToken()) {
        const newCurrentlyPlaying = await getCurrentlyPlaying();
        if (currentlyPlaying?.uri !== newCurrentlyPlaying?.uri) {
          currentlyPlaying = newCurrentlyPlaying;
          updateStatusBarItem(currentlyPlaying);
          sidebarProvider._view?.webview.postMessage({
            type: "currentUserCurrentlyPlaying",
            value: currentlyPlaying,
          });
          await updateCurrentlyPlaying(currentlyPlaying);
          outputChannel.appendLine(
            `Current user is now listening to ${
              currentlyPlaying?.name || "nothing"
            }`
          );
        }
      }
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
      await ExtensionState.reset();
      await sidebarProvider.sendAccessTokenToView();
    }
  }, 10 * 1000); // every 10s
}

function updateStatusBarItem(currentlyPlaying: any) {
  if (currentlyPlaying) {
    if (currentlyPlaying.isPlaying) {
      statusBarItem.text = `$(stop-circle) ${currentlyPlaying.name}`;
    } else {
      statusBarItem.text = `$(play-circle) ${currentlyPlaying.name}`;
    }
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
