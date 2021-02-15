import * as vscode from "vscode";
import { apiBaseUrl } from "./constants";

export const authenticate = () => {
  vscode.commands.executeCommand(
    "vscode.open",
    vscode.Uri.parse(`${apiBaseUrl}/auth/spotify`)
  );
};
