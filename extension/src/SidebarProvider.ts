import * as vscode from "vscode";
import { apiBaseUrl, apiWsUrl } from "./constants";
import { ExtensionState } from "./ExtensionState";
import { getNonce } from "./getNonce";
import { startPlayingUri } from "./spotify";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "media"),
        vscode.Uri.joinPath(this._extensionUri, "out"),
        vscode.Uri.joinPath(
          this._extensionUri,
          "node_modules",
          "vscode-codicons",
          "dist"
        ),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "getAccessToken": {
          this.sendAccessTokenToView();
          break;
        }
        case "authenticate": {
          vscode.commands.executeCommand("vscode-tunes.authenticate");
          break;
        }
        case "playSong": {
          try {
            await startPlayingUri(data.value.uri);
            vscode.window.showInformationMessage(
              `Started playing ${data.value.name}`
            );
          } catch (err) {
            vscode.window.showErrorMessage(err.message);
          }
          break;
        }
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  public async sendAccessTokenToView() {
    this._view?.webview.postMessage({
      type: "token",
      value: ExtensionState.getAccessToken(),
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "node_modules",
        "vscode-codicons",
        "dist",
        "codicon.css"
      )
    );
    const codiconsFontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "node_modules",
        "vscode-codicons",
        "dist",
        "codicon.ttf"
      )
    );
    const styleGlobalUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "global.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
          <!--
            Use a content security policy to only allow loading images from https or from our extension directory,
            and only allow scripts that have a specific nonce.
          -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; font-src ${codiconsFontUri}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
        <link href="${styleGlobalUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
          const tsvscode = acquireVsCodeApi();
          const apiBaseUrl = ${JSON.stringify(apiBaseUrl)};
          const apiWsUrl = ${JSON.stringify(apiWsUrl)};
        </script>
      </head>
      <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`;
  }
}
