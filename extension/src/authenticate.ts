import * as vscode from "vscode";
import { apiBaseUrl } from "./constants";
import polka from "polka";
import { ExtensionState } from "./ExtensionState";
import { join } from "path";
import fs from "fs";

export const authenticate = (uri: vscode.Uri): Thenable<boolean> => {
  return new Promise<boolean>((resolve, _) => {
    const app = polka();

    app.get("/auth/:authData", async (req: any, res: any) => {
      const { authData } = req.params;
      if (!authData) {
        res.writeHead(302, {
          Location: `${apiBaseUrl}/auth-finished?error=true`,
        });
        res.end();
        return;
      }

      const authDataContent = authData.split(":");
      const accessToken = authDataContent[0];
      const spotifyAccessToken = authDataContent[1];
      const spotifyRefreshToken = authDataContent[2];

      await ExtensionState.setAccessToken(accessToken);
      await ExtensionState.setSpotifyTokens(
        spotifyAccessToken,
        spotifyRefreshToken
      );

      res.writeHead(302, {
        Location: `${apiBaseUrl}/auth-finished`,
      });
      res.end();

      app.server?.close();
      resolve(true);
    });

    app.listen(53698, (err: Error) => {
      if (err) {
        vscode.window.showErrorMessage(err.message);
        resolve(false);
      } else {
        vscode.commands.executeCommand(
          "vscode.open",
          vscode.Uri.parse(`${apiBaseUrl}/auth/spotify`)
        );
      }
    });
  });
};
